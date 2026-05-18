
/**
 * 
 *  REcibimos un data con al menos:
 *      . - data.email,
 *        - data.name,
 * 
 * 
 * 
 */


// Almacenamos el Cache y en DB ?? Solo son validos 5 minutos

import systemConfig from "../../globalData/systemConfig.js"
import validationTokens from "../../globalData/validationTokens.js"




export default function(data){

    const now = Date.now()

    const token_data = {
        token: "ABCDE",
        expireTime: now + systemConfig.TOKENS_AGE.VALIDATION_TOKENS,
        // email: data.email,
        // name: data.name,
    }

    validationTokens[data.email] = token_data;
    return token_data;

}