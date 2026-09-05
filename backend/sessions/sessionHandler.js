

import { redisClient } from '../db/openRedis.js';
import { getDb } from '../db/openDbs.js';
import { createSessionObject } from './sessionSchema.js';
import systemConfig from '../globalData/systemConfig.js';
import { ObjectId } from 'mongodb';
import { setRedisSessionHset } from '../db/redisService.js';

// TTL por defecto para Redis (ej. 24 horas en segundos)
//const SESSION_TTL_SECONDS = 60 * 60 * 24;

/**
 * Crea y persiste una nueva sesión
 * @param {Object} user - {email, password, nombre ?, }
 * @returns {Promise<Object>} Objeto de sesión completo creado
 */
export async function createSession(req, from) {
    const user = req.user
    const [, month, , year] = new Date().toString().split(' ');
    
    const session = createSessionObject(req, user);
    const { sessionIdString, sessionId } = session
    req.currentSessionId = sessionId;
    req.currentSessionIdString = sessionIdString;

    // Almacenamos una copia modificada (todo String) en Redis
    await setRedisSessionHset(session)


    // Opcional: Índice secundario en Redis para rastrear sesiones activas por usuario
    // await redisClient.sAdd(`user:sessions:${userId}`, sessionIdString);

    // 2. Persistir en MongoDB (colección centralizada de sesiones)
    try {
        const db = await getDb(systemConfig.DBS.SESSIONS + year);
        const sessionsCollection = db.collection(systemConfig.COLLECTIONS.SESSIONS);
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

    // Obtenemos la fecha del id de session para acceder a la DB
    
    const sessionString = data.sessionIdString
    // const objId = new ObjectId(sessionString);
    const objId = ObjectId.createFromHexString(sessionString);
    const yearCreationSession = objId.getTimestamp().getFullYear()
    const dbName = systemConfig.DBS.SESSIONS + yearCreationSession
    const collection = systemConfig.COLLECTIONS.SESSIONS
    const sessionsDb = await getDb(dbName)
    

    if (data.task === 'SESSION_ENDED') {

        const filter = { "_id.sessionId": data.sessionId };
        const update_data = { $set: {status: "ENDED"}};

        await sessionsDb.collection(collection).updateOne(filter,update_data )
        // await dbCrudHandler.updateOne(filter, update_data, params);
        

        // Eliminar sesión de Redis por sessionId
        if (data.sessionId && redisClient && redisClient.isOpen) {
            await redisClient.del(`session:${data.sessionId}`);
        }

    } else if (data.task === 'UPDATE_SESSION_STATUS') {

        const filter = {"_id.sessionId": data.sessionId };
        const update_data = { $set: { "status": data.newStatus } };

        // await dbCrudHandler.updateOne(filter, update_data, params);
        await sessionsDb.collection(collection).updateOne(filter,update_data )

        // Actualizar estado en Redis
        if (data.sessionId && redisClient && redisClient.isOpen) {
            const currentSession = await getSession(data.sessionId);
            if (currentSession) {
                currentSession.status = data.newStatus;
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
    
    // Obtenemos la fecha del id de session para acceder a la DB
    const sessionString = sessionId.split("_")[1]
    // const objId = new ObjectId(sessionString);
    const objId = ObjectId.createFromHexString(sessionString);
    const fechaCreacionSession = objId.getTimestamp();
    const [, month, day , year] = fechaCreacionSession.toString().split(' ');
    const normalizedMonth = month.toLowerCase();
    
    const now = Date.now()
    if (!sessionId) return null;

    // 1. Intentar leer desde Redis (rápido en RAM)
    const redisKey = `session:${sessionId}`;
    const sessionData = await redisClient.get(redisKey);

    if (sessionData) {
        return JSON.parse(sessionData);
    }

    // 2. Fallback a MongoDB si expiró en Redis o hubo reinicio
    try {
        const db = await getDb(systemConfig.DBS.SESSIONS + year);
        const sessionsCollection = db.collection(normalizedMonth);
        const session = await sessionsCollection.findOne({ '_id.sessionId': sessionId, isValid: true });

        if(session && now > session.expiresAt){
            // SESION EXPIRADA -> ha de volver a loguearse
            return null;
        
        }else if (session) {
            // Repoblar en Redis con TTL restante
            await redisClient.set(redisKey, JSON.stringify(session), {
                EX: (session.expiresAt - (now)) / 1000          // Cuando Expiraba menos ahora y dividido por 1000 para pasarlo a segundos
            });
            return session;
        }else{
            return null;
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

/** REVISAR ESTO !!!!!
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
        const db = await getDb('users_data');
        const sessionsCollection = db.collection('sessions');
        await sessionsCollection.updateOne(
            { 'customId.sessionId': sessionId },
            { $set: { isValid: false, destroyedAt: Date.now() } }
        );
    } catch (err) {
        console.error('⚠️ Error al invalidar sesión en MongoDB:', err.message);
    }
}