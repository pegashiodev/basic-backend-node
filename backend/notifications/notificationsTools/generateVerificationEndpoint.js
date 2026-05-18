

/***
 * 
 *      QUE HACE:
 * 
 *      - Genera un endpoint encriptado con datos del usuario para ser enviado por email o sms
 *      
 *      - Lo almacena en cache
 *      - Lo almacena en DB
 * 
 * 
 * 
 *      LLAMADO DESDE:
 * 
 *      - signinHandler.js
 *      - ForgotPasswordHelper,js
 *      - emailVerificationHandler.js
 *      - userHacked.js
 * 
 */



// import {randomUUID, verify} from 'crypto'
// import {hashToken} from "../../tools/tokenGenerator.js";
import systemConfig from '../../globalData/systemConfig.js';
import verificationEndpoints from '../../globalData/verificationEndpoints.js';
// import dbCrudHandler from '../db/dbCrudHandler.js';

const months = ['ene', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec' ]

const tokens_endpoints = {
    
    "SIGNUP": "/email-verification/?tk=",
    "EMAIL_VERIFICATION": "/email-verification/?tk=",
    "FORGOT_PASSWORD": "/renove-password/?tk=",
    "HACKED": "/recovery-account/?tk="
}

export default async function(data){
    console.log("GENERATE-VERIFICATION-ENDPOINT");
    console.log(data)
    const now = Date.now();

    // GENERAMOS UN URL_TOKEN CON EL EMAIL, CODIGO Y EXPIRETIME
    if(data.from === 'SIGNUP' || data.from === "EMAIL_VERIFICATION" || data.from === "FORGOT_PASSWORD" || data.from === "HACKED"){

        const url_token = "12345A"
        // const url_token = "?tk=" + randomUUID()

        // url_token: randomUUID(),
        const verify_endpoint_data = {
            url_token: url_token,
            endpoint: tokens_endpoints[data.from] + url_token,                  // midominio.com/endpoint/?tk=url_token
            userId: data.userId,
            email: data.email,
            name: data.name, 
            lastName: data.lastName,
            expireTime:  now + systemConfig.TOKENS_AGE.VERIFICATION_ENDPOINTS_AGE,
            purpose: "EMAIL_VERIFICATION",
            used: false,
        }

        if(data.from === "FORGOT_PASSWORD"){
            verify_endpoint_data.purpose = "FORGOT_PASSWORD";
        
        }else if(data.from === "HACKED"){

            verify_endpoint_data.url_token = "67890A";
            verify_endpoint_data.purpose = "HACKED";

        }
        // HAY QUE ALMACENARLOS EN UNA LISTA PARA COMPROBAR SU ESTADO Y CADUCIDAD
        verificationEndpoints[verify_endpoint_data.url_token] = verify_endpoint_data;
        return verify_endpoint_data;
        
        // console.log(verificationEndpoints)
        // ALMACENAMOS ETAMBIEN EN DB.
        // HACEMOS UN UPDATE PARA SIEMPRE 


        /**
         *  NO LOS ALMACENAMOS EN MEMORIA
         *  TIENEN UNA CADUCIDAD DE ENTRE 5 Y 10 MINUTOS
         *  NO MERECE LA PENA 
         *  SI DESAPARACEN, POR REINICIO, SE PUEDE SOLICITAR OTRO
         * 
         * 
         */

        // const filter = {_id: verify_endpoint_data.url_token}

        // const params = {
        //     dbName: systemConfig.DBS.VERIFICATION_ENDPOINTS + `_${new Date(now).getFullYear()}`,
        //     collection: "emails", 
        //     await: data.await, 
        //     upsert: true
        // }
        // const update_data = {$set: verify_endpoint_data}
    
        // // Colocamos el _id CORRECTO para la DB
        // verify_endpoint_data._id = verify_endpoint_data.url_token
        // if(data.await){

        //     const result_add_token = await dbCrudHandler.updateOne(filter, update_data, params)
        //     if(result_add_token.status !== 'ok'){
        //         return{ status: "error"}
        //     } 
    
        //     return { ...verify_endpoint_data, status: "ok", }
        // }
        // return;
        


        // data.tokenId = randomUUID();
        // // data.tokenId = "12345"
        // data.expireTime = now + systemConfig.TOKENS_AGE.VERIFICATION_ENDPOINTS_AGE
        // const url_token = hashToken(JSON.stringify(data));
    
        // // HAY QUE ALMACENARLOS EN UNA LISTA PARA COMPROBAR SU ESTADO Y CADUCIDAD
        // verificationEndpoints[data.tokenId] = {
        //     status: 'ACTIVE',
        //     id: data.tokenId,
        //     token: url_token,
        //     expireTime: data.expireTime
        // }
        // // ALMACENAMOS ETAMBIEN EN DB.
        // const params = {
        //     dbName: systemConfig.DBS.VERIFICATION_ENDPOINTS + `_${new Date(now).getFullYear()}`,
        //     collection: months[new Date(now).getMonth()],
        // }

        // const data_db = {...verificationEndpoints[data.tokenId], _id:data.tokenId}
        // await dbCrudHandler.insertOne(data_db, params)

        //return { ...url_token, id_verify_email: data.tokenId, id_verify_expireTime: data.expireTime}
    
    }

}