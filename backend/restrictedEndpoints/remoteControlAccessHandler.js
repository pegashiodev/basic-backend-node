



import systemConfig from "../globalData/systemConfig.js"
import sendStaticFile from "../server/serverHandlers/sendStaticFile.js"
import sendEmail from "../notifications/sendEmail.js"
import errorsCodes from "../tools/errorsCodes.js"
import validationTokens from "../globalData/validationTokens.js"
import log from "../tools/log.js"
import verifyTokensAndSetCookie from "../tools/verifyTokensAndSetCookie.js"

export default async (req, res)=>{

    console.log("IN remoteControlHandler !!")
    const FROM_LOGS = "remoteControlAccessHandler.js";
    const INFO_LOGS = "INFO";
    const SAVE_LOGS = "SAVE";
    const ERROR_LOGS = "ERROR";


   // RECIBIMOS PETICI9N GET DEL ENDPOINT RESERVADO PARA LA SOLICITUD DE PANEL DE CONTROL
    if(req.method === "GET"){

        if(req.urlData.endpoint === systemConfig.REMOTE_CONTROL_ACCESS_ENDPOINT_GET){
            // el filename ya esta en req.urlData
            res.code = 200
            return sendStaticFile(req, res)

        }else{
            res.code = 404
            return sendStaticFile(req, res)
        }



    // RECIBIMOS LOS CODIGOS DE ACCESO
    // ENVIADOS POR EMAIL 
    // + UNA CLAVE PERSONAL ADICIONAL QUE TIENE EL ADMIN
    //
    // ENVIAREMOS UNA COOKIE EXTENDIDA CON NUEVOS CAMPOS PARA SER ENVIADA EN 
    // CADA NUEVA PETICION DESDE EL PANEL DE CONTROL
    // CON UNA EXPIRACION DE 10 MINUTOS
    
    }else if(req.method === "POST"){
        console.log("POST REMOTE ACCESS !!!")
        console.log(req.urlData)
        
        if(req.urlData.endpoint === systemConfig.REMOTE_CONTROL_ACCESS_ENDPOINT_POST){

            // fa2 es "SEND" O "RECIBED"
            // SE NOS PIDE QUE ENVIEMOS EL TOKEN
            console.log(req.body)

            if(req.body.fa2 === "SEND"){

                // COMPROBAMOS QUE EMAIL ES UNO DE LOS PERMITIDOS
                if(! req.body.email || !systemConfig.EMAILS_TO_SEND_ACCESS_CODES.includes(req.body.email)){
                    console.log('El email NO ES CORRECTO')
                    const response_data = {
                        status: 'error',
                        code: errorsCodes.c472.code,
                        message: "ERROR EN EL ACCESS-PANNEL",      //errorsCodes.c535.message,
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(response_data))
                    return;
                }
        
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
                    from: "ACCESS_REMOTE_PANNEL",
                    await: true,
                }   
            
                const result_email = await sendEmail(data_email, req.body);
            
                if(result_email.status != 'ok'){
                    console.log('Error en el Envio del CODIGO DE VERIFICACION POR Email')
                    const response_data = {
                        status: 'error',
                        code: errorsCodes.c535.code,
                        message: "ERROR EN EL ACCESS-PANNEL",      //errorsCodes.c535.message,
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
                // COMPROBAMOS SI LA CLAVE DE ACCESO ES CORRECTA
                if(!req.body.accessKey || !systemConfig.ACCESS_VALID_KEYS.includes(req.body.accessKey)){
                     // CLAVE DE ACCESO INVALIDA
                     console.log("AccessKey INVALIDA")
                     const response_data = {
                         status: 'error',
                         code: errorsCodes.c473.code,
                         message: "ERROR EN EL ACCESS-PANNEL",      //errorsCodes.c466.message,
                     }
                     res.writeHead(200, { 'Content-Type': 'application/json'});
                     res.end(JSON.stringify(response_data))
                     return;
                }
                
                // COMPROBAMOS QUE EL TOKEN ES CORRECTO
                const token_meta = validationTokens[req.body.email]
                
                if(!token_meta){
                    // token invalido o Caducado
                    log(FROM_LOGS, "ERROR -> TOKEN BORRADO -> CADUCADO ??", INFO_LOGS)
        
                    const response_data = {
                        status: 'error',
                        code: errorsCodes.c468.code,
                        message: "ERROR EN EL ACCESS-PANNEL",      //errorsCodes.c466.message,
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json'});
                    res.end(JSON.stringify(response_data))
                    return;
                
                }else{

                    if(req.body.token !== token_meta.token){
                        // token invalido o Caducado
                        log(FROM_LOGS, "ERROR -> Hemos recibido un VAlidation Token NO VALIDO", INFO_LOGS)
            
                        const response_data = {
                            status: 'error',
                            code: errorsCodes.c466.code,
                            message: "ERROR EN EL ACCESS-PANNEL",      //errorsCodes.c466.message,
                            
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(response_data))
                        return;
            
                    }else if(token_meta.expireTime < Date.now()){
                        // token expirado
                        log(FROM_LOGS, "ERROR -> Codigo de Validación Expirado", INFO_LOGS)
                        
                        // Lo borramos
                        delete validationTokens[req.body.email]
                        const response_data = {
                            status: 'error',
                            code: errorsCodes.c465.code,
                            message: "ERROR EN EL ACCESS-PANNEL",          //errorsCodes.c465.message,
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(response_data));
            
            
                        return;
                    }
                }

                // AÑADIMOS NUEVOS VALORES A LA COOKIE PARA EL ACCESO AL REMOTE PANNEL
                verifyTokensAndSetCookie(req, req.body, "ACCESS_REMOTE_PANNEL")

                const response_data = {
                    status: 'ok',
                    code: 200,
                    message: "ACCESS-PANNEL CORRECT",   
                    location: systemConfig.REMOTE_CONTROL_PANEL_ENDPOINT,

                }
                res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': req.cookie });
                res.end(JSON.stringify(response_data));
                return;

            }else{
                // 2FA NO ES "SEND" NI "RECIBED" ???
                log(FROM_LOGS, "ERROR -> VALOR DE 2FA INCORRECTO", INFO_LOGS)
        
                const response_data = {
                    status: 'error',
                    code: errorsCodes.c540.code,
                    message: "ERROR EN EL ACCESS-PANNEL",          //errorsCodes.c540.message,
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response_data));
                return;
        
            }

            
        }else{

            return res.end("UPPS!! ")
        }


    }else{
        return res.end("UPPS!! ")
    }

}