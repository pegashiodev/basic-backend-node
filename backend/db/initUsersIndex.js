

/**
 * SINCRONIZACIÓN INICIAL: MONGO DB -> REDIS USER INDEX
 */

import { redisClient } from './openRedis.js';
import { setUserPointer } from './userIndexService.js';
import systemConfig from '../globalData/systemConfig.js';
import { getDb } from './openDbs.js';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export async function syncUsersIndexToRedis() {
    if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis no está conectado. Omitiendo sincronización de índice de usuarios.');
        return;
    }

    try {

        const db = getDb(systemConfig.DBS.USERS_DATA);
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        let totalIndexed = 0;

        for (const colName of collectionNames) {
            // Solo procesamos colecciones de meses
            if (!MONTHS.includes(colName)) continue;

            const cursor = db.collection(colName).find({}, { projection: { _id: 1 } });
            
            while (await cursor.hasNext()) {
                const doc = await cursor.next();
                if (doc && doc._id && doc._id.email) {
                    await setUserPointer(doc._id.email, doc._id);
                    totalIndexed++;
                }
            }
        }

        console.log(`✅ Índice de usuarios sincronizado en Redis (${totalIndexed} usuarios indexados).`);
    } catch (err) {
        console.error('❌ Error en syncUsersIndexToRedis !!! :', err.message);
    }
}