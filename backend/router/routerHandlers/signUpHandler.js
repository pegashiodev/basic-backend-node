

import bodyDataFormatVerify from "../routerTools/bodyDataFormatVerify.js";
import sendEmail from "../../notifications/sendEmail.js";
import { passwordEncript} from "../routerTools/passwordEncript.js";
import userHandler from "../../users/userHandler.js";
import sessionHandler from "../../sessions/sessionHandler.js";
import systemConfig from "../../globalData/systemConfig.js";
import {randomUUID} from 'crypto';
// import generateVerificationEndpoint from "../../tools/generateVerificationEndpoint.js";
import validationTokens from "../../globalData/validationTokens.js";
import errorsCodes from "../../tools/errorsCodes.js";
import log from "../../tools/log.js";
import promotionsHandler from "../../promotions/promotionsHandler.js";


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
    const encriptedPassword = passwordEncript(req.body.password.toString())
    
    if(!encriptedPassword){
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
    req.body.password = encriptedPassword;

    // SI TENEMOS 2FA ACTIVADO Y ESTA EN EL SIGNUP 
    if(systemConfig.HAS_2FA_SIGNUP){
        return signupWhith2FA(req, res)
    }else{
        return signupWithOut2FA(req, res)
    }
    
}

async function signupWhith2FA(req, res) {
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
            // token: validation_token.token,
            // token_expireTime: validation_token.expireTime,
            name: req.body.name,
            lastName: req.body.lastName,
            email: req.body.email,
            task: "SEND_VALIDATION_TOKEN",
            from: "SIGNUP",
            await: true,
        }   
    
        const result_email = await sendEmail(data_email, req.body);
    
        if(result_email.status != 'ok'){
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
        console.log(req.body)
      
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
        if(token_meta.expireTime < Date.now()){
            // token expirado
            log(FROM_LOGS, "ERROR -> Codigo de Validación Expirado", INFO_LOGS)
            
            // Lo borramos
            delete validationTokens[req.body.email]
            const response_data = {
                status: 'error',
                code: errorsCodes.c465.code,
                message: "ERROR EN EL SIGNUP",          //errorsCodes.c465.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data));


            return;
        }
    
    
    }else{
        // 2FA NO ES "SEND" NI "RECIBED" ???
        log(FROM_LOGS, "ERROR -> VALOR DE 2FA INCORRECTO", INFO_LOGS)

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
     *      COMPROBAMOS SI HAY PROMO_CODE
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
        
        // AÑADIMOS EL SALDO AL USER 
        // LO QUE SE TENGA QUE HACER CON LA PROMO SE HACE EN promotionsCodesHandler
        

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

    // BORRAMOS EL TOKEN
    delete validationTokens[req.body.email]
    
    log(FROM_LOGS, "USUARIO REGISTRADO CON EXITO", INFO_LOGS)
    
    // SI LA HAY, AÑADIMOS LA RUTA DESDE LA QUE SE LE ENVIO AL LOGUEARSE
    let location = "/" + req.urlData.language + systemConfig.PAGES.URL_AFTER_SIGNUP
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
        "status": "ok",
        // "location": systemConfig.PAGES.URL_AFTER_SIGNUP,
        location: location,
        "message": "USUARIO REGISTRADO",
    }
    console.log({response_data})
    console.log(req.cookie)
    
    // ENVIAMOS A SU SUBDOMAIN-CORRESPONDIENTE si se requiere
    if(systemConfig.HAS_SUBDOMAINS){

        // if(req.user.type === "PRO"){
        //     response_data.location =  "http://pro.localhost:3000" + systemConfig.PAGES.URL_AFTER_SIGNUP;
    
        // }else if(req.user.type === "MASTER"){
        //     response_data.location =  "http://master.localhost:3000" + systemConfig.PAGES.URL_AFTER_SIGNUP;
    
        // }
    }

    res.writeHead(200, 
        {   'Content-Type': 'application/json', 
            'Set-Cookie': req.cookie,
            'Cache-Control': 'no-cache',
        });
        
    res.end(JSON.stringify(response_data));
    return;   
    
}

// async function signupWithOut2FA(req, res){
//     const FROM_LOGS = "signUpHandler.js -> signupWhithOut2FA";
//     const INFO_LOGS = "INFO";
//     const SAVE_LOGS = "SAVE";
//     const ERROR_LOGS = "ERROR";

