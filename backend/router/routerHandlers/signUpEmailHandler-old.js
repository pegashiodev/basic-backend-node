

/**
 *  SIGNUP DEL USUARIO CON SU EMAIL Y PASSWORD
 * 
 *  
 */


import bodyDataFormatVerify from "../routerTools/bodyDataFormatVerify.js";
import sendEmail from "../../notifications/sendEmail.js";
// import { passwordEncript} from "../routerTools/passwordEncript.js";

import { hashPassword } from '../routerTools/passwordEncript.js';
import userHandler from "../../users/userHandler.js";
import sessionHandler from "../../sessions/sessionHandler.js";
import systemConfig from "../../globalData/systemConfig.js";
import {randomUUID} from 'crypto';
// import generateVerificationEndpoint from "../../tools/generateVerificationEndpoint.js";

import validationTokens from "../../globalData/validationTokens.js";
import errorsCodes from "../../tools/errorsCodes.js";
import log from "../../tools/log.js";
import promotionsHandler from "../../promotions/promotionsHandler.js";
import { checkValidationToken } from "../../notifications/notificationsTools/generateValidationToken.js";


// Función auxiliar para responder errores POST en JSON
const sendError = (res, statusCode, message, customCode = null) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        status: 'error',
        code: customCode || statusCode,
        message: message
    }));
};

/**
 * 
 * @param {object} Objeto Request de NodeJS
 * @param {object} Objeto Response de NodeJS
 * 
 */
