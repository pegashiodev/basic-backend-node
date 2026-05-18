
// ENTRAMOS EN ESTA RUTA DESDE LA URL QUE HEMOS ENVIADO 
// POR UN INICIO DESDE OTRO DISPOSITIVO 
// O CAULQUIER SOSPECHA DE HACKEO DE LA CUENTA



/**
 *  GET METHOD
 *  MOSTRAMOS UNA URL PARA EL CAMBIO DE LA CONTRASEÑA
 *  MARCAMOS EL USER  COMO HACKEADO
 *  CANCELAMOS LA SESSION -> HACKEADA
 *  BORRAMOS EL EMAIL ENVIADO
 *  
 *  POST METHOD
 *  RECIBIMOS LOS DATOS DEL FORMULARIO
 *  CAMBIAMOS LA CONTRASEÑA EN USER
 *  COLOCAMOS EL USER EN "ACTIVE"
 *  REDIRIGIMOS AL LOGIN
 * 
 */

import sendStaticFile from "../../server/serverHandlers/sendStaticFile.js"
import bodyDataFormatVerify from "../routerTools/bodyDataFormatVerify.js"
import userHandler from "../../users/userHandler.js"
import usersByEmail from "../../globalData/usersByEmail.js"
import { passwordEncript } from "../routerTools/passwordEncript.js"
import systemConfig from "../../globalData/systemConfig.js"
import sendEmail from "../../notifications/sendEmail.js"
import dbCrudHandler from "../../db/dbCrudHandler.js"
import verificationEndpoints from "../../globalData/verificationEndpoints.js"
import sessionsCached from "../../globalData/sessionsCached.js"
import sessionHandler from "../../sessions/sessionHandler.js"
import addNewUserDevice from "../../tools/addNewUserDevice.js"



export default async function(req, res){

    const from = "RECOVERY_ACCOUNT"

    console.log(" ** RECOVERY_ACCOUNT_HANDLER")
    // console.log(req.headers)

    // LLEGA AQUI DESDE EL LINK QUE LE HEMOS ENVIADO POR CORREO
    if(req.method === 'GET'){
        // COMPROBAMOS LOS DATOS DE LA URL: 
        req.url_token = req.urlData.searchParams?.tk

        if(!req.url_token){
            console.log("NO HAY URL TOKEN EN EL LINK RECIBIDO de RENOVE_PASSWORD !!!")
            res.code = 500
            res.headers = {}
            return sendStaticFile(req, res)
        }
  
        const validToken = await isValidToken(req.url_token, "GET", req, res)
        console.log({validToken})

        if(!validToken){
            // El res.end() ya se ha ejecutado en la funcion
            return;
       
        }else{
            // Enviamos la pagina solicitada
            res.code = 200;
            req.urlData.filename = systemConfig.PAGES.RECOVERY_ACCOUNT
            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
            return sendStaticFile(req, res)
        }

    // POR AQUI ENTRA EL ENVIO DEL FORM CON LA NUEVA PASSWORD
    }else if(req.method === 'POST'){
        req.url_token = req.body.tk
        return renovePassword(req, res)

        // SI NO HAY SEGUNDO FACTOR DE AUTORIZACION -> Es el password sin mas
        if(!req.body["2fa"]){


        // NO ES NECESARIO -> LE HEMOS ENVIADO EL LINK POR EMAIL CONLO QUE
        // DEBERIA SER EL USUARIO CORRECTO.
        // RECIBIMOS QUE HAY QUE ENVIAR EL SEGUNDO FACTOR DE AUTORIZACION
        // SERIA PARA ENVIARLE UN CODIGO AL TELEFONO, YA QUE EL LIN SE ENVIA AL CORREO
        }else if(req.body["2fa"] === 'SEND'){

            // NOS INDICA QUE HEMOS DE ENVIAR UN CODIGO DE AUTORIZACION DE LA OPERACION
            // generateSmsVerificationCode()
            // data_sms={
            //      country, phone, code
            //    }
            // sendSMS(req, res)

        
        // NO ES NECESARIO -> LE HEMOS ENVIADO EL LINK POR EMAIL CONLO QUE
        // DEBERIA SER EL USUARIO CORRECTO.
        }else if(req.body["2fa"] === 'RECIBED'){

            // RECIBIMOS TODA LA INFO DEL FORM PARA CAMBIAR EL PASSWORD
            // NEW_PASSWORD, URL_TOKEN, CODE_VERIFICACION

            console.log("RENOVE-PASSWORD  -->>  PRIMERO HEMOS DE COMPROBAR EL 2FA")
        }
        

    }

}

