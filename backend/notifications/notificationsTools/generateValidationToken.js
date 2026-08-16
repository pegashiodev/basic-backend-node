

import { randomInt } from 'node:crypto';
import { redisClient } from '../../db/openRedis.js';
import systemConfig from '../../globalData/systemConfig.js';

/**
 * Genera un código de 6 dígitos y lo almacena en Redis (TTL 15 min por defecto)
 */
export default async function generateValidationToken(email) {
    const code = randomInt(100000, 999999).toString();
    const ttlSeconds = Math.ceil((systemConfig.TOKENS_AGE?.VALIDATION_TOKENS_AGE || 900000) / 1000);

    if (redisClient && redisClient.isOpen) {
        await redisClient.set(`verify:email:${email}`, code, { EX: ttlSeconds });
    }
console.log({code})
    return code;
}

/**
 * Valida el código contra Redis y lo elimina si coincide (un solo uso)
 */
export async function checkValidationToken(email, code) {
    if (!redisClient || !redisClient.isOpen || !email || !code) return false;

    const storedCode = await redisClient.get(`verify:email:${email}`);
    if (storedCode && storedCode === code.toString()) {
        await redisClient.del(`verify:email:${email}`);
        return true;
    }
    return false;
}