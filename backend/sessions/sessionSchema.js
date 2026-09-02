

import { v4 as uuidv4 } from 'uuid';
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
    const [, month, day , year] = new Date().toString().split(' ');
    const now = Date.now();
    const sessionId = new ObjectId().toString();
    const normalizedEmail = email.trim().toLowerCase();
    const customSessionId = sessionId;
    
    return {
        // Datos inmutables de identificación
        _id: {
            sessionId: customSessionId,
            userId,
            email: normalizedEmail
        },
        // Estado y metadatos mutables de la sesión
        userId: userId,
        sessionId: customSessionId,
        email: normalizedEmail,
        role,
        status: "ACTIVE",   // [ENDED, PAUSED, BLOCKED]
        createdAt: now,
        expiresAt: now + (systemConfig.TOKENS_AGE.SESSION_TTL_SECONDS * 1000),
        lastActiveAt: now,
        ip: ip,
        userAgent: userAgent,
        isValid: true,
        extraData: {}
    };
}
