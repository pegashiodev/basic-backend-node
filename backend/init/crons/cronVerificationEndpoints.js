

/***
 *      CUANDO SE CREAN ENDPOINTS DE VALIDACION O VERIFICACION
 *      SE ALMACENAN EN MEMORIA
 *      CADA CIERTO TIEMPO SE RECORREN Y SE ELIMINAN LOS EXPIRADOS O USADOS
 * 
 *       const verify_endpoint_data = {
             url_token: url_token,
             endpoint:  midominio.com/endpoint/?tk=url_token
             userId: data.userId,
             email: data.email,
             name: data.name, 
             lastName: data.lastName,
             expireTime:  now + systemConfig.TOKENS_AGE.VERIFICATION_ENDPOINTS_AGE,
             purpose: "EMAIL_VERIFICATION",
             used: false,
         }
 * 
 */


import verificationEndpoints from "../../globalData/verificationEndpoints.js";


export default function(){

    console.log("CRON_VERIFICATION_ENDPOINTS")

    const items = Object.keys(verificationEndpoints)
    let len = items.length;
    const now = Date.now()

    while(len--){

        if(verificationEndpoints[items[len]].expireTime < now || verificationEndpoints[items[len]].used){
            delete verificationEndpoints[items[len]]

        }

    }

}