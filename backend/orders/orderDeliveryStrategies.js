

/**
 * orderDeliveryStrategies.js
 * Estrategias específicas de entrega/procesamiento según el tipo de producto.
 */

// import { incrementUserBalance } from '../../users/userHandler.js';
// import { generateAudiobookAccessToken } from '../../audiobooks/audiobookService.js';
// import { createShipmentRecord } from '../../shipping/shippingService.js';

import { incrementUserCoins } from "../users/userHandler.js";

export const deliveryStrategies = {
    /**
     * 1. DESCARGA A AUDIOLIBRO O CONTENIDO DIGITAL
     */
    AUDIO_DOWNLOAD: async (item, order) => {
        console.log("TRAMITAMOS AUDIO_DOWNLOAD")

        // Genera acceso, licencia o enlace temporal firmado para el usuario
        const accessGrant = {
            userId: order.userId,
            productId: item.productId,
            orderId: order.orderId,
            grantedAt: new Date(),
            downloadToken: `dl_${crypto.randomUUID()}`
        };

        // await saveUserDigitalAccess(accessGrant);
        console.log(`🎧 [AUDIOBOOK] Acceso habilitado para producto ${item.productId} al usuario ${order.userId}`);
        
        return {
            type: 'AUDIO_CONTENT',
            status: 'DELIVERED',
            details: { downloadToken: accessGrant.downloadToken }
        };
    },

    /**
     * 2. ACCESO  A AUDIOLIBRO O CONTENIDO DIGITAL MEDIANTE STREAMING
     */

    AUDIO_STREAMING: async (item, order) => {
        console.log("TRAMITAMOS AUDIO_STREAMING")



    }, 

    /**
     * 3. RECARGA DE SALDO EN LA PLATAFORMA
     */
    BALANCE_RECHARGE: async (item, order) => {

        console.log("TRAMITAMOS BALANCE_RECHARGE")
        // INCREMENTAMOS LOS COINS EN LA CUENTA DEL USUARIO
        // ALMACENAMOS ESTA ACCION EN USER_ACCOUNTING

        // 1.- Obtenemos el user y los coins a actualizar
        const userId = order._id.userId;
        const coins = item.coins
        
        // 2.- Incrementamos los coins en la cuenta del usuario 
        await incrementUserCoins(userId, coins);

        console.log(`💰 [BALANCE] Se han añadido COINS  al saldo del usuario ${userId}`);

        // 3.- Añadimos Pago a la Contabilidad del usuario
       

        // 4.- ENVIAMOS UN EMAIL DE CONFIRMACION DEL PEDIDO REALIZADO -> TE ENVIAMOS FACTURA PRONTO ??

        return {
            type: 'BALANCE_RECHARGE',
            status: 'DELIVERED',
            //details: { addedAmount: balanceToAdd }
        };
        
    },

    /**
     * 4. DESCARGA O ENVIO DE PDF POR EMAIL
     */

    TEXT_CONTENT: async (item, order) => {
        console.log("TRAMITAMOS TEXT_CONTENT")

    }, 


    /**
     * 5. PRODUCTO FÍSICO (Requiere preparación y envío)
     */
    PHYSICAL: async (item, order) => {
        console.log("TRAMITAMOS PHYSICAL")

        // Registra la tarea en la tabla/colección de envíos y logística
        const shipmentData = {
            orderId: order.orderId,
            userId: order.userId,
            productId: item.productId,
            quantity: item.quantity,
            shippingAddress: order.shippingAddress || null,
            fulfillmentStatus: 'PENDING_DISPATCH',
            createdAt: new Date()
        };

        // await createShipmentRecord(shipmentData);
        console.log(`📦 [PHYSICAL] Pedido físico encolado para empaquetado y envío: ${item.name}`);

        return {
            type: 'PHYSICAL',
            status: 'PROCESSING_FULFILLMENT',
            details: { fulfillmentStatus: 'PENDING_DISPATCH' }
        };
    }
};