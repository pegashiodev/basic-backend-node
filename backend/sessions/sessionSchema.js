

import { v4 as uuidv4 } from 'uuid';
import systemConfig from '../globalData/systemConfig.js';

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
// console.log({ userId, email, role, ip, userAgent, extraData })
    const [, month, day , year] = new Date().toString().split(' ');
    const now = Date.now();
    const customSessionId = `ses_${uuidv4()}_${month.toLowerCase()}_${year}`;
    const normalizedEmail = email.trim().toLowerCase();
    return {
        // Datos inmutables de identificación
        _id: {
            //_id: sessionId,
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
