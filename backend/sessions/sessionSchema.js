

import systemConfig from '../globalData/systemConfig.js';
import {ObjectId} from "mongodb"

/**
 * Genera el esquema de una nueva sesión
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.email
 * @param {string} [params.role='user']
 * @param {string} [params.ip='unknown']
 * @param {string} [params.userAgent='unknown']
 * @param {Object} [params.extraData={}]
 * @returns {Object} Estructura normalizada de sesión
 */
export function createSessionObject(req, user) {

    const { userId, email, role = 'USER', extraData = {} } = user
    const {ip, userAgent} = req
    const date = new Date();
    const now = Date.now();
    const sessionId = new ObjectId();
    const sessionIdString = sessionId.toString()
    const normalizedEmail = email.trim().toLowerCase();
    
    return {
        // Datos inmutables de identificación
        _id: sessionId,
        sessionId: sessionId,
        sessionIdString: sessionIdString,
        email: normalizedEmail,
        userId: userId, 
        userIdString: userId.toString(),
            
        role,
        status: "ACTIVE",   // [ENDED, PAUSED, BLOCKED]
        createdAt: now,
        expiresAt: now + (systemConfig.TOKENS_AGE.SESSION_TTL_SECONDS * 1000),
        lastActiveAt: now,
        ip: ip,
        userAgent: userAgent || "",
        isValid: true,
    };
}
