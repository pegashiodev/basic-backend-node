

/**
 * SERVICIO DE ÍNDICE DE USUARIOS EN REDIS
 * Mapea email -> Localización en MongoDB ({ from: { month, year }, _id, ... })
 */

import { redisClient } from './openRedis.js';

export async function getUserPointer(email) {
    if (!email || !redisClient || !redisClient.isOpen) return null;
    try {
        const raw = await redisClient.get(`user:idx:${email.toLowerCase().trim()}`);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.error('❌ Error leyendo user:idx en Redis:', err.message);
        return null;
    }
}

export async function setUserPointer(email, pointerData) {
    if (!email || !pointerData || !redisClient || !redisClient.isOpen) return false;
    try {
        // Sin TTL: es un índice permanente en Redis
        await redisClient.set(`user:idx:${email.toLowerCase().trim()}`, JSON.stringify(pointerData));
        return true;
    } catch (err) {
        console.error('❌ Error guardando user:idx en Redis:', err.message);
        return false;
    }
}

export async function deleteUserPointer(email) {
    if (!email || !redisClient || !redisClient.isOpen) return false;
    try {
        await redisClient.del(`user:idx:${email.toLowerCase().trim()}`);
        return true;
    } catch (err) {
        console.error('❌ Error borrando user:idx en Redis:', err.message);
        return false;
    }
}