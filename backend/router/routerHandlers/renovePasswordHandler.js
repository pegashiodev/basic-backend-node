
/**
 * 
 *  DESDE AQUI SE REALIZA EL CAMBIO DE PASSWORD SOLICITADO POR EL USUARIO
 * 
 *  -llega desde un  endpoint que le hemos enviado a su email con un token para acceder a sus datos
 * 
 */



import sendStaticFile from "../../server/serverHandlers/sendStaticFile.js"
import bodyDataFormatVerify from "../routerTools/bodyDataFormatVerify.js"
import userHandler from "../../users/userHandler.js"
import usersByEmail from "../../globalData/usersByEmail.js"
import { passwordEncript } from "../routerTools/passwordEncript.js"
import systemConfig from "../../globalData/systemConfig.js"
import sendEmail from "../../notifications/sendEmail.js"
import verificationEndpoints from "../../globalData/verificationEndpoints.js"
import dbCrudHandler from "../../db/dbCrudHandler.js"


/**
 * 
 * 
 * @param {object} req -> Objeto Request de NodeJs
 * @param {object} res -> Objeto Response de NodeJs
 * @returns {*}
 */
export default async function(req, res){

    const from = "RENOVE_PASSWORD"

    console.log(" ** RENOVE-PASSWORD-HANDLER")
    
    // POR AQUI LLEGA DESDE EL LINK QUE LE HEMOS ENVIADO POR CORREO
    if(req.method === 'GET'){

        // COMPROBAMOS LOS DATOS DE LA URL: 
        req.url_token = req.urlData.searchParams?.tk
        if(!req.url_token){
            console.log("NO HAY URL TOKEN EN EL LINK RECIBIDO de RENOVE_PASSWORD !!!")
            res.code = 500
            res.headers = {}
            return sendStaticFile(req, res)
        }
        // COMPROBAMOS EL TOKEN 
        const validToken = await isValidToken(req.url_token, "GET")
        console.log({validToken})

        if(validToken.status === "INVALID"){
            // El res.end() ya se ha ejecutado en la funcion
            console.log("TOKEN INVALIDO!!!")
            
            if(req.method === "GET"){
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
            return;

        }else if(validToken.status === "USED"){
                console.log("EL TOKEN YA HA SIDO USADO ->> EN ESTE CASO ENVIAMOS AL LOGIN")
            if(method === "GET"){
                res.code = 302
                res.headers = {
                    location: systemConfig.PAGES.ACCESS_PLATFORM
                }
                sendStaticFile(req, res)
            
            }else{
                const response_data = {
                    status: 'error',
                    message: 'TOKEN YA USADO -> SOLICITE OTRO',
                    code: 302,
                    location: systemConfig.PAGES.ACCESS_PLATFORM
                }
                res.writeHead(200, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify(response_data))
            }
            return;


        }else if(validToken.status === "EXPIRED"){
            // eL LINK ESTA CADUCADO -->
            console.log("EL TOKEN ESTA CADUCADO Y NO USADO --> ENVIAMOS AL LOGIN DE NUEVO PARA QUE PIDA OTRO LINK" )
            
            if(method === "GET"){
                res.code = 302
                res.headers = {
                    location: systemConfig.PAGES.RENOVE_PASSWORD_EXPIRES
                }
                sendStaticFile(req, res)
            }else{
                const response_data = {
                    status: 'error',
                    message: 'TOKEN CADUCADO -> SOLICITE OTRO',
                    code: 302,
                    location: systemConfig.PAGES.RENOVE_PASSWORD_EXPIRES
                }
                res.writeHead(200, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify(response_data))
            }
            return;

        }else{
            // Enviamos la pagina solicitada
            res.code = 200;
            req.urlData.filename = systemConfig.PAGES.RENOVE_PASSWORD
            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
            return sendStaticFile(req, res)
        }

    // POR AQUI ENTRA EL ENVIO DEL FORMULARIO CON LA NUEVA PASSWORD
    // desde el endpoint renove-password.html
    }else if(req.method === 'POST'){

        // EN EL BODY LLEGA EL TOKEN  Y LA NUEVA PASSWORD
       
        renovePassword(req, res)
    }
}


// VALIDADMOS EL TOKEN RECIBIDO
async function isValidToken(url_token, method) {

    // SI NO HAY TOKEN, NO ES VALIDO
    
    console.log(url_token)

    if(method === "GET"){

    
        // BUSCAMOS EL TOKEN
        let result_findToken = verificationEndpoints[url_token];
        console.log({result_findToken})
    
    
        // NO LO BUSCAMOS EN DB, PORQUE SOLO SE CACHEAN
        // if(!result_findToken){
        //     // Lo buscamos en la DB
        //     console.log("LO BUSCAMOS EN DB !!!!!")
        //     const params = {
        //         dbName: systemConfig.DBS.VERIFICATION_ENDPOINTS + `_${new Date().getFullYear()}`, 
        //         collection: "emails",
        //         await: true
        //     }
        //     const query = {_id: url_token}
        //     result_findToken = await dbCrudHandler.findOne(query, params)
        // }
        // console.log({result_findToken})
    
        if(!result_findToken){
            
            return {status: "INVALID"};
        }
        // console.log(result_findOne)
    
        // EL TOKEN YA FUE USADO
        if(result_findToken && result_findToken.used){
            
            return {status: "USED"}
        
        // NO HA SIDO USADO PERO HA CADUCADO
        }else if(result_findToken && !result_findToken.used && result_findToken.expireTime < Date.now()){
            
            return {status: "EXPIRED"}
        }
           
        return {status: "ok"}
    
    }else if(method === "POST"){

        let result_findToken = verificationEndpoints[url_token];
        
        if(!result_findToken){
            
            return {status: "INVALID"};
    
        // EL TOKEN YA FUE USADO
        }else if(result_findToken && result_findToken.used){
            
            return {status: "USED"}
        
        // NO HA SIDO USADO PERO HA CADUCADO
        }else if(result_findToken && !result_findToken.used && result_findToken.expireTime < Date.now()){
            
            return {status: "EXPIRED"}
        }else{
            return {status: "ok", email: verificationEndpoints[url_token].email }
        }

    }
    
}

// RENOVAMOS CON EL PASSWORD RECIBIDO
async function renovePassword(req, res){
    
    const from = "RENOVE_PASSWORD"

    let result = bodyDataFormatVerify(req.body)
            
    // COMPROBAMOS LOS DATOS DEL BODY [ EMAIL, NAME, NUEVO-PASSWORD]
    if(!req.body.tk || !req.body.password){
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'faltan datos en la request'}))
        return;
    }

    // const {email, tokenId} = JSON.parse(decodeToken(req.body.tk))
    const validToken = await isValidToken(req.body.tk, "POST");

    if(validToken.status !== "ok"){
        const response_data = {
            status: 'error',
            message: 'TOKEN INVALIDO, CADUCADO O YA USADO',
            code: 400
        }
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify(response_data))
        return;
    }

    // obtenemos el email del usuario para acceder a sus datos
    let user = usersByEmail[validToken.email]

    if(!user){
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
        task: "UPDATE_PASSWORD",
        new_value: req.body.password,
        await: true
    }
    const result_user = await userHandler.updateUser(data_update_user, user)
   
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

    // ENVIAMOS EMAIL CONFIRMANDO EL CAMBIO DE PASSWORD
    const data_send_email = {
        task: "SEND_PASSWORD_UPDATE_SUCCESS",
        from: "RENOVE_PASSWORD",
        await: false
    }
    sendEmail(data_send_email, user)

    console.log('PASSWORD ACTUALIZADO')
    // MARCAMOS EL TOKEN COMO USADO
    verificationEndpoints[req.body.tk].used = true;

    // RE-ENVIAMOS A "ACCESO-PLATAFORMA" PARA QUE SE LOGUEE CON EL NUEVO PASSWORD
    const response_data = {
        status: 'ok',
        message: 'PASSWORD ACTUALIZADO CON EXITO',
        location: systemConfig.PAGES.ACCESS_PLATFORM,
        code: 225
    }
    res.writeHead(225, { 'Content-Type': 'application/json'});
    res.end(JSON.stringify(response_data))
    return;


}

