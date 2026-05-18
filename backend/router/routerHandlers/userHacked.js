/**
 * 
 *      POR ALGUN COMPORTAMIENTO DETECTADO EN LA NAVEGACION DECIDIMOS
 *      MARCAR LA CUENTA COMO HACKED
 * 
 *      MARCAMOS EL USUARIO Y LA SESSION ACTUAL SI LA HAY.
 * 
 *      SE PUEDE DESBLOQUEAR DESDE EL ENDPOPINT QUE ENVIAMOS POR EMAIL
 *      DONDE CAMBIARA LA CONTRASEÑA O PEDIREMOS ALGUN DATO MAS
 * 
 * 
 * 
 * 
 */

import sessionsCached from "../../globalData/sessionsCached.js";
import userHandler from "../../users/userHandler.js";
import sendEmail from "../../notifications/sendEmail.js";
import systemConfig from "../../globalData/systemConfig.js";
import sendStaticFile from "../../server/serverHandlers/sendStaticFile.js"
// import generateVerificationEndpoint from "../../tools/generateVerificationEndpoint.js";
import sessionHandler from "../../sessions/sessionHandler.js";
import log from "../../tools/log.js";




export default async function(req, res, origin){

    const FROM_LOGS = "userHacked.js"
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR"

    log(FROM_LOGS,"Usuario PRESUNTAMENTE HACKEADO POR ALGUN MOTIVO", INFO_LOGS)

    const from = "userHacked.js"
    // ALMACENAMOS LA ANTIGUA SESSION EN DB Y CREAMOS UNA NUEVA
    // TENEMOS EL EMAIL PARA PODER ENVIARLE UNO
   
    
     if(origin === 'LOGIN'){
       // Desde el LOGIN AQUI SIEMPRE HA DE LLEGAR UN USUARIO, SINO SE HA CERRADO LA CONEXION EN EL LOGIN
        if(!req.user){
            // Es un Fetch
            const response_data = {
                status: 'error',
                code: 481,
                message: 'ERROR EN EL LOGIN -> PH',
                location: systemConfig.PAGES.RECOVERY_ACCOUNT_INFO
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return;
    
        }
        
        // // ENVIAR EMAIL informando el ususrio de un posible hackeo y para que cambie PASSWORD --> 
        // const data_gen_endopoint = {
        //     email: req.user.email,
        //     name: req.user.name,
        //     lastName: req.user.lastName,
        //     from: "HACKED",
        //     await: true,
        // }
        // const gen_url_token = await generateVerificationEndpoint(data_gen_endopoint);
        
        // if(gen_url_token.status !== "ok"){
        //     log("ERROR generando el url_token", FROM_LOGS, ERROR_LOGS)
        //     const response_data = {
        //         status: 'error',
        //         message: 'ERROR generando el nuevo url_token',
        //         location: systemConfig.PAGES.SEND_RECOVERY_ACCOUNT_ERROR
        //     }
        //     res.writeHead(200, 
        //         {   'Content-Type': 'application/json',
        //          });
        //     res.end(JSON.stringify(response_data))
        //     return;
        // }

        let data_email = { 
            task: "SEND_USER_HACKED_ALERT",
            from: "HACKED",
            await: true
        }  
        const result_email = await sendEmail(data_email, req.user);
        
        if(result_email.status !== 'ok'){
        
            // TENEMOS QUE SEGUIR INTENTANDOLO MAS TARDE Y 
            // ALMACENAR EN ALGUN SITIO ESTA SITUACION 
            // PARA PODER RECUPERAR LA CUENTA MAS ADELANTE
        
            log("***ERROR ->  NO HEMOS PODIDO ENVIAR EL EMAIL DE AVISO DE CUENTA HACKEADA", FROM_LOGS, ERROR_LOGS)
             // Es un Fetch
            const response_data = {
                status: 'error',
                message: 'NO HEMOS PODIDO ENVIAR EL EMAIL DE AVISO DE USER-HACKED',
                location: systemConfig.PAGES.SEND_RECOVERY_ACCOUNT_ERROR

            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(response_data))
            return;
        
        }
        // FINALIZAMOS SESSION SI LA HAY
        if(sessionsCached[req.user.email]){
            
            sessionsCached[req.user.email].status = 'ENDED'
            let data_session = {
                task: 'UPDATE_SESSION_STATUS',
                user: req.user,
                sessionId: sessionsCached[req.user.email]._id,
                new_value: 'ENDED',
                await: false
            }
            sessionHandler.updateSession(data_session)
        }
        // ACTUALIZAMOS EL ESTADO DEL USER A "HACKED"
        let data_user = {
            task: "UPDATE_USER_STATUS",
            user: req.user,
            new_value: "HACKED",
            await: false
        }
        userHandler.updateUser(data_user);

        // Es un Fetch (POST)
        // LE REDIRIGE A UNA PAGINA INFORMATIVA
        const response_data = {
            status: 'error',
            message: 'FALTA ALGUNO DE LOS TOKENS -> EMAIL PARA RECUPERAR LA CUENTA',
            location: systemConfig.PAGES.ACCOUNT_RECOVERY_INFO
        }
        // Borramos las cookies actuales
        res.writeHead(200, 
            {   'Content-Type': 'application/json',
                "Set-Cookie": systemConfig.COOKIE.CLEAN_ALL_ACCESS_TOKENS
             });
        res.end(JSON.stringify(response_data))
        return;
    

        
    }else {

        if(!req.user){
            res.code = 302
            // res.headers = {location: systemConfig.PAGES.RECOVERY_ACCOUNT_INFO}
            res.headers = {location: systemConfig.PAGES.ACCESS_PLATFORM}

            return sendStaticFile(req, res)
        }
        
        // let data_email = { 
        //     task: "SEND_USER_HACKED_ALERT",
        //     from: "HACKED",
        //     await: true
        // }  
        // const result_email = await sendEmail(data_email, req.user);
        
        // if(result_email.status !== 'ok'){
        
        //     // TENEMOS QUE SEGUIR INTENTANDOLO MAS TARDE Y 
        //     // ALMACENAR EN ALGUN SITIO ESTA SITUACION 
        //     // PARA PODER RECUPERAR LA CUENTA MAS ADELANTE
        
        //     log("***ERROR ->  NO HEMOS PODIDO ENVIAR EL EMAIL DE AVISO DE CUENTA HACKEADA", FROM_LOGS, ERROR_LOGS)
        //      // Es un Fetch
        //     const response_data = {
        //         status: 'error',
        //         message: 'NO HEMOS PODIDO ENVIAR EL EMAIL DE AVISO DE USER-HACKED',
        //         location: systemConfig.PAGES.SEND_RECOVERY_ACCOUNT_ERROR

        //     }
        //     res.writeHead(200, {'Content-Type': 'application/json'});
        //     res.end(JSON.stringify(response_data))
        //     return;
        
        // }

        // IREMOS AÑADIENDO ENDPOINTS DONDE SE VERIFIQUE LA COOKIE 
        if(origin === "RESTRICTED_ENDPOINTS" ){
        
            // NO HAY REQ.USER PORQUE NO SE HA PODIDO SACAR DE LA INFO DE LA COOKIE
            // ENVIAMOS UNA PAGINA DONDE EL USER HA DE LOQUEARSE PARA OBTENER SU USER Y
            // PODER ENVIARLE UN EMAIL PARA EL CAMBIO DE PASSWORD
            res.code = 302
            // res.headers = {location: systemConfig.PAGES.RECOVERY_ACCOUNT_INFO}
            res.headers = {location: systemConfig.PAGES.ACCESS_PLATFORM}
            return sendStaticFile(req, res)

        }else if(origin === "CHECKOUT"){
            // es un fetch
            const response_data = {
                status: systemConfig.STATUS.ERROR_FETCH,
                // location: systemConfig.PAGES.RECOVERY_ACCOUNT,
                location: systemConfig.PAGES.ACCESS_PLATFORM,
                code: errorsCodes.c467.code,
                message: "ERROR EN EL CHECOUT -> PH",            //errorCodes.c531.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(response_data))
        }


    }
}