
/**
 * 
 *  GENERAMOS UN ENDPOINT TEMPORAL PARA QUE EL USUARIO HAGA UNA TAREA, COMO POR EJEMPLO EL CAMBIO DEL PASSWORD
 * 
 */

import { randomInt } from 'node:crypto';
import { redisClient } from '../../db/openRedis.js';
import systemConfig from '../../globalData/systemConfig.js';

export default async function generateValidationEndpoint(email) {

    let base_url_endpoint = "/renove-password/?tk="
    // Generar código numérico de 6 dígitos criptográficamente seguro
    const code = randomInt(100000, 999999).toString();
    const ttlSeconds = Math.ceil((systemConfig.TOKENS_AGE?.VALIDATION_TOKENS_AGE || 900000) / 1000);

    if (redisClient && redisClient.isOpen) {
        await redisClient.set(`verify:endpoint:${email}`, code, { EX: ttlSeconds });
    }else{

    }

    console.log(base_url_endpoint + code)
    return base_url_endpoint + code + `&email=${email}`;

}

export async function checkValidationEndpoint(email, code) {
    if (!redisClient || !redisClient.isOpen || !email || !code) return false;
    const storedEndpoint = await redisClient.get(`verify:endpoint:${email}`);
console.log({storedEndpoint})
    if (storedEndpoint && storedEndpoint === code.toString()) {
        await redisClient.del(`verify:endpoint:${email}`); // Consumir código (un solo uso)
        return true;
    }
    return false;
}