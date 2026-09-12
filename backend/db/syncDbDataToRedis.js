

/**
 * SINCRONIZACIÓN INICIAL: MONGO DB -> REDIS USER INDEX
 */

import { redisClient } from './openRedis.js';
import systemConfig from '../globalData/systemConfig.js';
import { getDb } from './openDbs.js';
import { setRedisUserHset } from './redisService.js';


export async function syncUsersIndexToRedis() {
    if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis no está conectado. Omitiendo sincronización de índice de usuarios.');
        return;
    }

    try {

        const usersDb = await getDb(systemConfig.DBS.USERS_DATA);
        const collection = systemConfig.COLLECTIONS.USERS_DATA
        const cursor = usersDb.collection(collection).find();
        let totalIndexed = 0;
        
        while (await cursor.hasNext()) {
            const user = await cursor.next();
            if (user && user._id && user.email) {

                await setRedisUserHset(user)
                totalIndexed++;
            }
        }


        console.log(`✅ Índice de usuarios sincronizado en Redis (${totalIndexed} usuarios indexados).`);
    } catch (err) {
        console.error('❌ Error en syncUsersIndexToRedis !!! :', err.message);
    }
}