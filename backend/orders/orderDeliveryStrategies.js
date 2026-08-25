

/**
 * orderDeliveryStrategies.js
 * Estrategias específicas de entrega/procesamiento según el tipo de producto.
 */

// import { incrementUserBalance } from '../../users/userHandler.js';
// import { generateAudiobookAccessToken } from '../../audiobooks/audiobookService.js';
// import { createShipmentRecord } from '../../shipping/shippingService.js';

export const deliveryStrategies = {
    /**
     * 1. DESCARGA / ACCESO A AUDIOLIBRO O CONTENIDO DIGITAL
     */
    AUDIOBOOK: async (item, order) => {
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
            type: 'AUDIOBOOK',
            status: 'DELIVERED',
            details: { downloadToken: accessGrant.downloadToken }
        };
    },

    /**
     * 2. RECARGA DE SALDO EN LA PLATAFORMA
     */
    BALANCE_RECHARGE: async (item, order) => {
        // En item.metadata o el producto se define cuánto saldo en céntimos o créditos aporta
        const balanceToAdd = item.creditAmount || (item.unitPriceInCents / 100);

        // await incrementUserBalance(order.userId, balanceToAdd);
        console.log(`💰 [BALANCE] Se han añadido ${balanceToAdd}€ al saldo del usuario ${order.userId}`);

        return {
            type: 'BALANCE_RECHARGE',
            status: 'DELIVERED',
            details: { addedAmount: balanceToAdd }
        };
    },

    /**
     * 3. PRODUCTO FÍSICO (Requiere preparación y envío)
     */
    PHYSICAL: async (item, order) => {
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