

/**
 * MANEJADOR DE SESIONES CON PERSISTENCIA EN MONGO Y CACHÉ CENTRALIZADA EN REDIS
 */

import { redisClient } from '../db/openRedis.js';
import systemConfig from '../globalData/systemConfig.js';
import dbCrudHandler from '../db/dbCrudHandler.js';
import sessionSchema from "./sessionSchema.js";
import addNewUserDevice from "../tools/addNewUserDevice.js";
import verifyTokensAndSetCookie from "../tools/verifyTokensAndSetCookie.js";

/**
 * CREAR UNA SESIÓN PARA EL USUARIO
 */
export const addSession = async (req, from) => {
    if (!req.user) {
        return { status: 'error', message: 'No hay usuario en la petición' };
    }

    if (from !== 'SIGNUP') {
        const match = req.user.userDevices?.some((el) => {
            return (el.userAgent === req.body?.userAgent && el.deviceId === req.body?.deviceId);
        });

        if (!match) {
            addNewUserDevice(req);
        }
    }

    // Configurar tokens y cookies
    verifyTokensAndSetCookie(req, req.user, "ADD_SESSION");

    const session_data = sessionSchema(req);
    const session = session_data.session;

    // 1. Almacenar sesión en MongoDB
    const params = {
        dbName: systemConfig.DBS.SESSIONS + session.date.year,
        collection: session.date.month,
        await: true
    };

    const result = await dbCrudHandler.insertOne(session, params);

    // 2. Almacenar sesión en Redis con TTL automático
    if (result.status === 'ok' && redisClient && redisClient.isOpen) {
        const redisKey = `session:${req.user.email}`;
        const ttlSeconds = Math.ceil(systemConfig.TOKENS_AGE.SESSION_DURATION / 1000);
        
        await redisClient.set(redisKey, JSON.stringify(session), { EX: ttlSeconds });

        result.atk = req.accessData.accessToken;
        result.rtk = req.refreshData.refreshToken;
        result.userDevices = req.user.userDevices;
    }

    return result;
};

/**
 * OBTENER SESIÓN DESDE REDIS
 */
export const getSession = async (email) => {
    if (!email || !redisClient || !redisClient.isOpen) return null;
    try {
        const sessionStr = await redisClient.get(`session:${email}`);
        return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (err) {
        console.error('Error obteniendo sesión de Redis:', err.message);
        return null;
    }
};

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

        // Eliminar sesión de Redis
        if (redisClient && redisClient.isOpen) {
            await redisClient.del(`session:${data.email}`);
        }

    } else if (data.task === 'UPDATE_SESSION_STATUS') {
        const filter = { _id: data.sessionId };
        const update_data = { $set: { "status": data.new_value } };

        if (data.await) {
            await dbCrudHandler.updateOne(filter, update_data, params);
        } else {
            dbCrudHandler.updateOne(filter, update_data, params);
        }

        // Actualizar estado en Redis
        if (redisClient && redisClient.isOpen) {
            const currentSession = await getSession(data.user.email);
            if (currentSession) {
                currentSession.status = data.new_value;
                const ttl = await redisClient.ttl(`session:${data.user.email}`);
                if (ttl > 0) {
                    await redisClient.set(`session:${data.user.email}`, JSON.stringify(currentSession), { EX: ttl });
                }
            }
        }
    }
};

export const deleteSesion = async (email) => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.del(`session:${email}`);
    }
    return { status: 'ok' };
};

export default {
    addSession,
    getSession,
    updateSession,
    deleteSesion
};
