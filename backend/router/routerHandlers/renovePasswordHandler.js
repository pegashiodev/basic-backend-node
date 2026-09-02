
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
import systemConfig from "../../globalData/systemConfig.js"
import { hashPassword } from "../routerTools/passwordEncript.js"
import passwordValidation from "../routerTools/passwordValidation.js"
import emailValidation from "../routerTools/emailValidation.js"
import { checkValidationEndpoint } from "../../notifications/notificationsTools/generateVerificationEndpoint.js"


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
console.log(req.urlData)
        // COMPROBAMOS LOS DATOS DE LA URL: 
        const url_token = req.urlData.searchParams?.tk
        const email = req.urlData.searchParams?.email

        if(!url_token || !email){
            console.log("NO HAY URL TOKEN EN EL LINK RECIBIDO de RENOVE_PASSWORD !!!")
            res.code = 500
            res.headers = {}
            return sendStaticFile(req, res)
        }
         
        if (!email || !emailValidation(email)) {
            console.log("EL FORMATO DEL EMAIL ES INCORRECTO ??? !!!")
            res.code = 400
            res.headers = {}
            return sendStaticFile(req, res)
        }
       

        const normalizedEmail = email.toLowerCase().trim();
        
        // 2. Verificar el código de validación almacenado en Redis
        const isValidEndpoint = await checkValidationEndpoint(normalizedEmail, url_token, "VERIFY_ENDPOINT");
        console.log({isValidEndpoint})

        if (!isValidEndpoint) {
            // MOSTRAR PAGINA DICIENDO QUE HA ESPIRADO PARA VOLVER A GENERAR EL CODIGO
            res.code = 200;
            req.urlData.filename = systemConfig.PAGES.RENOVE_PASSWORD_EXPIRES
            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
            return sendStaticFile(req, res)
            
        }

        // Enviamos la pagina solicitada
        res.code = 200;
        req.urlData.filename = systemConfig.PAGES.RENOVE_PASSWORD
        req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
        return sendStaticFile(req, res)

    // POR AQUI ENTRA EL ENVIO DEL FORMULARIO CON LA NUEVA PASSWORD
    // desde el endpoint renove-password.html
    }else if(req.method === 'POST'){

        // EN EL BODY LLEGA EL TOKEN  Y LA NUEVA PASSWORD
       
        renovePassword(req, res)
    }
}


// RENOVAMOS CON EL PASSWORD RECIBIDO
async function renovePassword(req, res){
    
    const from = "RENOVE_PASSWORD"
    console.log(req.body)

    let result = bodyDataFormatVerify(req.body)
            
    // COMPROBAMOS LOS DATOS DEL BODY [ EMAIL, NAME, NUEVO-PASSWORD]
    if(!req.body.tk || !req.body.password || !req.body.email){
        res.writeHead(401, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: 'faltan datos en la request'}))
        return;
    }

    if (!emailValidation(req.body.email)) {
        res.writeHead(415, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 415,
            message: 'Dirección de correo electrónico inválida.'
        }));
    }
    const normalizedEmail = req.body.email.toLowerCase().trim();
        
    // 2. Verificar el código de validación almacenado en Redis
    const isValidEndpoint = await checkValidationEndpoint(normalizedEmail, req.body.tk, "DELETE_ENDPOINT");
    console.log({isValidEndpoint})
    
    if (!isValidEndpoint) {
        res.writeHead(410, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 410,
            message: 'El código de verificación es incorrecto o ha expirado.',
            // SI HA EXPIRADO DESDE ESTA PAGINA LO PUEDE VOLVER A SOLICITAR
            location: systemConfig.PAGES.RENOVE_PASSWORD_EXPIRES
        }));
    }

    // VALIDAMOS QUE EL FORMATO DE LA PASSWORD ES CORRECTO
    const isValidPassword = passwordValidation(req.body.password)

    if (!isValidPassword) {
        res.writeHead(415, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 415,
            message: 'El formato del password es incorrecto',
            
        }));
    }
   
    req.user = await userHandler.getUserByEmail(normalizedEmail);

    if(!req.user){
        console.log('No hay User con ese email')
        const response_data = {
            status: 'error',
            message: 'NO HAY USER CON ESE EMAIL',
            code: 401
        }
        res.writeHead(401, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify(response_data))
        return;
    }

    // encriptar password
    //const encriptedPassword = passwordEncript(req.body.password.toString())
    
    const hashedPassword = await hashPassword(req.body.password);
    if(!hashedPassword){
        console.log('Error hasheando pasword')
        const response_data = {
            status: 'error',
            message: 'ERROR HASHEANDO EL  PASSWORD',
            code: 501
        }
        res.writeHead(501, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify(response_data))
        return;
    }

    // actualizamos en USER
    const data_update_user = {
        task: "UPDATE_USER_PASSWORD",
        password: hashedPassword
    }
    const result_updateUserPassword = await userHandler.updateUserData(data_update_user, req.user)
   
    if(result_updateUserPassword.status != 'ok'){
        console.log('Error Actualizando UserDB')
        const response_data = {
            status: 'error',
            message: 'ERROR Actualizando UserDB',
            code: 502
        }
        res.writeHead(502, { 'Content-Type': 'application/json'});
        res.end(JSON.stringify(response_data))
        return;
    }
    
    console.log('PASSWORD ACTUALIZADO')
    // MARCAMOS EL TOKEN COMO USADO

    // RE-ENVIAMOS A "ACCESO-PLATAFORMA" PARA QUE SE LOGUEE CON EL NUEVO PASSWORD
    const response_data = {
        status: 'ok',
        message: 'PASSWORD ACTUALIZADO CON EXITO',
        location: systemConfig.PAGES.ACCESS_PLATFORM,
        code: 225,
    }
    res.writeHead(225, { 'Content-Type': 'application/json'});
    res.end(JSON.stringify(response_data))
    return;


}

