

/**
 * orderService.js
 * Capa de servicio para pedidos y despacho de entregas.
 */

// Importa tu cliente de base de datos MongoDB nativo
import { deliveryStrategies } from './orderDeliveryStrategies.js';
import { getDb } from '../db/openDbs.js';
import systemConfig from '../globalData/systemConfig.js';
import {updateAffiliatePromotion} from '../affiliates/affiliateService.js';
import { getUserByEmail, addItemToUserActivity, addUserPaymentToTransactions } from '../users/userHandler.js';
import sendEmail from '../notifications/sendEmail.js';
import { ObjectId } from 'mongodb';

// const [, month, day , year] = new Date().toString().split(' ');

/**
 * 1. Crea el pedido en estado inicial PENDING
 */
export async function createOrder(user, order) {
    
    const now = new Date();
    const newOrder = {
        _id: order.orderId,
        language: order.language,
        orderId: order.orderId,
        userId: user.userId,
        email: user.email,
        items: order.verifiedOrderItems,
        totalAmountInCents: order.totalAmountInCents,
        totalAmountInCentsBeforeDiscount: order.totalAmountInCentsBeforeDiscount || order.totalAmountInCents,
        currency: 'eur',
        status: 'PENDING',          // PENDING -> SUCCESS / CANCELED / EXPIRED
        billed: false,
        stripeSessionId:order.stripeSessionId,
        paymentDetails: null,
        createdAt: now,
        updatedAt: now,
        promotion: order.promotion || false,
    };

    // A Partir del _id obtenemos el Año de creacion del pedido para acceder a la base de datos
    const fechaCreacion = order.orderId.getTimestamp(); 
    // 2. Extraer el año para tu base de datos dinámica
    const year= fechaCreacion.getFullYear(); // Devuelve: 2026
    const dbName = systemConfig.DBS.ORDERS +  year
    const collection = systemConfig.COLLECTIONS.ORDERS

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

    let validOrderId;
    
    if (orderId instanceof ObjectId) {
        validOrderId = orderId
    } else if (typeof orderId === 'string') {
        validOrderId = new ObjectId(orderId)
    }else{
        throw new Error("Error en orderService.getOrderById order.userID no es NI STRING NI OBJECT ???");
    }
    // A Partir del orderId obtenemos el Año de creacion del pedido para acceder a la base de datos
    const fechaCreacion = validOrderId.getTimestamp(); 
    // 2. Extraer el año para tu base de datos dinámica
    const year= fechaCreacion.getFullYear(); 
    const dbName = systemConfig.DBS.ORDERS +  year
    const collection = systemConfig.COLLECTIONS.ORDERS

    const dbOrders = await getDb(dbName);

    return await dbOrders.collection(collection).findOne({ "_id.orderId": orderId });
}

/**
 * 3. Actualiza el stripeSessionId en la orden PENDING
 */
/*
export async function updateOrderStripeSession(orderId, stripeSessionId) {

    let validOrderId;
    
    if (orderId instanceof ObjectId) {
        validOrderId = orderId
    } else if (typeof orderId === 'string') {
        validOrderId = new ObjectId(orderId)
    }
    // A Partir del orderId obtenemos el Año de creacion del pedido para acceder a la base de datos
    const fechaCreacion = validOrderId.getTimestamp(); 
    // 2. Extraer el año para tu base de datos dinámica
    const year= fechaCreacion.getFullYear(); 
    const dbName = systemConfig.DBS.ORDERS +  year
    const collection = systemConfig.COLLECTIONS.ORDERS
    
    const dbOrders = await getDb(dbName);

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
*/

/**
 * 4. Pasa el pedido a SUCCESS (Con control de Idempotencia)
 */
export async function updateOrderStatusToSuccess(orderId, paymentDetails) {

    let validOrderId;
    
    // 2. Extraer el año para tu base de datos dinámica
    if (orderId instanceof ObjectId) {
        validOrderId = orderId;
    } else if (typeof orderId === 'string') {
        validOrderId = new ObjectId(orderId)
    }else{
        throw new Error("Error en orderService.updateOrderStatusToSuccess order.userID no es NI STRING NI OBJECT ???");
    }
    const yearCreacionOrder = validOrderId.getTimestamp().getFullYear();
    
    const dbName = systemConfig.DBS.ORDERS +  yearCreacionOrder
    const collection = systemConfig.COLLECTIONS.ORDERS

    const dbOrders = await getDb(dbName);
    const date = new Date()

    try{

        const result  = await dbOrders.collection(collection).findOneAndUpdate(
            { _id: validOrderId, status: { $ne: 'SUCCESS' } },
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
        // El resultado depende de la version del Driver de MongoDB
        if(result){
            let order;
            if(result.value){
                order = result.value
            }else{
                order = result
            }
            order.status = "SUCCESS"
            order.paymentDetails = paymentDetails,
            order.paidAt = date,
            order.updatedAt= date
            return order;

        }else{
            return null
        }

    }catch(error){
        console.log(`❌ ERROR Actualizando STATUS DE ORDER A SUCCESS`)
        console.log(error)
        return null;
    }
}


/**
 * 5. Actualiza el stripeSessionId en la orden PENDING
 */
export async function markOrderAsExpired(orderId) {

    let validOrderId;
    
    if (orderId instanceof ObjectId) {
        validOrderId = orderId
    } else if (typeof orderId === 'string') {
        validOrderId = new ObjectId(orderId)
    }
    // A Partir del orderId obtenemos el Año de creacion del pedido para acceder a la base de datos
    const fechaCreacion = validOrderId.getTimestamp(); 
    // 2. Extraer el año para tu base de datos dinámica
    const year= fechaCreacion.getFullYear(); 
    const dbName = systemConfig.DBS.ORDERS +  year
    const collection = systemConfig.COLLECTIONS.ORDERS

    const dbOrders = await getDb(dbName);

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
export async function processOrderDelivery(orderId, paymentDetails) {

    // ACTUALIZAMOS EL PEDIDO A "SUCCESS" Y NOS DEVUELVE EL PEDIDO DE LA DB
    const order = await updateOrderStatusToSuccess(orderId, paymentDetails);
    
    if(!order){
        console.log(`❌ Pedido ${order.orderId} NO SE HA PODIDO ACTUALIZAR A SUCCESS.`);
        return;
    }


    const deliveryResults = [];

    // 2. Iterar sobre cada ítem y aplicar la estrategia correspondiente
    for (const item of order.items) {
        const productType = item.type; //  BALANCE_RECHARGE | PHYSICAL | AUDIO_STREAMING | AUDIO_DOWNLOAD | TEXT_CONTENT ...
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
            console.error(`❌ Error entregando ítem ${item.productId} en orden ${order._Id}:`, itemError);
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
        await addUserPaymentToTransactions(order)
    
        // Bloque independiente para user-activity
        try{
            await addItemToUserActivity(order, "SAAS_PAYMENT")
        }catch(e){
            console.error(`❌ Error en orderService.js, añadiendo item a DB users_activity: -> `, e)
        }
    
        // Bloque independiente para el envio de notificacion final al usuario por email
        try{
            await sendEmail(
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
                await updateAffiliatePromotion(order.promotion)
            } catch (e) {
                console.error(`❌ Error en orderService.processOrderDelivery, Actualizando el Listado de usuarios del Afiliado: ->`, e)
            }
        }

    }catch(e){
        console.error(`❌ Error Añadiendo Pago a DB users-accounting. -> NOTIFICAR A ADMIN: -> `, e);
    }

    

    // 5. Guardar el log de entrega en el pedido
    // const db = gawait etDb();
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

