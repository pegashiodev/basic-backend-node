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
import { validatePromotion, updateAfiliatePromotion } from '../../promotions/promotionsHandler.js';

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
            console.log(item)
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
    

            // AÑADIMOS EL TOTAL DE LA COMPRA para luego pagar al afiliado
            totalAmountInCentsBeforeDiscount = currentProduct.priceInCents * quantity;
            
            // Si hay req.promotion es que el promoCode es valido y aplicamos el descuento
            if(req.promotion){
                currentProduct.priceInCents = Math.round(currentProduct.priceInCents - (currentProduct.priceInCents * (req.promotion.discountPercent / 100)))
            }
            
            const itemTotalCents = currentProduct.priceInCents * quantity;
            // PRECIO PAGADO POR EL USUARIO CON EL DESCUENTO DEL AFILIADO
            totalAmountInCents += itemTotalCents;
            if(req.promotion){
                req.promotion.amountBeforeDisconunt = totalAmountInCentsBeforeDiscount
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

        const orderId = new ObjectId().toHexString();
        const customOrderId = `ord_${orderId}_${month.toLowerCase()}_${year}`;
        
        req.order = {
            orderId: customOrderId,
            verifiedOrderItems: verifiedOrderItems,
            totalAmountInCents: totalAmountInCents
        }
        // Si habia promocion añadimos mas informacion al pedido: code, percio base, descuento aplicado, ...
        if(req.promotion){
            req.order.promotion = {
                affiliate: req.promotion.affiliate,
                endpoint: req.promotion.endpoint,
                type: req.promotion.type,
                promoCode: promoCode,
                amountBeforeDiscount: totalAmountInCentsBeforeDiscount,
                discountPercent: req.promotion.discountPercent
            }
            
        }
        
        
        // 5. Determinar host base según entorno (DEV vs PROD)
        const baseUrl = process.env.MODE === 'DEV' ? systemConfig.HOST_DEV : systemConfig.HOST_PROD;
        const protocol = process.env.MODE === 'DEV' ? 'http' : 'https';

        // 6. Crear la sesión en Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'bizum'],
            mode: 'payment',
            line_items: lineItemsForStripe,
            customer_email: userEmail || undefined,
            // En metadata viaja el orderId para recuperarlo en el Webhook de forma segura
            metadata: {
                orderId: customOrderId,
                userId: String(userId || '')
            },
            // Las páginas de éxito/cancelación solo sirven para mostrar la interfaz visual
            success_url: `${protocol}://${baseUrl}/success-checkout.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${protocol}://${baseUrl}/cancel-checkout.html?order_id=${customOrderId}`,
        });

        if(!session || !session.id){
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 567,
                    message: `ERROR de conexion con el PAY PROVIDER`
            }));
        }

        // AÑADIMOS EL session.id de Stripe al pedido
        req.order.stripeSessionId = session.id

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

        // 8. Si hemos aplicado el promoCode lo hemos de guardar en la Base de Datos para pagar posteriormente al afiliado
        if(req.promotion){
            await updateAfiliatePromotion(req.promotion, user)
        }

        // 9. Responder con la URL de pago al cliente
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'ok',
            code: 200,
            message: 'Sesión de checkout creada con éxito.',
            checkoutData: {
                checkoutUrl: session.url,
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