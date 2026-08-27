

/**
 * HANDLER PARA EL WEBHOOK DE STRIPE (POST /api/stripe/webhook)
 */

import Stripe from 'stripe';
// import { getOrderById, updateOrderStatusToSuccess, processOrderDelivery } from '../../orders/orderService.js';
process.loadEnvFile();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//     apiVersion: '2026-07-29.dahlia'
// });

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY_TEST)


const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_3;

export default async function stripeWebhookHandler(req, res) {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ status: 'error', message: 'Firma de Stripe ausente.' }));
    }

    let event;

    try {
        // req.rawBody debe ser un Buffer con el payload exacto sin alterar
        event = stripe.webhooks.constructEvent(req.rawBody, signature, WEBHOOK_SECRET);
    } catch (err) {
        console.error('⚠️ Error al verificar la firma del Webhook de Stripe:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ status: 'error', message: `Webhook Error: ${err.message}` }));
    }

    // Manejamos los eventos relevantes
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId;
console.log("Disparaao Triger !!!!")
                if (!orderId) {
                    console.error('❌ Webhook recibido sin orderId en metadata:', session.id);
                    break;
                }

                // 1. Buscar pedido en Base de Datos
                // const order = await getOrderById(orderId);
                // if (!order) {
                //     console.error(`❌ Pedido ${orderId} no encontrado en DB`);
                //     break;
                // }

                // 2. Control de Idempotencia (evita procesar dos veces el mismo evento)
                // if (order.status === 'SUCCESS') {
                //     console.log(`ℹ️ Pedido ${orderId} ya procesado previamente.`);
                //     break;
                // }

                // 3. Actualizar estado a SUCCESS en DB
                // await updateOrderStatusToSuccess(orderId, {
                //     paymentIntentId: session.payment_intent,
                //     paymentStatus: session.payment_status,
                //     paidAt: new Date()
                // });

                // 4. Tramitar el pedido (crear bots, dar permisos al usuario, enviar email/SMS)
                // await processOrderDelivery(orderId);
                console.log(`✅ Pedido ${orderId} cobrado y tramitado con éxito.`);
                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId;
                if (orderId) {
                    // await markOrderAsExpired(orderId);
                    console.log(`⏱️ Sesión expirada para el pedido ${orderId}`);
                }
                break;
            }

            default:
                // Ignorar otros tipos de eventos que no necesitemos
                break;
        }

        // Stripe exige un 200 rápido para confirmar la recepción
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ received: true }));

    } catch (error) {
        console.error('❌ Error ejecutando lógica del webhook:', error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ status: 'error', message: 'Error interno en webhook.' }));
    }
}