//     const data_gen_endopoint = {
//         email: req.body.email,
//         name: req.body.name,
//         lastName: req.body.lastName,
//         from: "SIGNUP",
//         await: true,
//     }
//     const gen_url_token = await generateVerificationEndpoint(data_gen_endopoint);
//     if(gen_url_token.status !== "ok"){
//         log(FROM_LOGS, "ERROr Creando el URL_TOKEN EN EL SIGNUP", SAVE_LOGS)

//         const response_data = {
//             status: 'error',
//             code: errorsCodes.c533.code,
//             message: "ERROR EN EL SIGNUP",          //errorsCodes.c533.message,
//         }
//         res.writeHead(200, { 'Content-Type': 'application/json'});
//         res.end(JSON.stringify(response_data))
//         return;
//     }


//     // ENVIAR EMAIL --> 
//     let data_email = { 
//         ...gen_url_token,
//         task: "SEND_ID_EMAIL_VERIFICATION",
//         from: "SIGNUP",
//         await: true,
//     }   

//     const result_email = await sendEmail(data_email);

//     if(result_email.status != 'ok'){
//         log(FROM_LOGS, "Error en el Envio del Email", ERROR_LOGS)

//         const response_data = {
//             status: 'error',
//             code: errorsCodes.c535.code,
//             message: "ERROR EN EL SIGNUP",          //errorsCodes.c535.message,
//         }
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify(response_data))
//         return;
//     }
    
//     //  ESTE EL EL DEFINITIVO CUANDO ENVIEMOS UTL_TOKEN
//     // 
//     //  req.body.id_verify_email = gen_url_token.url_token;
//     //  req.body.id_verify_expireTime = gen_url_token.expireTime;

//     req.body.id_verify_email = result_email.id_verify_email;
//     req.body.id_verify_expireTime = result_email.id_verify_expireTime;

//     // DATOS PARA ALMACENAR EL DISPOSITIVO DESDE EL QUE SE CONECTA en el signin
//     req.body.deviceId = randomUUID();   // Primer device ID
//     req.body.userDevice = {
//         userAgent: req.urlData.userAgent,
//         deviceId: req.body.deviceId
//     }

//     //AÑADIR USUARIO A DB
//     const result_user = await userHandler.addUser(req.body)

//     if(result_user.status !== 'ok'){
//         log(FROM_LOGS, "Error Creando el Usuario", SAVE_LOGS)

//         const response_data = {
//             status: 'error',
//             code: errorsCodes.c550.code,
//             message: "ERROR EN EL SIGNUP",              //'ERROR EN EL SIGIN',
//         }
//         res.writeHead(200, { 'Content-Type': 'application/json' });
//         return res.end(JSON.stringify(response_data))
//     }
//     req.user = result_user.user

//     // CREAMOS SESSION DE USUARIO
//     // No es un refresco de sesion, es una creacion nueva
//     const result_session = await sessionHandler.addSession(req, "SIGNUP");

//     if(result_session.status !== 'ok'){
//         log(FROM_LOGS, "Error Creando la SESSION", SAVE_LOGS)

//         const response_data = {
//             status: 'error',
//             message: "ERROR EN EL SIGNUP",          //'ERROR EN EL SIGNUP creando la session',
//             code: errorsCodes.c551.code
//         }
//         res.writeHead(200, {'Content-Type': 'application/json'});
//         res.end(JSON.stringify(response_data))
        
//         return;
//     }
    
//     log(FROM_LOGS, "USUARIO REGISTRADO CON EXITO", INFO_LOGS)
    
//     // SI LA HAY, AÑADIMOS LA RUTA DESDE LA QUE SE LE ENVIO AL LOGUEARSE
//     let location = systemConfig.PAGES.URL_AFTER_SIGNUP
//     if(req.urlData.searchParams?.from){
//         location = `${req.urlData.searchParams.from}`
        
//         if(req.urlData.searchParams.search && req.urlData.searchParams.search !== "undefined"){
//             location += `?${req.urlData.searchParams.search}`
//         }

//     }

//     const response_data = {
//         "status": "ok",
//         // "location": systemConfig.PAGES.URL_AFTER_SIGNUP,
//         location: location,
//         "message": "USUARIO REGISTRADO"
//     }

//     res.writeHead(200, 
//         {   'Content-Type': 'application/json', 
//             // "Location": systemConfig.PAGES.URL_AFTER_SIGNUP,   
//             'Set-Cookie': req.cookie,
//             'Cache-Control': 'no-cache',
//         });
        
//     res.end(JSON.stringify(response_data));
//     return;   
// }