/**
 * HANDLER PARA INICIAR EL CHECKOUT CON STRIPE (POST /api/checkout)
 * 
 * @param {import('node:http').IncomingMessage} req - Objeto de petición enriquecido (incluye req.body y req.user si está autenticado)
 * @param {import('node:http').ServerResponse} res - Objeto de respuesta HTTP nativo
 */

import Stripe from 'stripe';
import {ObjectId} from "mongodb"
import systemConfig from '../../globalData/systemConfig.js';
import { redisClient } from '../../db/openRedis.js';
import { createOrder, updateOrderStripeSession } from '../../orders/orderService.js';
import { validatePromotion } from '../../promotions/promotionsHandler.js';

process.loadEnvFile();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//     apiVersion: '2026-07-29.dahlia'
// });

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY_TEST)

// OJO -> REVISAR, YO LAMMO CART Y AQUI SE PONE ITEMS, ...REVISAR TODO

export default async function checkOutHandler(req, res) {
    const [, month, day , year] = new Date().toString().split(' ');

    try {
        const {items, shippingAddress, billingAddress,  paymentMethod, promoCode}= req.body.order || {};
        const user = req.user || null; // Inyectado previamente por middleware de autenticación

        if (!user) {
            console.log("NO HAY USER EN EL CHECKOUT ??.")

            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 434,
                message: 'NO hay User en el Checkout '
            }));
        }
        // 1.- Validamos el promoCode si lo tenemos en el body
        if(systemConfig.HAS_PROMO_CODES_CHECKOUT && promoCode){
            console.log("VAlidadmos el promoCode")
            req.body.promoCode = promoCode
            const result_promoCode = await validatePromotion(req, "CHECKOUT")
            if(result_promoCode.status !== "ok"){
                res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: result_promoCode.status,
                    code: result_promoCode.code,
                    message: result_promoCode.message
                }));
            }
        }

        // 2. Validación de entrada: verificar que el carrito contenga elementos
        if (!items || !Array.isArray(items) || items.length === 0) {
            console.log("El carrito contiene productos no válidos: FORMATO ??.")
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 432,
                message: 'El carrito contiene productos no válidos: FORMATO ??.'
            }));
        }

        // 3. Extracción segura de la identidad del usuario (soporta formato plano y compuesto _id)
        const userId = user?.userId || (typeof user?._id === 'object' ? user?._id?._id : user?._id) || null;
        const userEmail = user?.email || (typeof user?._id === 'object' ? user?._id?.email : null) || req.body?.email || null;

        // 4. Validar productos y calcular precios directamente desde la Base de Datos
        const lineItemsForStripe = [];
        const verifiedOrderItems = [];
        let paymentMode;            // [SUBSCRIPTION, ONCE]
        let paymentModeFail = false;
        let totalAmountInCents = 0;
        let totalAmountInCentsBeforeDiscount = 0;

        for (const item of items) {
            if (!item.productId) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                console.log("Producto SIN PRODUCT-ID")
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 430,
                    message: 'Uno de los elementos del carrito carece de ID de producto.'
                }));
            }
       
            // UTILIZAMOS REDIS PARA ACCEDER A LOS PRODUCTOS
            const currentProductString = await redisClient.get(`product:${item.productId}`);
            const currentProduct = JSON.parse(currentProductString)
            
            if (!currentProduct || !currentProduct.active) {
                console.log("Producto NO DISPONIBLE")
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 431,
                    message: `El producto con ID ${item.productId} no está disponible o no existe.`
                }));
            }
            if (!currentProduct.paymentMode ) {
                console.log("Producto SIN PAYMENT MODE ?? ")
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 439,
                    message: `El producto con ID ${item.productId} NO TIENE  MODO DE PAGO.`
                }));
            }
            // COMPROBAMOS QUE EL PRECIO ES EL QUE TENEMOS EN EL SERVER
            if(item.priceInCents !== currentProduct.priceInCents){
                console.log("NO COINCIDE EL PRECIO DEL PRODUCTO CON EL DEL SERVER")
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 436,
                    message: `El precio de  ${item.productId} no es correcto.`
                }));
            }
            // COMPROBAMOS EL STOCK
            if(currentProduct.stock !== "INFINITE" && currentProduct.stock <= 0){
                console.log("Producto SIN STOCK")
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 435,
                    message: `El producto con ID ${item.productId} TIENE STOCK CERO.`
                }));
            }

            const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
            
            /*
            function calcularPrecioParaStripe(precioOriginalEuros, porcentajeDescuento) {
                // 1. Convertir a centavos
                const precioEnCentavos = precioOriginalEuros * 100; 
                
                // 2. Calcular el descuento
                const descuento = precioEnCentavos * (porcentajeDescuento / 100);
                
                // 3. Restar y aplicar Math.round() al resultado final en centavos
                const precioFinalEnCentavos = Math.round(precioEnCentavos - descuento);
                
                return precioFinalEnCentavos;
            }
              
            // Ejemplo: Producto de 19.99€ con 15% de descuento
            // 19.99 - 15% = 16.9915€
            console.log(calcularPrecioParaStripe(19.99, 15)); // Resultado: 1699 (16.99€ exactamente)

            */

            // Verificacmos que todos los items tienen el mismo modo de pago: (ONCE / SUBSCRIPTION)
            if(!paymentMode){
                paymentMode = currentProduct.paymentMode
            }else{
                if(paymentMode !== currentProduct.paymentMode){
                    paymentModeFail = true;
                    break;
                }
            }

            // SI EL PRODUCTO NO ES SUBSCIPCION NOSOTROS GETIONAMOS EL PROMOCODE Y HACEMOS EL DESCUENTO ANTES DE ENVIAR A STRIPE
            // LOS DESCUENTOS EN SUBSCRIPCIONES SE HACEN CON CUPONES DE STRIPE
            if(paymentMode === "ONCE"){
                // AÑADIMOS EL TOTAL DE LA COMPRA SIN DESCUENTO para luego pagar al afiliado
                totalAmountInCentsBeforeDiscount += currentProduct.priceInCents * quantity;
                
                // Si hay req.promotion es que el promoCode es valido y aplicamos el descuento
                if(req.body.promotion && req.body.promotion.type === "DISCOUNT"){
                    currentProduct.priceInCents = Math.round(currentProduct.priceInCents - (currentProduct.priceInCents * (req.body.promotion.discountPercent / 100)))
                }
                
                // ACTUALIZAMOS EL PRECIO PAGADO POR EL USUARIO CON EL DESCUENTO DEL AFILIADO
                totalAmountInCents += currentProduct.priceInCents * quantity
            }

            //Almacenamos el item completo para luego manipularlo en processOrderDelivery
            verifiedOrderItems.push(currentProduct);

            // Estructura requerida por Stripe Checkout API
            lineItemsForStripe.push({
                price_data: {
                    currency: currentProduct.currency || 'eur',
                    product_data: {
                        name: currentProduct.title,
                    },
                    unit_amount: currentProduct.priceInCents,
                },
                quantity: quantity,
            });
        }

        // LOS ITEMS TIENEN DISTINTOS FORMAS DE PAGO: HAN DE SER TODOS IGUALES (ONCE / SUSCRIPTION)
        if(paymentModeFail){
            console.log("Productos CON DISTINTAS FORMAS DE PAGO")
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 437,
                message: `Productos del carrito con distinta forma de Pago.`
            }));
        }
    
        // Si hay promotio, almacenamos el coste del servicio antes del descuento para liquidar posteriormente al afiliado
        if(req.body.promotion){
            req.body.promotion.amountBeforeDisconunt = totalAmountInCentsBeforeDiscount
        }

        const orderId = new ObjectId();
        
        req.order = {
            language: req.urlData.language,
            orderId: orderId,
            verifiedOrderItems: verifiedOrderItems,
            totalAmountInCents: totalAmountInCents
        }
        // Si habia promocion añadimos mas informacion al pedido: code, percio base, descuento aplicado, ...
        if(req.body.promotion){
            if(paymentMode === "ONCE"){

                req.order.promotion = {
                    mode: "ONCE",
                    affiliate: req.body.promotion.affiliate,
                    endpoint: req.body.promotion.endpoint,
                    type: req.body.promotion.type,
                    promoCode: promoCode,
                    amountBeforeDiscount: totalAmountInCentsBeforeDiscount,
                    discountPercent: req.body.promotion.discountPercent
                }
                req.order.totalAmountInCentsBeforeDiscount = totalAmountInCentsBeforeDiscount
            
            // SI ES UNA SUBSCRIPTION SE TRAMITARA DE FORMA DISTINTA
            }else if(paymentMode === "SUBSCRIPTION"){

                req.order.promotion = {
                    mode: "SUBSCRIPTION",
                    affiliate: req.body.promotion.affiliate,
                    endpoint: req.body.promotion.endpoint,
                    type: req.body.promotion.type,
                    promoCode: promoCode
                }
            }
        }
        
        // 5. Determinar host base según entorno (DEV vs PROD)
        const baseUrl = process.env.MODE === 'DEV' ? systemConfig.HOST_DEV : systemConfig.HOST_PROD;
        const protocol = process.env.MODE === 'DEV' ? 'http' : 'https';

        
        // ENVIAMOS A STRIPE SEGUN EL MODO DE PAGO DE LOS PRODUCTOS DEL CARRITO
        if(paymentMode === "ONCE"){

            // 6. PAGO UNICO: -> Crear la sesión en Stripe Checkout 
            const stripeSession = await stripe.checkout.sessions.create({
                payment_method_types: ['card', 'bizum'],
                mode: 'payment',
                line_items: lineItemsForStripe,
                customer_email: userEmail || undefined,
                // En metadata viaja el orderId para recuperarlo en el Webhook de forma segura
                metadata: {
                    orderId: orderId.toString(),
                    userId: userId.toString() || ''
                },
                // Las páginas de éxito/cancelación solo sirven para mostrar la interfaz visual
                success_url: `${protocol}://${baseUrl}/success-checkout.html?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${protocol}://${baseUrl}/cancel-checkout.html?order_id=${orderId.toString()}`,
            });
        

        }else if(paymentMode === "SUBSCRIPTION"){

            // 7.- PAGO POR SUSCRIPCION: 
    
            /*
            // Definir el Price ID de Stripe según lo que eligió el usuario (Mensual o Anual)
            // Estos IDs empiezan por "price_..." y los copias desde tu Dashboard de Stripe
            const stripePriceId = planUsuario === 'MONTH' ? 'price_1M23MonthlyID...' : 'price_1M23YearlyID...';
    
            // 2. Crear la sesión en Stripe Checkout para Suscripciones
            const stripeSession = await stripe.checkout.sessions.create({
                payment_method_types: ['card'], 
                
                // CAMBIO CLAVE 1: El modo ahora es 'subscription'
                mode: 'subscription', 
                
                // CAMBIO CLAVE 2: Estructura para suscripciones usando el ID del precio
                line_items: [
                    {
                        price: stripePriceId, // El ID del precio mensual o anual
                        quantity: 1,
                    },
                ],
                 // APLICAR EL DESCUENTO AQUÍ si esta habilitado en Stripe
                discounts: [
                    {
                        coupon: 'ID_DE_TU_CUPON_DE_STRIPE', // El ID que copiaste en el paso 1 (ej. '50OFF1M')
                    },
                ],
                
                customer_email: userEmail || undefined,
                
                // CAMBIO CLAVE 3: En el metadata pasas el userId para asociarlo en el Webhook
                metadata: {
                    orderId: orderId.toString(),
                    userId: userId.toString()
                },
                
                // En las suscripciones, el éxito suele redirigir al panel de control/dashboard de tu SaaS
                success_url: `${protocol}://${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${protocol}://${baseUrl}/pricing`,
            });
    
            */
        
        }else{

            console.log("No hay MODO de pago NO ES CORECCTO")
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 437,
                message: `Modo de pago incorrecto`
            }));

        }


        if(!stripeSession || !stripeSession.id){
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 567,
                    message: `ERROR de conexion con el PAY PROVIDER`
            }));
        }

        // AÑADIMOS EL session.id de Stripe al pedido
        req.order.stripeSessionId = stripeSession.id

        //7.- Guardamos el pedido en estado PENDING en MongoDB
        const result_createOrder = await createOrder(req.user, req.order);
        if(result_createOrder.status !== 'ok'){
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 531,
                    message: `NO SE HA podido crear el pedido en la DB: -> cancelamos Checkout`
            }));
        }

        // 9. Responder con la URL de pago al cliente
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'ok',
            code: 200,
            message: 'Sesión de checkout creada con éxito.',
            checkoutData: {
                checkoutUrl: stripeSession.url,
                orderId: customOrderId
            }
        }));

    } catch (error) {
        console.error('❌ Error en checkOutHandler:', error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 530,
            message: 'Error interno del servidor al procesar la sesión de pago.'
        }));
    }
}