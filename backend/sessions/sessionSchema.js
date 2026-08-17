

import { v4 as uuidv4 } from 'uuid';

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
export function createSessionObject({ userId, email, role = 'user', ip = 'unknown', userAgent = 'unknown', extraData = {} }) {

    // console.log({ userId, email, role, ip, userAgent, extraData })
    const now = Date.now();
    const sessionId = uuidv4();

    return {
        // Datos inmutables de identificación
        _id: {
            _id: sessionId,
            userId,
            email: email.trim().toLowerCase()
        },
        // Estado y metadatos mutables de la sesión
        role,
        status: "ACTIVE",   // [ENDED, PAUSED, BLOCKED]
        createdAt: now,
        lastActiveAt: now,
        ip,
        userAgent,
        isValid: true,
        extraData: {}
    };
}
