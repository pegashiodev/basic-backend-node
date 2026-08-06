
/**
 * 
 * 
 * GENERA UN TOKEN DE VALIDACION PARA ADMINIR ALGUNA OPERACION, 
 * COMO EL SIGNUP, ...
 * 
 *  REcibimos un OBJETO data con al menos:
 *      . - data.email,
 *        - data.name,
 * 
 * 
 * 
 */


// Almacenamos el Cache y en DB ?? Solo son validos 5 minutos

import systemConfig from "../../globalData/systemConfig.js"
import validationTokens from "../../globalData/validationTokens.js"



/**
 * 
 * @param {object} data -> datos para crear el token
 * @returns 
 */
export default function(data){

    const now = Date.now()

    const token_data = {
        
        token: "ABCDE", // PARA LAS PRUEBAS ESTAMOS USANDO SIEMPRE EL MISMO
        expireTime: now + systemConfig.TOKENS_AGE.VALIDATION_TOKENS,
        // email: data.email,
        // name: data.name,
    }

    validationTokens[data.email] = token_data;  // ALMACENAMOS POR el email del usuario para mas tarde localizarlo.
    return token_data;

}