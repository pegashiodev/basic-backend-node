

/**
 * SINCRONIZACIÓN INICIAL: MONGO DB -> REDIS USER INDEX
 */

import { redisClient } from './openRedis.js';
import systemConfig from '../globalData/systemConfig.js';
import { getDb } from './openDbs.js';


export async function syncUsersIndexToRedis() {
    if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis no está conectado. Omitiendo sincronización de índice de usuarios.');
        return;
    }

    try {

        const usersDb = await getDb(systemConfig.DBS.USERS_DATA);
        const collection = systemConfig.COLLECTIONS.USERS_DATA
        const cursor = usersDb.collection(collection).find({}, { projection: { _id: 1 } });
        
        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            if (doc && doc._id && doc.email) {

                await setRedisUserHset(doc.email, doc)
                totalIndexed++;
            }
        }

        let totalIndexed = 0;

        console.log(`✅ Índice de usuarios sincronizado en Redis (${totalIndexed} usuarios indexados).`);
    } catch (err) {
        console.error('❌ Error en syncUsersIndexToRedis !!! :', err.message);
    }
}