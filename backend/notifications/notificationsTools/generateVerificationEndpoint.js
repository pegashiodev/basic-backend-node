
/**
 * 
 *  GENERAMOS UN ENDPOINT TEMPORAL PARA QUE EL USUARIO HAGA UNA TAREA, COMO POR EJEMPLO EL CAMBIO DEL PASSWORD
 * 
 */

import { randomInt } from 'node:crypto';
import { redisClient } from '../../db/openRedis.js';
import systemConfig from '../../globalData/systemConfig.js';

export default async function generateValidationEndpoint(email) {
    if (!redisClient || !redisClient.isOpen || !email) return false;

    let base_url_endpoint = "/renove-password/?tk="
    // BORRAMOS SI EXISTE ALGUNO ANTERIOR SIN CADUCAR
    await redisClient.del(`verify:endpoint:${email}`);
    // Generar código numérico de 6 dígitos criptográficamente seguro
    const code = randomInt(100000, 999999).toString();
    const ttlSeconds = Math.ceil((systemConfig.TOKENS_AGE?.VALIDATION_TOKENS_AGE || 300000) / 1000); // 5 minutos
    await redisClient.set(`verify:endpoint:${email}`, code, { EX: ttlSeconds});

console.log(base_url_endpoint + code)
    return base_url_endpoint + code + `&email=${email}`;

}


// SE verifica el token 2 veces: la segunda vez se elimina.
export async function checkValidationEndpoint(email, code, task) {
    if (!redisClient || !redisClient.isOpen || !email || !code) return false;

    const storedEndpoint =  await redisClient.get(`verify:endpoint:${email}`);

    if (storedEndpoint && storedEndpoint === code.toString()){
        
        // Solo verificacmps que es correcto, pero aun no borramos: LLamamos desde la peticion GET del link que enviamos al email para servir l apagina "renove-password"
        if(task === "VERIFY_ENDPOINT") {
            return true;
        
        // SE BORRA EL TOKEN CUANDO ESTAMOS EN EL ULTIMO PASO DEL "RENOVE PASSWORD"
        }else if(task === "DELETE_ENDPOINT"){
            await redisClient.del(`verify:endpoint:${email}`); // Consumir código (un solo uso)
            return true
        }else{
            return false
        }
    }else{

        return false;
    }
    
}