

/**
 * 
 *  LOGIN CON EL EMAIL DEL USUARIO + PASSWORD
 * 
 *  - PUEDE SER DIRECTO O CON EL ENVIO DE UN TOKEN DE VERIFICAION A SU EMAIL
 * 
 */



import { passwordEncript } from "../routerTools/passwordEncript.js"
import sessionsCached from "../../globalData/sessionsCached.js"

import bodyDataFormatVerify from "../routerTools/bodyDataFormatVerify.js"
import usersByEmail from "../../globalData/usersByEmail.js"
import sessionHandler from "../../sessions/sessionHandler.js"

import systemConfig from "../../globalData/systemConfig.js"
import addNewUserDevice from "../../tools/addNewUserDevice.js"
import verifyTokensAndSetCookie from "../../tools/verifyTokensAndSetCookie.js"
import log from "../../tools/log.js"
import errorsCodes  from "../../tools/errorsCodes.js"
// import generateValidationToken from "../../tools/generateValidationToken.js"
import sendEmail from "../../notifications/sendEmail.js"
import validationTokens from "../../globalData/validationTokens.js"
import getOurCookie from "../../tools/getOurCookie.js"

/**
 * 
 * @param {object} Objeto Request de NodeJS
 * @param {object} Objeto Response de NodeJS
 * 
 */
