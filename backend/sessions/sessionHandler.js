

import { redisClient } from '../db/openRedis.js';
import { getDb } from '../db/openDbs.js';
import { createSessionObject } from './sessionSchema.js';

// TTL por defecto para Redis (ej. 24 horas en segundos)
const SESSION_TTL_SECONDS = 60 * 60 * 24;

/**
 * Crea y persiste una nueva sesión
 * @param {Object} sessionInput - Parámetros para el sessionSchema
 * @returns {Promise<Object>} Objeto de sesión completo creado
 */
export async function createSession(sessionInput) {
    const session = createSessionObject(sessionInput);
    const { sessionId, userId } = session.customId;

    // 1. Guardar en Redis con expiración automática (TTL)
    const redisKey = `session:${sessionId}`;
    await redisClient.set(redisKey, JSON.stringify(session), {
        EX: SESSION_TTL_SECONDS
    });

    // Opcional: Índice secundario en Redis para rastrear sesiones activas por usuario
    await redisClient.sAdd(`user:sessions:${userId}`, sessionId);

    // 2. Persistir en MongoDB (colección centralizada de sesiones)
    try {
        const db = getDb('users_data');
        const sessionsCollection = db.collection('sessions');
        await sessionsCollection.insertOne(session);
    } catch (err) {
        console.error('⚠️ No se pudo persistir la sesión en MongoDB (continúa con Redis):', err.message);
    }

    return session;
}

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