async function isValidToken(url_token, method, req, res) {

    // SI NO HAY TOKEN, NO ES VALIDO
    if(!url_token){
        return false;
    }
    let result_findOne = verificationEndpoints[url_token];

    if(!result_findOne){
        // Lo buscamos en la DB
        console.log("LO BUSCAMOS EN DB !!!!!")
        const params = {
            dbName: systemConfig.DBS.VERIFICATION_ENDPOINTS + `_${new Date().getFullYear()}`, 
            collection: "emails",
            await: true
        }
        const query = {_id: url_token}
        result_findOne = await dbCrudHandler.findOne(query, params)
    }
    if(!result_findOne){
        console.log("NO HAY URL_TOKEN RECIBIDO EN EL LINK EN LA DB !!!")
        if(method === "GET"){
            res.code = 500
            res.headers = {}
            sendStaticFile(req, res)
        }else{
            const response_data = {
                status: 'error',
                message: 'NO HAY URL_TOKEN RECIBIDO EN EL LINK EN LA DB',
                code: 500
            }
            res.writeHead(200, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify(response_data))

        }
        return false;
    }
    // console.log(result_findOne)

    // EL TOKEN YA FUE USADO
    if(result_findOne && result_findOne.used){
        console.log("EL TOKEN YA HA SIDO USADO ->> EN ESTE CASO ENVIAMOS AL LOGIN")
        console.log(verificationEndpoints)
        if(method === "GET"){
            res.code = 302
            res.headers = {
                location: systemConfig.PAGES.ACCESS_PLATFORM
            }
            sendStaticFile(req, res)
        
        }else{
            const response_data = {
                status: 'error',
                message: 'REDIRIGIR A LOGIN',
                code: 302,
                location: systemConfig.PAGES.ACCESS_PLATFORM
            }
            res.writeHead(200, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify(response_data))
        }
        return false
    
    // NO HA SIDO USADO PERO HA CADUCADO
    }else if(result_findOne && !result_findOne.used && result_findOne.expireTime < Date.now()){
        // eL LINK ESTA CADUCADO -->
        console.log("EL TOKEN ESTA CADUCADO Y NO USADO --> ENVIAMOS AL LOGIN DE NUEVO PARA QUE PIDA OTRO LINK" )
        if(method === "GET"){
            res.code = 302
            res.headers = {
                location: systemConfig.PAGES.ACCESS_PLATFORM
            }
            sendStaticFile(req, res)
        }else{
            const response_data = {
                status: 'error',
                message: 'REDIRIGIR A LOGIN',
                code: 302,
                location: systemConfig.PAGES.ACCESS_PLATFORM
            }
            res.writeHead(200, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify(response_data))
        }
        
        return false;
    }

   
    // ACTUALIZAMOS CON TODOS LOS DATOS DEL TOKEN
    req.url_token = result_findOne;
    // Retornamos Token Valido
    return true;
    
}

async function renovePassword(req, res){
    
    const from = "RENOVE_PASSWORD_RECOVERY_ACCOUNT"

    let result = bodyDataFormatVerify(req.body)
            
    // COMPROBAMOS LOS DATOS DEL BODY [ EMAIL, NAME, NUEVO-PASSWORD]
    if(!req.body.tk || !req.body.password){
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'faltan datos en la request'}))
        return;
    }

    // const {email, tokenId} = JSON.parse(decodeToken(req.body.tk))
    const validToken = await isValidToken(req.url_token, "POST", req, res);

    if(!validToken){
        // El res.end() ya se ha realizado en la funcion
        return;
    }

    if(!req.url_token.email || !req.url_token.url_token){
        console.log('Datos incompletos en el url_token-- > Falta url_token o email')
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'url_token Incorrecto', code:460}))
        return;
    }
    
    req.user = usersByEmail[req.url_token.email];

    if(!req.user){
        console.log('No hay User con ese email')
        const response_data = {
            status: 'error',
            message: 'NO HAY USER CON ESE EMAIL',
            code: 525
        }
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify(response_data))
        return;
    }

    // encriptar password
    const encriptedPassword = passwordEncript(req.body.password.toString())
    
    if(!encriptedPassword){
        console.log('Error hasheando pasword')
        const response_data = {
            status: 'error',
            message: 'ERROR HASHEANDO EL  PASSWORD',
            code: 531
        }
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify(response_data))
        return;
    }

    // Machacamos con el password encriptado
    req.body.password = encriptedPassword;

    // actualizamos en USER
    const data_update_user = {
        task: "UPDATE_PASSWORD_AND_STATUS",
        user: req.user,
        new_value: req.body.password,
        await: true
    }
    const result_user = await userHandler.updateUser(data_update_user)
   
    if(result_user.status != 'ok'){
        console.log('Error Actualizando UserDB')
        const response_data = {
            status: 'error',
            message: 'ERROR Actualizando UserDB',
            code: 530
        }
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify(response_data))
        return;
    }
   // LA SESSION YA SE COLOCO EN ENDED CUANDO SE PRODUJO EL HACKEO

    const data_send_email = {
        task: "SEND_PASSWORD_UPDATE_SUCCESS",
        email: req.user.email,
        name: req.user.name,
        lastName: req.user.lastName,
        from: "RECOVERY_ACCOUNT",
        await: false
    }
    sendEmail(data_send_email)

    console.log('PASSWORD ACTUALIZADO')
    // MARCAMOS COMO USADO
    verificationEndpoints[req.url_token.url_token].used = true;
    req.body.userAgent = req.data.userAgent;

    let match = req.user.userDevices.some((el)=>{
        if(req.body.userAgent === el.userAgent){
            req.body.deviceId = el.deviceId
        }
        return  (el.userAgent === req.body.userAgent)
    })
    if(!match){
        
        addNewUserDevice(req)
    }

    // creamos una session + nueva cookie para machacar la existente
    // CREAMOS SESSION DE USUARIO
    // No es un refresco de sesion, es una creacion nueva
    const result_session = await sessionHandler.addSession(req, "SIGNUP");

    if(result_session.status !== 'ok'){
        console.log('Error Creando la SESSION')
        const response_data = {
            status: 'error',
            message: 'ERROR EN EL SIGIN creando la session',
            code: 500
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        
        return;
    }
console.log("NUEVO COOOOOOOKIE ----------------------")
    console.log(req.cookie)
    console.log(req.user)

    const response_data = {
        status: 'ok',
        message: 'PASSWORD ACTUALIZADO CON EXITO',
        location: systemConfig.PAGES.MAIN_CAT_ENPOINT,
        cookie: req.cookie,
        code: 225,
    }

    res.writeHead(200, 
        { 'Content-Type': 'application/json',
            "credentials": "include",
            'Set-Cookie': req.cookie,
            'Cache-Control': 'no-cache',
            
        });
    res.end(JSON.stringify(response_data))
    return;
    

}
