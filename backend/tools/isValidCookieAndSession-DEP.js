
/**
 * 
 *      COMPRUEBA QUE LA COOKIE Y LA SESSION CON CORRECTAS
 *          - ACTIVAS
 *          - VALIDAS
 *      
 *  
 * 
 */

import verifyTokensAndSetCookie from "./verifyTokensAndSetCookie.js"
import systemConfig from "../globalData/systemConfig.js"
import getOurCookie from "./getOurCookie.js"
import sessionHandler from "../sessions/sessionHandler.js"
import sessionsCached from "../globalData/sessionsCached.js"
import usersByEmail from "../globalData/usersByEmail.js"

export default async (req, res)=>{

    console.log("IN isValidCookieAndSession")
    const from = "ISVALIDCOOKIEANDSESSION"

    if(!req.headers.cookie ){
        let location = systemConfig.PAGES.SESSION_IS_REQUIRED

        // aÑADIMOS A LA URL LA PAGINA DESDE LA QUE HA LLEGADO PARA REENVIARLO DESPUES DEL LOGIN
        if(req.urlData.searchParams && req.urlData.searchParams.from){
            location += `?from=${req.urlData.url}`
            location += `?&${req.urlData.search}`
        }


        // if(req.urlData.searchParams?.from){
        //     location = `${systemConfig.PAGES.SESSION_IS_REQUIRED}/?from=${req.urlData.searchParams.from}&search=${req.urlData.searchParams.search}`
        
        // }

        console.log(" ** enviamos al login !!!")
        // REDIRIGIMOS A LOGIN
        const response_data = {
            status: systemConfig.STATUS.ERROR_FETCH,
            // location: systemConfig.PAGES.ACCESS_PLATFORM,
            location: location,

            code: errorsCodes.c452.code,
            message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return false;
        
    }

    const result_getOuCookie = getOurCookie(req)
    console.log(result_getOuCookie)
    
        if(result_getOuCookie.status !== 'ok'){

            if(result_getOuCookie.task === "SEND_FETCH_ERROR"){
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result_getOuCookie.response_data));
            return false;
        }
    }

    
    req.user = usersByEmail[req.our_cookie.atk_decoded.email]

    if(!req.user){
        // solicitamos ruta y no hay user?? 
        // RENVIAMOS AL LOGIN / SIGNIN
        const response_data = {
            status: systemConfig.STATUS.ERROR_FETCH,
            // location: systemConfig.PAGES.ACCESS_PLATFORM,
            location: systemConfig.PAGES.SESSION_IS_REQUIRED,

            code: errorsCodes.c467.code,
            message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return false;

    }
    
    if(req.user.status ===  systemConfig.STATUS.EMAIL_NOT_VERIFIED){
        // enviamos al login
        console.log("RESTRICTED-ENDPOINTS -> AUN NO SE HA VERIFICADO EL EMAIL")
        // REDIRIGIMOS A LOGIN
        // RENVIAMOS AL LOGIN / SIGNIN
        const response_data = {
            status: systemConfig.STATUS.ERROR_FETCH,
            location: systemConfig.PAGES.EMAIL_VERIFICATION_INFO,
            code: errorsCodes.c467.code,
            message: "ERROR EN EL CHECOUT",            //errorCodes.c531.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return false;
    }
    
    if(req.user.status !== 'ACTIVE'){
        
        // RENVIAMOS AL LOGIN / SIGNIN
        const response_data = {
            status: systemConfig.STATUS.ERROR_FETCH,
            location: systemConfig.PAGES.USER_NOT_ACTIVE,
            code: errorsCodes.c467.code,
            message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return false;
    }
    
    req.body.userAgent = req.headers['user-agent']
        
    // req.our_cookie = {atk_decoded, rtk_decoded, id}

    let session = sessionsCached[req.our_cookie.atk_decoded.email];

    if(session){

        console.log('*** HAY SESSION ABIERTA');

        const now = Date.now();
        
        // comprobamos si la session ha teminado
        if(session.status === 'ENDED' || now > session.expireTime){

            console.log('!! SESION CADUCADA **** ');
            // ALMACENAMOS LA FINALIZADA
        
            session.status = 'ENDED'
            let data = {
                task: 'SESSION_ENDED',
                email: req.user.email,
                new_value: session,
                await: false
            }
            sessionHandler.updateSession(data)

            // NUEVA SESSION
            let result_session = await sessionHandler.addSession(req, from)
        
            if(result_session.status !== 'ok'){
                console.log("NO HEMOA PODIDO CREAR LA NUEVA SESSION DEL USUARIO -> FROM: ROUTER-RESTRICTED-ENDPOINTS")
                // RENVIAMOS AL LOGIN / SIGNIN
                const response_data = {
                    status: systemConfig.STATUS.ERROR_FETCH,
                    location: systemConfig.PAGES.ACCESS_PLATFORM,
                    code: errorsCodes.c467.code,
                    message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response_data))
                return false;
            }

        }else if(req.user.status === 'HACKED'){
            console.log('ERROR -> Usuario HACKEADO')
            const response_data = {
                status: systemConfig.STATUS.ERROR_FETCH,
                location: systemConfig.PAGES.ACCOUNT_RECOVERY_INFO,
                code: errorsCodes.c467.code,
                message: "ERROR EN EL CHECOUT",            //errorCodes.c531.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return false;

        }else if(req.user.status === 'BLOCKED'){
            console.log('ERROR -> Usuario BLOQUEADO POR ALGUN MOTIVO')
            const response_data = {
                status: systemConfig.STATUS.ERROR_FETCH,
                location: systemConfig.PAGES.BLOCKED_ACCOUNT_INFO,
                code: errorsCodes.c467.code,
                message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return false;
        } 

        // hay session -> verificamos expireTime de los tokens
        verifyTokensAndSetCookie(req, req.user, "CHECKOUT")
        
    }else{

        console.log('*** NO HAY SESSION ABIERTA -> caduco y  se elimino' );
        
        // NUEVA SESSION -> AHI SE CREA TODO: SESSION, NUEVA COOKIE, ...
        
        let result_session = await sessionHandler.addSession(req, from)

        if(result_session.status !== 'ok'){
            console.log("NO HEMOA PODIDO CREAR LA NUEVA SESSION DEL USUARIO -> FROM: ROUTER-RESTRICTED-ENDPOINTS")
            // REDIRIGIMOS A LOGIN
            // RENVIAMOS AL LOGIN / SIGNIN
            const response_data = {
                status: systemConfig.STATUS.ERROR_FETCH,
                location: systemConfig.PAGES.SYSTEM_ERROR_OCURRED,
                code: errorsCodes.c467.code,
                message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return false;
        }
    }
    return true;
    

}