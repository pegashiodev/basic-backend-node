

import { passwordEncript } from "../routerTools/passwordEncript.js"
import sessionsCached from "../../globalData/sessionsCached.js"

import bodyDataFormatVerify from "../routerTools/bodyDataFormatVerify.js"
import usersByEmail from "../../globalData/usersByEmail.js"
import sessionHandler from "../../sessions/sessionHandler.js"

import systemConfig from "../../globalData/systemConfig.js"
import addNewUserDevice from "../../tools/addNewUserDevice.js"
import verifyTokensAndSetCookie from "../../tools/verifyTokensAndSetCookie.js"
import userHacked from "./userHacked.js"
import log from "../../tools/log.js"
import errorsCodes  from "../../tools/errorsCodes.js"
// import generateValidationToken from "../../tools/generateValidationToken.js"
import sendEmail from "../../notifications/sendEmail.js"
import validationTokens from "../../globalData/validationTokens.js"
import getOurCookie from "../../tools/getOurCookie.js"


export default async function(req, res){
   
    const FROM_LOGS = "loginHandler.js"
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR"

    log(FROM_LOGS, "** LOGIN !!", INFO_LOGS)
console.log(req.body)
console.log(usersByEmail)
    // Validamos los formatos de los datos recibidos
    let result = bodyDataFormatVerify(req.body)

    if(result.status !== 'ok'){
        // RES.END YA SE HA HECHO EN LA FUNCION
        return;
    }

    if(!isValidUser(req, res)){
        // RES.END YA SE HA HECHO EN LA FUNCION
        return;
    }
    
    // VERIFICAMOS SI PASSWORD CORRECTO
    if(!isValidPassword(req, res)){
        // RES.END YA SE HA HECHO EN LA FUNCION
        return;
    }

    if(!req.body["fa2"]){
        return loginUser(req, res)

     // SI  O REQUIERE SEGUNDO FACTOR DE AUTENTICACION
    /**
     *      2fa = {
     *          status: "SEND" / "RECIBED"
     *          code:
     *          url_token: 
     *          mode_notify: "sms"/"email"
     * 
     *      }
     * 
     */


    }else if(req.body["fa2"] === 'SEND'){

        let user = usersByEmail[req.body.email]

        if(systemConfig.HAS_2FA_LOGIN || user["fa2"].endpoints.includes(req.urlData.endpoint)){
            
            log(FROM_LOGS, "2fa -> SEND CODE  --->> VALIDAMOS DATOS", INFO_LOGS)
            
            // Enviamos codigo por email e informamos al frontend

            if(!isValidUser(req, res)){
                return;
            }
            // VERIFICAMOS SI PASSWORD CORRECTO
            if(!isValidPassword(req, res)){
                return;
            }
            return loginWhith2FA(req, res)

        // NO ACTIVADO 2FA PARA ESTE USUARIO O ESTA RUTA
        }else{
            return loginUser(req, res)
        }

    }else if(req.body["fa2"] === 'RECIBED'){
        let user = usersByEmail[req.body.email]

        if(systemConfig.HAS_2FA &&  user["fa2"].endpoints.includes(req.urlData.endpoint)){
            log(FROM_LOGS, "2fa -> RECIBED  --->> VALIDAMOS DATOS", INFO_LOGS)

            if(!isValidUser(req, res)){
                return;
            }
            // VERIFICAMOS SI PASSWORD CORRECTO
            if(!isValidPassword(req, res)){
                return;
            }
            // SI TODO OK
            return loginWhith2FA(req, res)
        
        // NO ACTIVADO 2FA PARA ESTE USUARIO O ESTA RUTA
        }else{
            return loginUser(req, res)
        }

       
    // HAY 2FA PERO NO ES NI "SEND" NI "RECIBED"  ????
    }else{

        // HAY SYSTEM.2FA ACTIVADO PERO EL LOGIN NO ESTA EN LAS RUTAS DEL USUARIO CON 2FA
        // LOGIN SIN ENVIAR CODIGO
        return loginUser(req, res)

    }
    
}


