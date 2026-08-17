

import { redisClient } from '../db/openRedis.js';
import { getDb } from '../db/openDbs.js';
import { createSessionObject } from './sessionSchema.js';
import systemConfig from '../globalData/systemConfig.js';

// TTL por defecto para Redis (ej. 24 horas en segundos)
const SESSION_TTL_SECONDS = 60 * 60 * 24;

/**
 * Crea y persiste una nueva sesión
 * @param {Object} user - {email, password, nombre ?, }
 * @returns {Promise<Object>} Objeto de sesión completo creado
 */
export async function createSession(user, from) {

    const [, month, , year] = new Date().toString().split(' ');
    
    const session = createSessionObject(user);
    const { _id:sessionId, userId } = session._id

    // 1. Guardar en Redis con expiración automática (TTL)
    const redisKey = `session:${sessionId}`;
    await redisClient.set(redisKey, JSON.stringify(session), {
        EX: SESSION_TTL_SECONDS
    });

    // Opcional: Índice secundario en Redis para rastrear sesiones activas por usuario
    await redisClient.sAdd(`user:sessions:${userId}`, sessionId);

    // 2. Persistir en MongoDB (colección centralizada de sesiones)
    try {
        const db = getDb(systemConfig.DBS.SESSIONS + year);
        const sessionsCollection = db.collection(month.toLowerCase());
        await sessionsCollection.insertOne(session);
    } catch (err) {
        console.error('⚠️ No se pudo persistir la sesión en MongoDB (continúa con Redis):', err.message);
        return {status: "error", session: session};

    }


    return {status: "ok", session: session};
}

/**
 * ACTUALIZAR SESIÓN DEL USUARIO
 */
export const updateSession = async (data) => {
    const [, month, , year] = new Date().toString().split(' ');
    const params = {
        dbName: systemConfig.DBS.SESSIONS + year,
        collection: month,
        await: data.await
    };

    if (data.task === 'SESSION_ENDED') {
        const filter = { _id: data.new_value._id };
        const update_data = { $set: data.new_value };

        if (data.await) {
            await dbCrudHandler.updateOne(filter, update_data, params);
        } else {
            dbCrudHandler.updateOne(filter, update_data, params);
        }

        // Eliminar sesión de Redis por sessionId
        if (data.sessionId && redisClient && redisClient.isOpen) {
            await redisClient.del(`session:${data.sessionId}`);
        }

    } else if (data.task === 'UPDATE_SESSION_STATUS') {
        const filter = { sessionId: data.sessionId };
        const update_data = { $set: { "status": data.new_value } };

        if (data.await) {
            await dbCrudHandler.updateOne(filter, update_data, params);
        } else {
            dbCrudHandler.updateOne(filter, update_data, params);
        }

        // Actualizar estado en Redis
        if (data.sessionId && redisClient && redisClient.isOpen) {
            const currentSession = await getSession(data.sessionId);
            if (currentSession) {
                currentSession.status = data.new_value;
                const ttl = await redisClient.ttl(`session:${data.sessionId}`);
                if (ttl > 0) {
                    await redisClient.set(`session:${data.sessionId}`, JSON.stringify(currentSession), { EX: ttl });
                }
            }
        }
    }
};

/**
 * Obtiene y valida una sesión activa
 * @param {string} sessionId
 * @returns {Promise<Object|null>}
 */
export async function getSession(sessionId) {
    if (!sessionId) return null;

    // 1. Intentar leer desde Redis (rápido en RAM)
    const redisKey = `session:${sessionId}`;
    const sessionData = await redisClient.get(redisKey);

    if (sessionData) {
        return JSON.parse(sessionData);
    }

    // 2. Fallback a MongoDB si expiró en Redis o hubo reinicio
    try {
        const db = getDb('users_data');
        const sessionsCollection = db.collection('sessions');
        const session = await sessionsCollection.findOne({ 'customId.sessionId': sessionId, isValid: true });

        if (session) {
            // Repoblar en Redis con TTL restante
            await redisClient.set(redisKey, JSON.stringify(session), {
                EX: SESSION_TTL_SECONDS
            });
            return session;
        }
    } catch (err) {
        console.error('⚠️ Error al consultar sesión en MongoDB:', err.message);
    }

    return null;
}

/**
 * Actualiza la marca de actividad y renueva el TTL
 * @param {string} sessionId
 */
export async function touchSession(sessionId) {
    const redisKey = `session:${sessionId}`;
    const session = await getSession(sessionId);

    if (session) {
        session.lastActiveAt = Date.now();
        await redisClient.set(redisKey, JSON.stringify(session), {
            EX: SESSION_TTL_SECONDS
        });
    }
}

/**
 * Invalida y elimina una sesión (Logout)
 * @param {string} sessionId
 */
export async function destroySession(sessionId) {
    const session = await getSession(sessionId);

    // 1. Eliminar de Redis
    await redisClient.del(`session:${sessionId}`);

    if (session?.customId?.userId) {
        await redisClient.sRem(`user:sessions:${session.customId.userId}`, sessionId);
    }

    // 2. Marcar como inválida o eliminar en MongoDB
    try {
        const db = getDb('users_data');
        const sessionsCollection = db.collection('sessions');
        await sessionsCollection.updateOne(
            { 'customId.sessionId': sessionId },
            { $set: { isValid: false, destroyedAt: Date.now() } }
        );
    } catch (err) {
        console.error('⚠️ Error al invalidar sesión en MongoDB:', err.message);
    }
}