

/**
 * HANDLER PARA EL WEBHOOK DE STRIPE (POST /api/stripe/webhook)
 */

import Stripe from 'stripe';
import { updateOrderStatusToSuccess, processOrderDelivery, markOrderAsExpired } from '../../orders/orderService.js';
process.loadEnvFile();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//     apiVersion: '2026-07-29.dahlia'
// });

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY_TEST)


const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export default async function stripeWebhookHandler(req, res) {

console.log("STRIPE WEBHOOK HANDLER")
// console.log(req.body)
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

    console.log("HEMOS - PASADO !!!!!")
console.log(event.type)
    

    try {
        // Stripe exige un 200 rápido para confirmar la recepción
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ received: true }));
        
        // Manejamos los eventos relevantes
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId;
console.log("Disparaao Triger !!!!")
                if (!orderId) {
                    console.error('❌ Webhook recibido sin orderId en metadata:', session.id);
                    break;
                }

                
                //1. Actualizar estado a SUCCESS en DB
                await updateOrderStatusToSuccess(orderId, {
                    paymentIntentId: session.payment_intent,
                    paymentStatus: session.payment_status,
                    paidAt: new Date()
                });
console.log("Actualizado a successs !!!!")
                // 2. Tramitar el pedido (crear bots, dar permisos al usuario, enviar email/SMS)
                await processOrderDelivery(orderId);
                console.log(`✅ Pedido ${orderId} cobrado y tramitado con éxito.`);
                break;
            }

            // SESSION Expirada sin hacer el pago -> Marcamos Pedido como EXPIRED
            case 'checkout.session.expired': {
                const session = event.data.object;
                const orderId = session.metadata?.orderId;
                if (orderId) {
                    await markOrderAsExpired(orderId);
                    console.log(`⏱️ Sesión expirada para el pedido ${orderId}`);
                }
                break;
            }

            default:
                // Ignorar otros tipos de eventos que no necesitemos
                break;
        }
        return;

        
    } catch (error) {
        console.error('❌ Error ejecutando lógica del webhook:', error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ status: 'error', message: 'Error interno en webhook.' }));
    }
}