export default async function(req, res){
   
    const FROM_LOGS = "loginHandler.js"
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR"

    log(FROM_LOGS, "** LOGIN !!", INFO_LOGS)

console.log(req.body)
    //console.log(usersByEmail)
    // Validamos los formatos de los datos recibidos
    let result_body_format = bodyDataFormatVerify(req.body)

    if(result_body_format.status !== 'ok'){
        // RES.END YA SE HA HECHO EN LA FUNCION
        const response_data = {
            status: "error",
            code: 400,
            message: "ERROR EN EL LOGIN",         
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }

    // VERIFICAMOS EL USUARIO RECIBIDO
    let userVerification = verifyUser(req)
    if(userVerification.status !== "ok"){
       
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(userVerification.response_data))
        return;
    }
    
    // VERIFICAMOS SI PASSWORD CORRECTO
    if(!isValidPassword(req, res)){
        const response_data = {
            status: "error",
            code: 400,
            message: "NO ES UN PASSWORD VALIDO",         
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }

    // COMPROBAMOS SU ES UN LOGIN SIN "DOBLE verificacion"
    if(!req.body["fa2"]){
        return loginUser(req, res)
     
     
    // SI  O REQUIERE SEGUNDO FACTOR DE AUTENTICACION
    /**
     *      2fa = {
     *          status: "SEND" / "RECIBED"
     *          code:
     *          url_token: 
     *          mode_notify: "sms"/"email"
     *      }
     */
    // COMPROBAMOS SI ESTAMOS EN EL PASO EN EL QUE EL CLIENTE SOLICITA ENVIAR EL CODIGO PARA HACER EL LOGIN
    }else if(req.body["fa2"] === 'SEND'){
        // COMPROBAMOS SI ESTA HABILITADO EL "DOBLE FACTOR AUTENTICACION" EN EL LOGIN
        if(systemConfig.HAS_FA2_LOGIN || req.user["fa2"].endpoints.includes(req.urlData.endpoint)){
            
            log(FROM_LOGS, "2fa -> SEND CODE  --->> VALIDAMOS DATOS", INFO_LOGS)
            
            // Enviamos codigo por email e informamos al frontend
            return loginWhithFA2(req, res)

        // NO ACTIVADO 2FA PARA ESTE USUARIO O ESTA RUTA
        }else{
            return loginUser(req, res)
        }

    // ESTAMOS EN EL PASO EN EL QUE EL CLIENTE NOS ENVIA EL CODIGO QUE LE HEMOS ENVIADO PARA HACER AL LOGIN
    }else if(req.body["fa2"] === 'RECIBED'){

        if(systemConfig.HAS_FA2 &&  req.user["fa2"].endpoints.includes(req.urlData.endpoint)){
            
            log(FROM_LOGS, "2fa -> RECIBED  --->> VALIDAMOS DATOS", INFO_LOGS)

            // COMPROBAMOS QUE EL TOKEN ES CORRECTO
            const token_meta = validationTokens[req.body.email]
            
            if(!token_meta){
                // token invalido o Caducado
                log(FROM_LOGS, "ERROR -> TOKEN BORRADO -> CADUCADO ??", INFO_LOGS)
    
                const response_data = {
                    status: 'error',
                    code: errorsCodes.c468.code,
                    message: "TOKEN VERIFICACION INVALIDO",      //errorsCodes.c466.message,
                }
                res.writeHead(200, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify(response_data))
                return;
            }
    
            console.log({token_meta})
            
            if(req.body.token !== token_meta.token){
                // token invalido o Caducado
                log(FROM_LOGS, "ERROR -> Hemos recibido un VAlidation Token NO VALIDO", INFO_LOGS)
    
                const response_data = {
                    status: 'error',
                    code: errorsCodes.c466.code,
                    message: "ERROR EN EL SIGNUP",      //errorsCodes.c466.message,
                    
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response_data))
                return;
            }
            return loginWhithFA2(req, res)
        
        
        }else{
            return loginUser(req, res)
        }
       
    // HAY 2FA PERO NO ES NI "SEND" NI "RECIBED"  ????
    }else{

        const response_data = {
            status: "error",
            code: 400,
            message: "LOGIN INCORRECTO",         
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;

    }
    
}

// VERIFICAMOS EL "STATUS" DEL USUARIO
function verifyUser(req){

    const FROM_LOGS = "loginHandler.js -> isValidUser()"
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR"
    let result = {}
    
    req.user = usersByEmail[req.body.email];

    if(!req.user){
       
        log(FROM_LOGS, "ERROR -> NO USER REGISTRADO CON ESE EMAIL", ERROR_LOGS)
        result.status = "error"
        result.response_data = {
            status: "error",
            code: 400,
            message: "NO EXISTE USUARIO",           //errorsCodes.c480.message,
        }
        return result;
    }

    if(req.user.status !== systemConfig.STATUS.ACTIVE){

        if(req.user.status === systemConfig.STATUS.EMAIL_NOT_VERIFIED){
            log(FROM_LOGS, "ERROR -> Email NO VERIFICADO", ERROR_LOGS)
            result.status = "error"
            result.response_data = {
                status: "error",
                code: 400,
                message: "USUARIO NO ACTIVO",           //errorsCodes.c480.message,
            }
            return result;
        }

        if(req.user.status === systemConfig.STATUS.BLOCKED){
            log(FROM_LOGS, "ERROR -> Usuario BLOQUEADO POR ALGUN MOTIVO", ERROR_LOGS)
            result.status = "error"
            result.response_data = {
                status: "error",
                code: 400,
                message: "USUARIO BLOQUEADO",           //errorsCodes.c480.message,
            }
            return result;
        }
    }
    result.status = "ok"
    return result
}

function isValidPassword(req, res){
    const FROM_LOGS = "loginHandler.js -> isValidPassword()"
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR"

    let result = {}

    // ENCRIPTAMOS PASSWORD RECIBIDO PARA COMPARAR
    const encriptedPassword = passwordEncript(req.body.password.toString())
    
    if(!encriptedPassword){
       log(FROM_LOGS, "ERROR -> al encriptar el Password", ERROR_LOGS);
        return false;
       
   }

    if(req.user.password !== encriptedPassword){
        log(FROM_LOGS, "ERROR -> Password Incorrecto", ERROR_LOGS)
        // limpiamos el formulario del login
        return false;
    }
    return true;

}

async function loginWhithFA2(req, res) {
    const FROM_LOGS = "signUpHandler.js -> signupWhith2FA";
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR";

    // fa2 es "SEND" O "RECIBED"
    // SE NOS PIDE QUE ENVIEMOS EL TOKEN
    if(req.body.fa2 === "SEND"){

        // GENERAMOS CODIGO DE VALIDACIION QUE ENVIAREMOS POR EMAIL
        // const validation_token = generateValidationToken(req.body);
    
        // ENVIAR EMAIL --> 
        
        let data_email = {
            task: "SEND_VALIDATION_TOKEN",
            from: "LOGIN",
            await: true, 
        }
    
        const result_email = await sendEmail(data_email, req.body);
    
        if(result_email.status != 'ok'){
            console.log('Error en el Envio del Email de verificacion')
            const response_data = {
                status: 'error',
                code: errorsCodes.c535.code,
                message: "ERROR EN EL LOGIN",      //errorsCodes.c535.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return;
        }
        // NOTIFICAMOS QUE SE HA ENVIADO UN EMAIL CON EL CODIGO
        const response_data = {
            status: 'ok',
            fa2_required: true,     // MARCAMOS PARA ABRIR FORM PARA INTRODUCIR EL CODIGO DE VALIDACION
            code: errorsCodes.c200.code,
            message: 'Te hemos enviado un codigo de verificacion a tu email',
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    
    }else if(req.body.fa2 === "RECIBED"){

        if(!req.body.email || !req.body.token){
           
            const response_data = {
                status: 'error',
                code: errorsCodes.c466.code,
                message: "ERROR EN EL LOGIN",      //errorsCodes.c466.message,
                
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return; 
        }
        
        // COMPROBAMOS SI EL TOKEN RECIBIDO ES CORRECTO
        const token_meta = validationTokens[req.body.email]
        
        if(req.body.token !== token_meta.token){
            // token invalido
            log(FROM_LOGS, "ERROR -> Hemos recibido un VAlidation Token NO VALIDO", INFO_LOGS)

            const response_data = {
                status: 'error',
                code: errorsCodes.c466.code,
                message: "ERROR EN EL LOGIN",      //errorsCodes.c466.message,
                
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return;

        }
        if(token_meta.expireTime < Date.now()){
            // token expirado
            log(FROM_LOGS, "ERROR -> Codigo de Validación Expirado", INFO_LOGS)

            const response_data = {
                status: 'error',
                code: errorsCodes.c465.code,
                message: "ERROR EN EL LOGIN",          //errorsCodes.c465.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data));


            return;
        }
    
        // FINALIZAMOS EL LOGIN : SESSION, COOKIE, ...
        loginUser(req, res)
    
    }else{

        // F 2NO ES "SEND" NI "RECIBED" ???
        log(FROM_LOGS, "ERROR -> VALOR DE 2FA INCORRECTO", INFO_LOGS)

        const response_data = {
            status: 'error',
            code: errorsCodes.c540.code,
            message: "ERROR EN EL LOGIN",          //errorsCodes.c540.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data));
        return;

    }
    
}

// COMPLETAMOS EL LOGIN DEL USUARIO
async function loginUser(req, res){
    const FROM_LOGS = "loginHandler.js -> loginUser()"
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR"
    
    const from = 'LOGIN'

    req.body.userAgent = req.headers['user-agent']
    req.body.name = req.user.name;
    // INICIALIZAMOS 
    req.has_our_cookie = false;
    req.set_new_cookie = false;
    
    // COMPROBAMOS SI HAY  COOKIE Y LOS TOKENS
    if(req.headers.cookie){
        // COMPROBAMO SI ES NUESTRA

        const result_getOuCookie = getOurCookie(req)

        if(result_getOuCookie.status !== 'ok'){

            if(result_getOuCookie.task === "SEND_FETCH_ERROR"){

                // EN ESTE CASO COOKIE INCOMPLETA 
                // ELIMINAMOS SESSION SI LA HAY 
                // PARA CREAR UNA NUEVA CON NUEVA COOKIE
                // Y SETEAMOS UNA NUEVA COOKIE EN EL LOGIN

                if(sessionsCached[req.user.email]){

                    sessionsCached[req.user.email].status = systemConfig.STATUS.ENDED

                    let data = {
                        task: 'SESSION_ENDED',
                        email: req.user.email,
                        new_value: sessionsCached[req.user.email],
                        await: true
                    }
                    const result_update = await sessionHandler.updateSession(data)

                }
            }
        }

    }


    // comprobamos si hay session abierta del usuario
    let session = sessionsCached[req.user.email];
    const now = Date.now();

    if(!session){

        log(FROM_LOGS, "No hay SESSION", INFO_LOGS)
        // CREAMOS UNA NUEVA SESSION Y NUEVA COOKIE
        let result_session = await sessionHandler.addSession(req, from)

        if(result_session.status !== 'ok'){
            console.log('Error Creando la SESSION')
            const response_data = {
                status: systemConfig.STATUS.ERROR_FETCH,
                code: errorsCodes.c551.code,
                message: 'ERROR EN EL LOGIN',
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(JSON.stringify(response_data))
            
            return;
        }
        log(FROM_LOGS, "USUARIO LOGUEADO CON EXITO", INFO_LOGS)

        let location = systemConfig.PAGES.URL_AFTER_LOGIN

        // SI LA HAY, AÑADIMOS LA RUTA DESDE LA QUE SE LE ENVIO AL LOGUEARSE
        if(req.body.previous_endpoint){
            location = req.body.previous_endpoint
        }

        // if(req.urlData.searchParams?.from){
        //     location = `${req.urlData.searchParams.from}`
            
        //     if(req.urlData.searchParams.search && req.urlData.searchParams.search !== "undefined"){
        //         location += `?${req.urlData.searchParams.search}`
        //     }
            
        // }

        const response_data = {
            "status": systemConfig.STATUS.SUCCESS_FETCH,
            // "location": req.user.automates.length > 0 ? systemConfig.PAGES.URL_AFTER_LOGIN : systemConfig.PAGES.URL_AFTER_SIGNUP , 
            location: location,  
            "username": req.user.name,
            "message": "USUARIO LOGUEADO  CON EXITO"
        }
        

        //AÑADIMOS LA COOKIE COMO UN OBJETO JSON PARA COLOCAR VARIAS VARIABLES;
        // PARA CONSULTA LEGAL
        res.writeHead(200, 
            {   'Content-Type': 'application/json', 
                // location,
                'Set-Cookie': req.cookie,
                'Cache-Control': 'no-cache',
            });
        res.end(JSON.stringify(response_data));
        return;   

    
    // HAY SESION
    }else{

        log(FROM_LOGS, "Hay session", INFO_LOGS)

        // COMPROBAMOS SI LA SESION ESTA  "ENDED" O "EXPIRADA": ALMACENAMOS LA ULTIMA SESSION ANTES DE CREAR LA NUEVA
        if(session.status === systemConfig.STATUS.ENDED ||  now > session.expireTime){
            
            // ALMACENAMOS LA ANTIGUA SESSION EN DB Y CREAMOS UNA NUEVA
            session.status = systemConfig.STATUS.ENDED

            let data = {
                task: 'SESSION_ENDED',
                email: req.user.email,
                new_value: session,
                await: false
            }
            sessionHandler.updateSession(data)
            
            let result_session = await sessionHandler.addSession(req, from)

            if(result_session.status != 'ok'){
                
                log(FROM_LOGS, "Error Creando la SESSION", ERROR_LOGS)

                const response_data = {
                    status: systemConfig.STATUS.ERROR_FETCH,
                    code: errorsCodes.c551.code,
                    message: 'ERROR EN EL LOGIN',
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(JSON.stringify(response_data))
                
                return;
            }
            log(FROM_LOGS, "USUARIO LOGUEADO CON EXITO", ERROR_LOGS)

            // SI LA HAY, AÑADIMOS LA RUTA DESDE LA QUE SE LE ENVIO AL LOGUEARSE
            let location = systemConfig.PAGES.URL_AFTER_LOGIN
            if(req.urlData.searchParams?.from){
                location = `${req.urlData.searchParams.from}`
                if(req.urlData.searchParams.search && req.urlData.searchParams.search !== "undefined"){
                    location += `?${req.urlData.searchParams.search}`
                }
            }

            const response_data = {
                "status": systemConfig.STATUS.SUCCESS_FETCH,
                // "location": req.user.automates.length > 0 ? systemConfig.PAGES.URL_AFTER_LOGIN : systemConfig.PAGES.URL_AFTER_SIGNUP , 
                location: location,  
                "username": req.user.name,
                "message": "USUARIO LOGUEADO  CON EXITO"
            }
            //AÑADIMOS LA COOKIE COMO UN OBJETO JSON PARA COLOCAR VARIAS VARIABLES;
            res.writeHead(200, 
                {   'Content-Type': 'application/json', 
                    // "Location": req.user.automates.length > 0 ? systemConfig.PAGES.URL_AFTER_LOGIN : systemConfig.PAGES.URL_AFTER_SIGNUP ,   
                    'Set-Cookie': req.cookie,
                    'Cache-Control': 'no-cache',
                });
            
            res.end(JSON.stringify(response_data));
            return;   

        
        // HAY SESSION Y NO CADUCADA: COMPROBAMOS EL DEVICE ID
        } else if(req.has_our_cookie){

            // COMPROBAMOS SI ES EL MISMO DISPOSITIVO

            let match = req.user.userDevices.some((el)=>{
                return  (el.userAgent === req.body.userAgent && el.deviceId === req.body.deviceId)
            })
            if(!match){
                addNewUserDevice(req)
            }

            // COMPROBAMOS expireTime de los Tokens Y LA COOKIE
            verifyTokensAndSetCookie(req, req.user, "LOGIN")

        // NO HAY NUESTRA COOKIE   
        }else{
            
            // COMPROBAMOS SI ES EL MISMO DISPOSITIVO
            // y CAPTURAMOS EL DEVICE ID
            log(FROM_LOGS, req.user, INFO_LOGS)

            let match = req.user.userDevices.some((el)=>{
                if(req.body.userAgent === el.userAgent){
                    req.body.deviceId = el.deviceId
                }
                return  (el.userAgent === req.body.userAgent)
            })
            if(!match){
                
                addNewUserDevice(req)
            }

            // HAY QUE CREAR TOKENS NUEVOS
            req.our_cookie = null;
            req.set_new_cookie = true;
            verifyTokensAndSetCookie(req, req.user, "LOGIN")
        }

        // AÑADIMOS LA RUTA DESDE LA QUE SE LE ENVIO AL LOGUEARSE, SI LA HAY.
        let location = systemConfig.PAGES.URL_AFTER_LOGIN
        if(req.body.previous_endpoint){
            location = req.body.previous_endpoint
        }

        // if(req.urlData.searchParams?.from){
        //     location = `${req.urlData.searchParams.from}`
        //     if(req.urlData.searchParams.search && req.urlData.searchParams.search !== "undefined"){
        //         location += `?${req.urlData.searchParams.search}`
        //     }

        // }

        if(req.set_new_cookie){

            res.writeHead(200, 
            {   'Content-Type': 'application/json', 
                'Set-Cookie': req.cookie,
                'Cache-Control': 'no-cache',
            });
                

        }else{
            res.writeHead(200, 
                {   'Content-Type': 'application/json', 
                    'Cache-Control': 'no-cache',
                });
        }

        const response_data = {
            "status": systemConfig.STATUS.SUCCESS_FETCH,
            location: location,
            "username": req.body.name,
            "message": "USUARIO LOGUEADO"
        }

        res.end(JSON.stringify(response_data));
        return; 

    }
    
}


