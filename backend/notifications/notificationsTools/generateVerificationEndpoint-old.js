

/***
 * 
 *      QUE HACE:
 * 
 *      - Genera un endpoint encriptado con datos del usuario para ser enviado por email 
 * 
 *      - ES UN ENDPOINT PARA LOS CASOS DE: "FORGOT PASSWORD" Y "USER HACKED"
 *        
 * 
 *     
 *      - Lo almacena en cache (TIENEN UN PERIODO DE VIDA BAJO)
 *      - 
 *       
 * 
 *      LLAMADO DESDE: sendEmail.js
 * 
 *      @param
 *          data = {
 *          from: "desde donde se ha llamado esta funcion",
 *          await: "si se espera una respuesta"
 *          
 *          }
 *     @param
*          user = { userId, email, name, lastName, ... }
 * 
 */


import systemConfig from '../../globalData/systemConfig.js';
import verificationEndpoints from '../../globalData/verificationEndpoints.js';


/** DESDE QUE TAREA SE SOLICITO ESTE SERVICIO: Este diccionario establece la primera parte del endpoint a falta del token */
const tokens_endpoints = {
    
    "SIGNUP": "/email-verification/?tk=",
    "EMAIL_VERIFICATION": "/email-verification/?tk=",
    "FORGOT_PASSWORD": "/renove-password/?tk=",
    "HACKED": "/recovery-account/?tk="
}

export default async function(data, user){
    console.log("GENERATE-VERIFICATION-ENDPOINT");
    console.log(data)
    const now = Date.now();

    // if(!tokens_endpoints[data.from]){
    //     return {status: "error"}
    // }

    // GENERAMOS UN URL_TOKEN CON EL EMAIL, CODIGO Y EXPIRETIME
    if( data.from === "SIGNUP" || data.from === "FORGOT_PASSWORD"){

        /** HARD-CODEADO PARA LAS PRUEBAS EN DESARROLLO */
        // const url_token = "12345A"
        const url_token = "?tk=" + randomUUID()
console.log({url_token})
        const verify_endpoint_data = {
            status: "ok",
            url_token: url_token,
            endpoint: tokens_endpoints[data.from] + url_token,                  // midominio.com/endpoint/?tk=url_token
            userId: user.userId,
            email: user.email,
            name: user.name, 
            lastName: user.lastName,
            expireTime:  now + systemConfig.TOKENS_AGE.VERIFICATION_ENDPOINTS_AGE,
            purpose: "EMAIL_VERIFICATION",
            used: false,
        }

        if(data.from === "FORGOT_PASSWORD"){
            verify_endpoint_data.purpose = "FORGOT_PASSWORD";
        
        }
        // HAY QUE ALMACENARLOS EN UNA LISTA PARA COMPROBAR SU ESTADO Y CADUCIDAD
        // SOLO SON VALIDOS DURANTE UNOS POCOS MINUTOS. 
        // POR ESO NO LOS ALMACENAMOS EN DB
        verificationEndpoints[verify_endpoint_data.url_token] = verify_endpoint_data;
        return verify_endpoint_data;
        
        // console.log(verificationEndpoints)
      
    }else{
        console.log("ERROR en generateVerificationEndpoint: el from no es correcto")
        return {status: "error"}
    }

}