

/**
 * orderService.js
 * Capa de servicio para pedidos y despacho de entregas.
 */

import crypto from 'node:crypto';
// Importa tu cliente de base de datos MongoDB nativo
// import { getDb } from '../../database/mongoClient.js';
import { deliveryStrategies } from './orderDeliveryStrategies.js';
import systemConfig from '../globalData/systemConfig.js';
import { getDb } from '../db/openDbs.js';

const [, month, day , year] = new Date().toString().split(' ');

/**
 * 1. Crea el pedido en estado inicial PENDING
 */
export async function createOrder(orderData) {

    const dbName = systemConfig.DBS.ORDERS + year;
    const dbOrders = await getDb(dbName);
    await dbOrders.collection(month.toLowerCase()).insertOne(orderData);
    console.log(`📝 Pedido ${orderData.orderId} registrado en estado PENDING`);
    // return orderData;
    return;
}

/**
 * 2. Obtiene un pedido por su orderId
 */
export async function getOrderById(orderId) {
    // const db = getDb();
    // return await db.collection(ORDERS_COLLECTION).findOne({ orderId: orderId });
    return null; // Reemplazar con llamada real a DB
}

/**
 * 3. Actualiza el stripeSessionId en la orden PENDING
 */
export async function updateOrderStripeSession(orderId, stripeSessionId) {
    // const db = getDb();
    // return await db.collection(ORDERS_COLLECTION).updateOne(
    //     { orderId: orderId },
    //     { $set: { stripeSessionId: stripeSessionId, updatedAt: new Date() } }
    // );
}

/**
 * 4. Pasa el pedido a SUCCESS (Con control de Idempotencia)
 */
export async function updateOrderStatusToSuccess(orderId, paymentDetails) {
    // const db = getDb();
    // return await db.collection(ORDERS_COLLECTION).findOneAndUpdate(
    //     { orderId: orderId, status: { $ne: 'SUCCESS' } },
    //     { 
    //         $set: { 
    //             status: 'SUCCESS',
    //             paymentDetails: paymentDetails,
    //             paidAt: new Date(),
    //             updatedAt: new Date()
    //         }
    //     },
    //     { returnDocument: 'after' }
    // );
}

/**
 * 5. PROCESAR LA ENTREGA DEL PEDIDO (Disparado por el Webhook de Stripe)
 */
export async function processOrderDelivery(orderId) {
    // 1. Obtener la orden confirmada
    const order = await getOrderById(orderId);
    if (!order) {
        throw new Error(`No se encontró el pedido ${orderId} para entrega.`);
    }

    const deliveryResults = [];

    // 2. Iterar sobre cada ítem y aplicar la estrategia correspondiente
    for (const item of order.items) {
        const productType = item.productType || 'AUDIOBOOK'; // AUDIOBOOK | BALANCE_RECHARGE | PHYSICAL
        const strategy = deliveryStrategies[productType];

        if (!strategy) {
            console.warn(`⚠️ No hay estrategia definida para el tipo de producto: ${productType}`);
            deliveryResults.push({
                productId: item.productId,
                status: 'UNSUPPORTED_TYPE'
            });
            continue;
        }

        try {
            const result = await strategy(item, order);
            deliveryResults.push(result);
        } catch (itemError) {
            console.error(`❌ Error entregando ítem ${item.productId} en orden ${orderId}:`, itemError);
            deliveryResults.push({
                productId: item.productId,
                status: 'DELIVERY_FAILED',
                error: itemError.message
            });
        }
    }

    // 3. Guardar el log de entrega en el pedido
    // const db = getDb();
    // await db.collection(ORDERS_COLLECTION).updateOne(
    //     { orderId: orderId },
    //     { 
    //         $set: { 
    //             deliveryResults: deliveryResults,
    //             deliveryStatus: 'PROCESSED',
    //             deliveredAt: new Date()
    //         } 
    //     }
    // );

    console.log(`🚀 Despacho finalizado para el pedido ${orderId}`);
    return deliveryResults;
}