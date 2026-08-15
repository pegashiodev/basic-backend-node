


/**
 * GENERADOR Y VERIFICADOR DE TOKENS NATIVOS (HMAC-SHA256)
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

// Clave secreta desde variables de entorno
const SECRET_KEY = process.env.SESION_TOKEN_SECRET_KEY || 'default_super_secret_key_change_me';

// Utilidades para Base64URL seguro
const toBase64Url = (str) => Buffer.from(str).toString('base64url');
const fromBase64Url = (str) => Buffer.from(str, 'base64url').toString('utf8');

/**
 * Crea un token firmado: "base64url(payload).firmaHex"
 * @param {Object|string} data 
 * @returns {string|null}
 */
export const hashToken = (data) => {
    if (!data) return null;
    try {
        const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
        const payloadEncoded = toBase64Url(payloadStr);

        const signature = createHmac('sha256', SECRET_KEY)
            .update(payloadEncoded)
            .digest('hex');

        return `${payloadEncoded}.${signature}`;
    } catch (error) {
        console.error('Error al generar token:', error.message);
        return null;
    }
};

/**
 * Verifica la firma y decodifica el token. Devuelve el objeto o null si fue alterado o es inválido.
 * @param {string} token 
 * @returns {Object|null}
 */
export const decodeToken = (token) => {
    if (!token || typeof token !== 'string') return null;

    try {
        const parts = token.split('.');
        if (parts.length !== 2) return null;

        const [payloadEncoded, signature] = parts;

        // 1. Recalcular la firma esperada
        const expectedSignature = createHmac('sha256', SECRET_KEY)
            .update(payloadEncoded)
            .digest('hex');

        // 2. Comparación en tiempo constante para evitar Timing Attacks
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedSigBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedSigBuffer.length || !timingSafeEqual(sigBuffer, expectedSigBuffer)) {
            console.warn('⚠️ Firma de token inválida o manipulada.');
            return null;
        }

        // 3. Decodificar payload JSON
        const payloadJson = fromBase64Url(payloadEncoded);
        return JSON.parse(payloadJson);

    } catch (error) {
        console.error('Error al decodificar token:', error.message);
        return null;
    }
};

export default {
    hashToken,
    decodeToken
};