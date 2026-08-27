/**
 * HANDLER PARA INICIAR EL CHECKOUT CON STRIPE (POST /api/checkout)
 * 
 * @param {import('node:http').IncomingMessage} req - Objeto de petición enriquecido (incluye req.body y req.user si está autenticado)
 * @param {import('node:http').ServerResponse} res - Objeto de respuesta HTTP nativo
 */

import Stripe from 'stripe';
import crypto from 'node:crypto';
import systemConfig from '../../globalData/systemConfig.js';
import { redisClient } from '../../db/openRedis.js';
import { createOrder } from '../../orders/orderService.js';

process.loadEnvFile();
// Importa los servicios / métodos de tu base de datos MongoDB
// import { getProductById } from '../../products/productService.js';
// import { createOrder, updateOrderStripeSession } from '../../orders/orderService.js';



// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//     apiVersion: '2026-07-29.dahlia'
// });

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY_TEST)

// OJO -> REVISAR, YO LAMMO CART Y AQUI SE PONE ITEMS, ...REVISAR TODO

export default async function checkOutHandler(req, res) {
    try {
        const {items, shippingAddress, billingAddress,  paymentMethod, promoCode}= req.body.order || {};
        const user = req.user || null; // Inyectado previamente por middleware de autenticación

        // 1.- Validamos el promoCode si lo tenemos en el body

        // 2. Validación de entrada: verificar que el carrito contenga elementos
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 432,
                message: 'El carrito no contiene productos válidos.'
            }));
        }

        // 3. Extracción segura de la identidad del usuario (soporta formato plano y compuesto _id)
        const userId = user?.userId || (typeof user?._id === 'object' ? user?._id?._id : user?._id) || null;
        const userEmail = user?.email || (typeof user?._id === 'object' ? user?._id?.email : null) || req.body?.email || null;

        // 4. Validar productos y calcular precios directamente desde la Base de Datos
        const lineItemsForStripe = [];
        const verifiedOrderItems = [];
        let totalAmountInCents = 0;

        for (const item of items) {
            if (!item.productId) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 430,
                    message: 'Uno de los elementos del carrito carece de ID de producto.'
                }));
            }

            // Consulta a MongoDB por ID de producto
            // const currentProduct = await getProductById(item.productId);
            
            // UTILIZAMOS REDIS PARA ACCEDER A LOS PRODUCTOS
            console.log(item)
            const currentProductString = await redisClient.get(`product:${item.productId}`);
            const currentProduct = JSON.parse(currentProductString)
            
            if (!currentProduct || !currentProduct.active) {
                res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 431,
                    message: `El producto con ID ${item.productId} no está disponible o no existe.`
                }));
            }

            const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
            const itemTotalCents = currentProduct.priceInCents * quantity;
            totalAmountInCents += itemTotalCents;

            // Almacenamos el snapshot del producto para el pedido en DB
            // verifiedOrderItems.push({
            //     productId: currentProduct.productId,
            //     name: currentProduct.title,
            //     unitPriceInCents: currentProduct.priceInCents,
            //     quantity: quantity,
            //     totalCents: itemTotalCents,
            // });

            //Almacenamos el item completo para luego manipularlo en afterPaymentOrder 
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

        // 5. Estructura del Pedido acorde al esquema de MongoDB
        const orderId = `ord_${crypto.randomUUID()}`;
        const now = new Date();
        
        const newOrder = {
            _id: {
                orderId: orderId,
                userId: userId,
                email: userEmail
                
            },
            orderId: orderId,
            userId: userId,
            customerEmail: userEmail,
            items: verifiedOrderItems,
            totalAmountInCents: totalAmountInCents,
            currency: 'eur',
            status: 'PENDING',          // PENDING -> SUCCESS / CANCELED / EXPIRED
            stripeSessionId: null,
            paymentDetails: null,
            createdAt: now,
            updatedAt: now
        };

        // Guardamos el pedido en estado PENDING en MongoDB
        await createOrder(newOrder);
        
        // 6. Determinar host base según entorno (DEV vs PROD)
        const baseUrl = process.env.MODE === 'DEV' ? systemConfig.HOST_DEV : systemConfig.HOST_PROD;
        const protocol = process.env.MODE === 'DEV' ? 'http' : 'https';

        // 7. Crear la sesión en Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItemsForStripe,
            customer_email: userEmail || undefined,
            // En metadata viaja el orderId para recuperarlo en el Webhook de forma segura
            metadata: {
                orderId: orderId,
                userId: String(userId || '')
            },
            // Las páginas de éxito/cancelación solo sirven para mostrar la interfaz visual
            success_url: `${protocol}://${baseUrl}/success-checkout.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${protocol}://${baseUrl}/cancel-checkout.html?order_id=${orderId}`,
        });

        // 8. Asociar el ID de sesión de Stripe a la orden en MongoDB
        // await updateOrderStripeSession(orderId, session.id);

        // 8. Responder con la URL de pago al cliente
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'ok',
            code: 200,
            message: 'Sesión de checkout creada con éxito.',
            data: {
                checkoutUrl: session.url,
                orderId: orderId
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