import { randomInt } from 'node:crypto';
import { redisClient } from '../../db/openRedis.js';
import systemConfig from '../../globalData/systemConfig.js';

export default async function generateValidationToken(email) {
    // Generar código numérico de 6 dígitos criptográficamente seguro
    const code = randomInt(100000, 999999).toString();
    const ttlSeconds = Math.ceil((systemConfig.TOKENS_AGE?.VALIDATION_TOKENS_AGE || 900000) / 1000);

    if (redisClient && redisClient.isOpen) {
        await redisClient.set(`verify:email:${email}`, code, { EX: ttlSeconds });
    }

    return code;
}

export async function checkValidationToken(email, code) {
    if (!redisClient || !redisClient.isOpen) return false;
    const storedCode = await redisClient.get(`verify:email:${email}`);
console.log({storedCode})
    if (storedCode && storedCode === code.toString()) {
        await redisClient.del(`verify:email:${email}`); // Consumir código (un solo uso)
        return true;
    }
    return false;
}