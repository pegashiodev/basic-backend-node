

/**
 * catchDbData.js
 * Carga inicial y cacheo de datos críticos en Redis desde MongoDB.
 */

import { getDb } from './database/mongoClient.js'; // Ajusta la ruta a tu cliente Mongo
import redisClient from './database/redisClient.js'; // Ajusta la ruta a tu cliente Redis

export default async function catchDbData() {
    console.log('🔄 Iniciando precarga de datos en Redis...');
    const startTime = Date.now();

    try {
        const pipeline = redisClient.pipeline();

        // 1. PRODUCTOS (db: "products", col: "clegal") -> Key: "product:<productId>"
        const productsDb = getDb('products');
        const products = await productsDb.collection('clegal').find({}).toArray();

        let productsCached = 0;
        for (const item of products) {
            const productId = item.productId || item._id?.productId || (typeof item._id === 'string' ? item._id : null);
            if (productId) {
                pipeline.set(`product:${productId}`, JSON.stringify(item));
                productsCached++;
            }
        }

        // 2. PROMOCIONES (db: "promotions", col: "codes") -> Key: "promo:<promotionId>"
        const promotionsDb = getDb('promotions');
        const promotions = await promotionsDb.collection('codes').find({}).toArray();

        let promotionsCached = 0;
        for (const item of promotions) {
            const promoId = item.promotionId || item.code || item._id?.promotionId || (typeof item._id === 'string' ? item._id : null);
            if (promoId) {
                pipeline.set(`promo:${promoId}`, JSON.stringify(item));
                promotionsCached++;
            }
        }

        // 3. BLACKLIST IPS (db: "BlacklistIps", col: "ips") -> Key: "blacklist:ip:<ip>"
        const blacklistDb = getDb('BlacklistIps');
        const blacklistedIps = await blacklistDb.collection('ips').find({}).toArray();

        let ipsCached = 0;
        for (const item of blacklistedIps) {
            const ip = item.ip || item._id?.ip || (typeof item._id === 'string' ? item._id : null);
            if (ip) {
                // Se almacena el registro completo o un flag rápido "1"
                pipeline.set(`blacklist:ip:${ip}`, JSON.stringify(item));
                ipsCached++;
            }
        }

        // Ejecutar todas las inserciones en bloque
        await pipeline.exec();

        const duration = Date.now() - startTime;
        console.log(`✅ Cacheo finalizado con éxito en ${duration}ms:`);
        console.log(`   📦 Productos: ${productsCached}`);
        console.log(`   🏷️  Promociones: ${promotionsCached}`);
        console.log(`   🚫 IPs bloqueadas: ${ipsCached}`);

        return true;

    } catch (error) {
        console.error('❌ Error durante la precarga en catchDbData:', error);
        throw error;
    }
}