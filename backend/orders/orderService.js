

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

// const [, month, day , year] = new Date().toString().split(' ');

/**
 * 1. Crea el pedido en estado inicial PENDING
 */
export async function createOrder(user, order) {
    
    const now = new Date();
    const newOrder = {
        _id: {
            _id: order.orderId,
            orderId: order.orderId,
            userId: user.userId,
            email: user.email
            
        },
        orderId: order.orderId,
        userId: user.userId,
        customerEmail: user.email,
        items: order.verifiedOrderItems,
        totalAmountInCents: order.totalAmountInCents,
        currency: 'eur',
        status: 'PENDING',          // PENDING -> SUCCESS / CANCELED / EXPIRED
        stripeSessionId: null,
        paymentDetails: null,
        createdAt: now,
        updatedAt: now
    };

    const orderParts = order.orderId.split("_")
    const dbName = orderParts[3]
    const collection = orderParts[2]
    const dbOrders = await getDb(dbName);

    // ALMACENAMOS EN DB CON ESTADO "PENDING"
    try{

        await dbOrders.collection(collection).insertOne(newOrder);
        console.log(`📝 Pedido ${order.orderId} registrado en estado PENDING`);
        return {status: "ok"}

    }catch(e){
        console.log(`❌ ERROR insertando Order en DB`)
        return {status: "error"}
    }

}

/**
 * 2. Obtiene un pedido por su orderId
 */
export async function getOrderById(orderId) {
    
    const orderParts = orderId.split("_")
    const dbName = orderParts[3]
    const collection = orderParts[2]
    const dbOrders = await getDb(dbName);

    return await db.collection(collection).findOne({ "_id.orderId": orderId });
}

/**
 * 3. Actualiza el stripeSessionId en la orden PENDING
 */
export async function updateOrderStripeSession(orderId, stripeSessionId) {

    const orderParts = orderId.split("_")
    const dbName = orderParts[3]
    const collection = orderParts[2]
    const db = await getDb(dbName);

    try{

        await db.collection(collection).updateOne(
            { "_id.orderId": orderId },
            { $set: { stripeSessionId: stripeSessionId, updatedAt: new Date() } }
        );
        return {status: "ok"}

    }catch(e){
        console.log(`❌ ERROR Actualizando Stripe-sessionId  en DB`)
        return {status: "error"}
    }
}

/**
 * 4. Pasa el pedido a SUCCESS (Con control de Idempotencia)
 */
export async function updateOrderStatusToSuccess(orderId, paymentDetails) {

    const orderParts = orderId.split("_")
    const dbName = orderParts[3]
    const collection = orderParts[2]

    const db = await getDb(dbName);
    const date = new Date()
    try{

        await db.collection(collection).findOneAndUpdate(
            { "_id.orderId": orderId, status: { $ne: 'SUCCESS' } },
            { 
                $set: { 
                    status: 'SUCCESS',
                    paymentDetails: paymentDetails,
                    paidAt: date,
                    updatedAt: date
                }
            },
            { returnDocument: 'after' }
        );

    }catch(e){
        console.log(`❌ ERROR Actualizando STATUS DE ORDER A SUCCESS`)
    }
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


/**
 * 6. Actualiza el stripeSessionId en la orden PENDING
 */
export async function markOrderAsExpired(orderId) {

    const orderParts = orderId.split("_")
    const dbName = orderParts[3]
    const collection = orderParts[2]
    const db = await getDb(dbName);

    try{

        await db.collection(collection).updateOne(
            { "_id.orderId": orderId },
            {$set: { status: 'ESPIRED'}}
        );

    }catch(e){
        console.log(`❌ ERROR Actualizando ORDER.STATUS A "EXPIRED"  en DB`)
    }
}