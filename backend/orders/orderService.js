

/**
 * orderService.js
 * Capa de servicio para pedidos y despacho de entregas.
 */

// Importa tu cliente de base de datos MongoDB nativo
import { deliveryStrategies } from './orderDeliveryStrategies.js';
import { getDb } from '../db/openDbs.js';
import systemConfig from '../globalData/systemConfig.js';
import {updateAffiliatePromotion} from '../affiliates/affiliateService.js';
import { addPaymentToUserPayments, getUserByEmail, addItemToUserActivity } from '../users/userHandler.js';
import sendEmail from '../notifications/sendEmail.js';

// const [, month, day , year] = new Date().toString().split(' ');

/**
 * 1. Crea el pedido en estado inicial PENDING
 */
export async function createOrder(user, order) {
    
    const now = new Date();
    const newOrder = {
        _id: {
            orderId: order.orderId,
            stripeSessionId: order.stripeSessionId,
            userId: user.userId,
            email: user.email
            
        },
        language: order.language,
        orderId: order.orderId,
        userId: user.userId,
        customerEmail: user.email,
        items: order.verifiedOrderItems,
        totalAmountInCents: order.totalAmountInCents,
        currency: 'eur',
        status: 'PENDING',          // PENDING -> SUCCESS / CANCELED / EXPIRED
        billed: false,
        stripeSessionId:order.stripeSessionId,
        paymentDetails: null,
        createdAt: now,
        updatedAt: now,
        promotion: order.promotion || false,
    };

    const orderParts = order.orderId.split("_")
    const dbName = systemConfig.DBS.ORDERS +  orderParts[3]
    const collection = orderParts[2]
    const dbOrders = getDb(dbName);

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
    const dbName = systemConfig.DBS.ORDERS + orderParts[3]
    const collection = orderParts[2]
    const dbOrders = getDb(dbName);

    return await dbOrders.collection(collection).findOne({ "_id.orderId": orderId });
}

/**
 * 3. Actualiza el stripeSessionId en la orden PENDING
 */
export async function updateOrderStripeSession(orderId, stripeSessionId) {

    const orderParts = orderId.split("_")
    const dbName = systemConfig.DBS.ORDERS + orderParts[3]
    const collection = orderParts[2]
    const dbOrders = getDb(dbName);

    try{

        await dbOrders.collection(collection).updateOne(
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
    const dbName = systemConfig.DBS.ORDERS + orderParts[3]
    const collection = orderParts[2]

    const dbOrders = getDb(dbName);
    const date = new Date()
    try{

        const order = await dbOrders.collection(collection).findOneAndUpdate(
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
        // TENEMOS EL PEDIDO ANTERIOR A LA ACTUALIZACION
        // ASI QUE AÑADIMOS LOS CAMBIOS PARA RETORNARLO
        order.status = "SUCCESS"
        order.paymentDetails = paymentDetails,
        order.paidAt = date,
        order.updatedAt= date
        return order;
        

    }catch(e){
        console.log(`❌ ERROR Actualizando STATUS DE ORDER A SUCCESS`)
        return null;
    }
}


/**
 * 5. Actualiza el stripeSessionId en la orden PENDING
 */
export async function markOrderAsExpired(orderId) {

    const orderParts = orderId.split("_")
    const dbName = systemConfig.DBS.ORDERS + orderParts[3]
    const collection = orderParts[2]
    const db = getDb(dbName);

    try{

        await db.collection(collection).updateOne(
            { "_id.orderId": orderId },
            {$set: { status: 'EXPIRED'}}
        );

    }catch(e){
        console.log(`❌ ERROR Actualizando ORDER.STATUS A "EXPIRED"  en DB`)
    }
}

/**
 * 6. PROCESAR LA ENTREGA DEL PEDIDO (Disparado por el Webhook de Stripe)
 */
export async function processOrderDelivery(order) {
   

    const deliveryResults = [];

    // 2. Iterar sobre cada ítem y aplicar la estrategia correspondiente
    for (const item of order.items) {
        const productType = item.type || 'AUDIOBOOK'; // AUDIOBOOK | BALANCE_RECHARGE | PHYSICAL
        const strategy = deliveryStrategies[productType];

        if (!strategy) {
            console.warn(`⚠️ No hay estrategia definida para el tipo de producto: ${productType}`);
            deliveryResults.push({
                productId: item.productId,
                status: 'UNSUPPORTED_TYPE'
            });
            continue;
        }

        // BLOQUE IMPORTANTE: order-strategy + user-accounting
        try {
            // realizamos la accion correspondiente de cada producto
            const result = await strategy(item, order);
            deliveryResults.push(result);

        } catch (itemError) {
            console.error(`❌ Error entregando ítem ${item.productId} en orden ${order.orderId}:`, itemError);
            deliveryResults.push({
                productId: item.productId,
                status: 'DELIVERY_FAILED',
                error: itemError.message
            });
        }
    }

    //REVISAR LA LISTA DE RESULTADOS. 
console.log({deliveryResults})

    try{

        // ARCHIVAMOS EL PAGO EN USERS-ACCOUNTING
        const paymentData = {}
        await addPaymentToUserPayments(order)
    
        // Bloque independiente para user-activity
        try{
            await addItemToUserActivity(order, "SAAS_PAYMENT")
        }catch(e){
            console.error(`❌ Error en orderService.js, añadiendo item a DB users_activity: -> `, e)
        }
    
        // Bloque independiente para el envio de notificacion final al usuario por email
        try{
            sendEmail(
                {   email: order._id.email, 
                    type: "SUCCESS_PAYMENT", 
                    language: order.language, 
                    customData:{},
                })
        }catch(e){
            console.error(`❌ Error en orderService.js, enviando Email Final al usuario: ->`, e)
        }
        
        // Bloque independiente para actualizar la lista de usuarios del Afiliado
        if(order.promotion){
            // Obtengo el user con el email que esta en el order
            try {
                const user = await getUserByEmail(order._id.email)
                if(!user){
                    throw new Error(" ERROr en orderService.processOrderDelivery. No hemos podido acceder al usuario para gestionar la promocion del pedido: -> ENVIAR A ADMIN LA TAREA PENDIENTE");
                }
                await updateAffiliatePromotion(order.promotion, user)
            } catch (e) {
                console.error(`❌ Error en orderService.processOrderDelivery, Actualizando el Listado de usuarios del Afiliado: ->`, e)
            }
        }

    }catch(e){
        console.error(`❌ Error Añadiendo Pago a DB users-accounting. -> NOTIFICAR A ADMIN: -> `, e);
    }

    

    // 5. Guardar el log de entrega en el pedido
    // const db = getDb();
    // await db.collection(ORDERS_COLLECTION).updateOne(
    //     { "_id.orderId": order.orderId },
    //     { 
    //         $set: { 
    //             deliveryResults: deliveryResults,
    //             deliveryStatus: 'PROCESSED',
    //             deliveredAt: new Date()
    //         } 
    //     }
    // );

    console.log(`🚀 Despacho finalizado para el pedido ${order.orderId}`);
}

