
/**
 * 
 *  DESDE AQUI SE REALIZA EL CAMBIO DE PASSWORD SOLICITADO POR EL USUARIO
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
    
    // LLEGA AQUI DESDE EL LINK QUE LE HEMOS ENVIADO POR CORREO
    if(req.method === 'GET'){
        req.url_token = req.urlData.searchParams?.tk
        // COMPROBAMOS LOS DATOS DE LA URL: 
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
            req.urlData.filename = systemConfig.PAGES.RENOVE_PASSWORD
            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
            return sendStaticFile(req, res)
        }

    // POR AQUI ENTRA EL ENVIO DEL FORMULARIO CON EL NUEVA PASSWORD
    }else if(req.method === 'POST'){

        req.url_token = req.body.tk;
        return renovePassword(req, res)

    }

}

async function isValidToken(url_token, method, req, res) {

    // SI NO HAY TOKEN, NO ES VALIDO
    if(!url_token){
        return false;
    }
    console.log(url_token)
    console.log(verificationEndpoints)
    let result_findOne = verificationEndpoints[url_token];
    console.log({result_findOne})

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
    console.log({result_findOne})

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
        return false
    
    // NO HA SIDO USADO PERO HA CADUCADO
    }else if(result_findOne && !result_findOne.used && result_findOne.expireTime < Date.now()){
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
        
        return false;
    }

   
    // ACTUALIZAMOS CON TODOS LOS DATOS DEL TOKEN
    req.url_token = result_findOne;
    // Retornamos Token Valido
    return true;
    
}

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
    
    let user = usersByEmail[req.url_token.email];

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

    const data_send_email = {
        task: "SEND_PASSWORD_UPDATE_SUCCESS",
        from: "RENOVE_PASSWORD",
        await: false
    }
    sendEmail(data_send_email, user)

    console.log('PASSWORD ACTUALIZADO')
    // MARCAMOS COMO USADO
    verificationEndpoints[req.url_token.url_token].used = true;

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