export default async function(req, res){
    
    const from = "SIGNUP"

    const FROM_LOGS = "signUpHandler.js";
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR";
    
    log(FROM_LOGS, "** SIGNUP !!", INFO_LOGS)
    
    // console.log(req.data)

    // Validamos los formatos de los datos recibidos
    let result = bodyDataFormatVerify(req.body)

    if(result.status !== 'ok'){
        log(FROM_LOGS, "Error verificando Datos del Signin", INFO_LOGS)

        const response_data = {
            status: 'error',
            code: errorsCodes.c532.code,
            message: "ERROR EN EL SIGNUP",      // errorsCodes.c532.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }

    // VERIFICAMOS SI EMAIL YA REGISTRADO
    // if(usersByEmail[req.body.email]){
    //     log(FROM_LOGS, "Error -> EMAIL-YA-REGISTRADO", INFO_LOGS)

    //     const response_data = {
    //         status: 'error',
    //         code: errorsCodes.c470.code,
    //         message:  "ERROR EN EL SIGNUP",          //errorsCodes.c470.message,
    //     }
    //     res.writeHead(200, { 'Content-Type': 'application/json' });
    //     res.end(JSON.stringify(response_data))
    //     return;
    // }

    // VERIFICAMOS SI NECESITAMOS PAIS DE ORIGEN
    // if(systemConfig.GET_SIGNUP_COUNTRY && req.data.ip){

    //     const get_country = await fetch(ip.guide.io/`${req.data.ip}`)
    //     const country_data = await json(get_country)

    // }


    
    
    
    // ENCRIPTAR PASSWORD
    const passwordHash = await hashPassword(req.body.password);
    // Guardas passwordHash en MongoDB en el campo user.password
    
    if(!passwordHash){
        log(FROM_LOGS, "Error hasheando pasword", ERROR_LOGS)

        const response_data = {
            status: 'error',
            code: errorsCodes.c531.code,
            message: 'ERROR EN EL SIGNUP',
        }
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify(response_data))
        return;
    }
    // Machacamos con el password encriptado
    req.body.password = passwordHash;

    // SI TENEMOS FA2 ACTIVADO Y ESTA EN EL SIGNUP 
    return signupWithFA2(req, res)
    
    
}

/**
 *  
 * 
 * 
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function signupWithFA2(req, res) {
    const FROM_LOGS = "signUpHandler.js -> signupWhith2FA";
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR";

    if(!req.body.fa2 || !req.body.email){
        const response_data = {
            status: 'error',
            code: errorsCodes.c540.code,
            message: "ERROR EN EL SIGNUP",          //errorsCodes.c540.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data));
        return;

    }

    // fa2 es "SEND" O "RECIBED"
    // SE NOS PIDE QUE ENVIEMOS EL TOKEN
    if(req.body.fa2 === "SEND"){

        // ENVIAMOS CODIGO DE VALIDACIION 
        let data_email = { 
            task: "SEND_VALIDATION_TOKEN",
            from: "SIGNUP",
            await: true,
        }   
    
        const result_send_email = await sendEmail(data_email, req.body);
    
        if(result_send_email.status != 'ok'){
            console.log('Error en el Envio del CODIGO DE VERIFICACION POR Email')
            const response_data = {
                status: 'error',
                code: errorsCodes.c535.code,
                message: "ERROR EN EL SIGNUP",      //errorsCodes.c535.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return;
        }

        // NOTIFICAMOS AL FRONTEND QUE SE HA ENVIADO UN EMAIL CON EL CODIGO
        const response_data = {
            status: 'ok',
            fa2_required: true,     // MARCAMOS PARA ABRIR FORM PARA INTRODUCIR EL CODIGO DE VALIDACION
            code: errorsCodes.c200.code,
            message: 'Te hemos enviado un codigo de verificacion a tu email',
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    
    // NOS ENVIAN EL CODIGO DE VERIFICACION
    }else if(req.body.fa2 === "RECIBED"){


        const normalizedEmail = req.body.email.toLowerCase().trim();

        // 2. Verificar el código de validación almacenado en Redis
        const isValidCode = await checkValidationToken(normalizedEmail, req.body.token);
        console.log({isValidCode})
        console.log(req.body)
        if (!isValidCode) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 401,
                message: 'El código de verificación es incorrecto o ha expirado.'
            }));
        }
       
    
    
    // FA2 NO ES "SEND" NI "RECIBED" ???
    }else{
        log(FROM_LOGS, "ERROR -> VALOR DE FA2 INCORRECTO", INFO_LOGS)

        const response_data = {
            status: 'error',
            code: errorsCodes.c540.code,
            message: "ERROR EN EL SIGNUP",          //errorsCodes.c540.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data));
        return;

    }

    /**
     *      COMPROBAMOS SI HAY PROMO_CODE EN LA DATA DE LA PETICION DE SIGNUP
     * 
     */
    if(systemConfig.HAS_PROMO_CODES && req.body.promo_code && req.body.promo_code.trim().length > 0){
        
        const result_promo_code = promotionsHandler.applyPromoCode(req)
       
        if(result_promo_code.status !== "ok"){

            const response_data = {
                status: result_promo_code.status,
                code: result_promo_code.code,
                message: result_promo_code.message,          //errorsCodes.c540.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data));
            return;
        }

    }

    // FINALIZAMOS EL SIGNUP

    // DATOS PARA ALMACENAR EL DISPOSITIVO DESDE EL QUE SE CONECTA en el signin
    req.body.deviceId = randomUUID();   // Primer device ID
    req.body.userDevice = {
        userAgent: req.urlData.userAgent,
        deviceId: req.body.deviceId
    }

    //AÑADIR USUARIO A DB
    const result_user = await userHandler.addUser(req.body)

    if(result_user.status !== 'ok'){
        log(FROM_LOGS, "ERROR -> VALOR DE 2FA INCORRECTO", SAVE_LOGS)

        const response_data = {
            status: 'error',
            code: errorsCodes.c550.code,
            message: 'ERROR EN EL SIGNUP',
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(response_data))
    }
    req.user = result_user.user

    // CREAMOS SESSION DE USUARIO
    const result_session = await sessionHandler.addSession(req, "SIGNUP");

    if(result_session.status !== 'ok'){
        log(FROM_LOGS, "Error Creando la SESSION", SAVE_LOGS)

        const response_data = {
            status: 'error',
            code: errorsCodes.c551.code,
            message: 'ERROR EN EL SIGNUP',
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        
        return;
    }

    
    log(FROM_LOGS, "USUARIO REGISTRADO CON EXITO", INFO_LOGS)
    
    // SI LA HAY, AÑADIMOS LA RUTA DESDE LA QUE SE LE ENVIO AL REGISTRARSE
    let location = "/" + req.urlData.language + systemConfig.PAGES.URL_AFTER_SIGNUP
    if(req.body.previous_endpoint){
        location = req.body.previous_endpoint
    }

    console.log(`Location desde el signup: ${location}`)

    const response_data = {
        "status": "ok",
        // "location": systemConfig.PAGES.URL_AFTER_SIGNUP,
        location: location,
        "message": "USUARIO REGISTRADO",
    }
    console.log({response_data})
    console.log(req.cookie)
    
    res.writeHead(200, 
        {   'Content-Type': 'application/json', 
            'Set-Cookie': req.cookie,
            'Cache-Control': 'no-cache',
        });
        
    res.end(JSON.stringify(response_data));
    return;   
    
}