function isValidUser(req, res){

    const FROM_LOGS = "loginHandler.js -> isValidUser()"
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR"

    
    req.user = usersByEmail[req.body.email];

    if(!req.user){
        log(FROM_LOGS, "ERROR -> NO USER REGISTRADO CON ESE EMAIL", ERROR_LOGS)
        const response_data = {
            status: systemConfig.STATUS.ERROR_FETCH,
            code: errorsCodes.c435.code,
            message: "ERROR EN EL LOGIN",               //errorsCodes.c525.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return false;
    }

    if(req.user.status !== systemConfig.STATUS.ACTIVE){

        if(req.user.status === systemConfig.STATUS.EMAIL_NOT_VERIFIED){
            log(FROM_LOGS, "ERROR -> Email NO VERIFICADO", ERROR_LOGS)
            const response_data = {
                status: systemConfig.STATUS.EMAIL_NOT_VERIFIED,
                code: errorsCodes.c471.code,
                message: "ERROR EN EL LOGIN",           //errorsCodes.c471.message,
                location: systemConfig.PAGES.EMAIL_VERIFICATION_INFO,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return false;
        }
    
        if(req.user.status === systemConfig.STATUS.HACKED){
            log(FROM_LOGS, "ERROR -> Usuario HACKEADO", ERROR_LOGS)

            // const response_data = {
            //     status: systemConfig.STATUS.HACKED,
            //     message: 'USUARIO HACKEADO ??? -> HEMOS ENVIADPO UN EMAIL PARA CAMBIO DE CONTRASEÑA ',
            //     location: systemConfig.PAGES.ACCESS_PLATFORM
            // }
            // res.writeHead(200, { 'Content-Type': 'application/json' });
            // res.end(JSON.stringify(response_data))
            userHacked(req, res, "LOGIN")
            return false;
        }
        if(req.user.status === systemConfig.STATUS.BLOCKED){
            log(FROM_LOGS, "ERROR -> Usuario BLOQUEADO POR ALGUN MOTIVO", ERROR_LOGS)
            const response_data = {
                status: systemConfig.STATUS.BLOCKED,
                code: errorsCodes.c480.code,
                message: "ERROR EN EL LOGIN",           //errorsCodes.c480.message,
                location: systemConfig.PAGES.ACCESS_PLATFORM

            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return false;
        }
    }
    return true;
}

function isValidPassword(req, res){
    const FROM_LOGS = "loginHandler.js -> isValidPassword()"
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR"
    // encriptar password para comparar
    const encriptedPassword = passwordEncript(req.body.password.toString())
    
    if(!encriptedPassword){
       log(FROM_LOGS, "ERROR -> al encriptar el Password", ERROR_LOGS)
       const response_data = {
           status: systemConfig.STATUS.ERROR_FETCH,
           code: errorsCodes.c531.code,
           message: "ERROR EN EL LOGIN",            //errorsCodes.c531.message,
       }
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(response_data))
       return false;
   }

    if(req.user.password !== encriptedPassword){
        log(FROM_LOGS, "ERROR -> Password Incorrecto", ERROR_LOGS)
        // limpiamos el formulario del login
        const response_data = {
            status: systemConfig.STATUS.ERROR_FETCH,
            code: errorsCodes.c475.code,
            message: "ERROR EN EL LOGIN",           //errorCodes.c475.message,
            
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return false;
    }
    return true;

}

async function loginWhith2FA(req, res) {
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
            // validation_token: validation_token,
            name: req.body.name,
            lastName: req.body.lastName,
            email: req.body.email,
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
        
        // COMPROBAMOS QUE EL TOKEN ES CORRECTO
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

        // 2FA NO ES "SEND" NI "RECIBED" ???
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

async function loginUser(req, res){
    const FROM_LOGS = "loginHandler.js -> loginUser()"
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR"
    
    const from = 'LOGIN'

    req.body.userAgent = req.headers['user-agent']
    req.body.name = req.user.name;

    

    // COMPROBAMOS SI HAY  COOKIE Y LOS TOKENS

   
    req.has_our_cookie = false;
    req.set_new_cookie = false;

    if(req.headers.cookie){
        // COMPROBAMO SI ES NUESTRA

        const result_getOuCookie = getOurCookie(req)

        if(result_getOuCookie.status !== 'ok'){

            if(result_getOuCookie.task === "SEND_FETCH_ERROR"){

                // AQUI EN EL LOGIN NO ENVIAMOS A LA RUTA QUE NOS LLEGA
                // PORQUE ES LA DEL LOGIN !!

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
        /*
            PARA AUTOMATIZABOTS.COM
            res.writeHead(200, 
                {   'Content-Type': 'application/json', 
                    "Location": req.user.automates.length > 0 ? systemConfig.PAGES.URL_AFTER_LOGIN : systemConfig.PAGES.URL_AFTER_SIGNUP ,   
                    'Set-Cookie': req.cookie,
                    'Cache-Control': 'no-cache',
                });

        */

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

    }else{


        log(FROM_LOGS, "Hay session", INFO_LOGS)

        // if(req.user.status === systemConfig.STATUS.HACKED){
        //     log(FROM_LOGS, "ERROR -> Usuario HACKEADO", ERROR_LOGS)

        //     const response_data = {
        //         status: systemConfig.STATUS.HACKED,
        //         code: errorsCodes.c481.code,
        //         message: 'ERROR EN EL LOGIN',
        //     }
        //     res.writeHead(200, { 'Content-Type': 'application/json' });
        //     res.end(JSON.stringify(response_data))
        //     return;
        
        // }else if(req.user.status === systemConfig.STATUS.BLOCKED){
        //     const error_data = {
        //         message: "USUARIO BLOQUEADO...PONGASE EN CONTACTO CON ATENCION AL CLIENT ",
        //         user: req.user,
        //         session: session
        //         }
        //     log(FROM_LOGS, error_data, SAVE_LOGS)

        //     const response_data = {
        //         status: systemConfig.STATUS.BLOCKED,
        //         code: errorsCodes.c480.code,
        //         message: 'ERROR EN EL LOGIN',
        //     }
        //     res.writeHead(200, { 'Content-Type': 'application/json' });
        //     return res.end(JSON.stringify(response_data))
        // } 


        // SI ENDED O CADUCADA, ALMACENAMOS LA ULTIMA SESSION ANTES DE CREAR LA NUEVA
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

        }

       // HAY SESSION Y NO CADUCADA 
       // COMPROBAMOS EL DEVICE ID

        if(req.has_our_cookie){

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
            verifyTokensAndSetCookie(req)
        }

        // SI LA HAY, AÑADIMOS LA RUTA DESDE LA QUE SE LE ENVIO AL LOGUEARSE
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
                // "Location": req.user.automates.length === 0 ? systemConfig.PAGES.URL_AFTER_SIGNUP : systemConfig.PAGES.URL_AFTER_LOGIN, 
                // location: location,  
                'Set-Cookie': req.cookie,
                'Cache-Control': 'no-cache',
            });
                

        }else{
            res.writeHead(200, 
                {   'Content-Type': 'application/json', 
                    // "Location": req.user.automates.length === 0 ? systemConfig.PAGES.URL_AFTER_SIGNUP : systemConfig.PAGES.URL_AFTER_LOGIN,
                    // location: location, 
                    'Cache-Control': 'no-cache',
                });
        }

        const response_data = {
            "status": systemConfig.STATUS.SUCCESS_FETCH,
            // "location": req.user.automates.length === 0 ? systemConfig.PAGES.URL_AFTER_SIGNUP : systemConfig.PAGES.URL_AFTER_LOGIN ,
            location: location,
            "username": req.body.name,
            "message": "USUARIO LOGUEADO"
        }

        res.end(JSON.stringify(response_data));
        return; 

    }
    
}


