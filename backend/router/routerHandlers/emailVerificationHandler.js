
/**
 *  VERIFICA EL EMAIL ENVIADO EN EL SIGNUP
 * 
 * 
 * 
 */



import sendStaticFile from "../../server/serverHandlers/sendStaticFile.js";
import usersByEmail from '../../globalData/usersByEmail.js'
import sendEmail from '../../notifications/sendEmail.js';
import userHandler from '../../users/userHandler.js';
import systemConfig from '../../globalData/systemConfig.js';
import sessionHandler from "../../sessions/sessionHandler.js";
import sessionsCached from "../../globalData/sessionsCached.js";
import generateVerificationEndpoint from "../../notifications/notificationsTools/generateVerificationEndpoint.js";
import log from "../../tools/log.js"
import dbCrudHandler from "../../db/dbCrudHandler.js";
import verificationEndpoints from "../../globalData/verificationEndpoints.js";


export default async function (req, res){

    const from = "EMAIL_VERIFICATION_HANDLER"
    const saveLog = 'SAVE';
    const infoLog = 'INFO';

    log('En URL Verificatiosn!!!',from, infoLog)

    if(req.data.endpoint !== 'email-verification.html' && req.data.endpoint !== 'email-verification' ){
        
        log("ENDOINT PARA EMAIL-VERIFICATION INCORRECTO", from, infoLog)
        // enviamos 404
        
        res.code = 500
        res.headers = {}
        return sendStaticFile(req, res)
    }
    console.log(req.data.searchParams)

    //  CAMBIAR CUANDO ENVIEMOS EL URL_TOKEN
    //
    // if(!req.data.searchParams || !req.data.searchParams.tk){

    if(!req.data.searchParams){
        log("Faltan datos para la verificacion del email", from, infoLog)
        res.code = 500
        res.headers = {}
        return sendStaticFile(req, res)

    }

    //  CAMBIAR CUANDO ENVIEMOS EL URL_TOKEN
    //    
    //const {id:tokenId, email, expireTime} = decodeSessionToken(req.data.searchParams.tk)
    let url_token = req.data.searchParams.tk
    
    if(!url_token){
        console.log("NO HAY URL TOKEN EN EL LINK RECIBIDO !!!")
        res.code = 500
        res.headers = {}
        return sendStaticFile(req, res)
    }
    
    let result_findOne = verificationEndpoints[url_token];

    // El token Ya fue usado
    // Reenviamos a PAGINA DE INFO dese la que puede navegar por la web
    if(result_findOne && result_findOne.used){
        console.log("EL TOKEN YA HA SIDO USADO")
        res.code = 302
        res.headers = {
            location: systemConfig.PAGES.EMAIL_VERIFIED 
        }
        return sendStaticFile(req, res)
    }


    if(!result_findOne){

        // Lo buscamos en la DB

        const params = {
            dbName: systemConfig.DBS.VERIFICATION_ENDPOINTS + `_${new Date().getFullYear()}`, 
            collection: "emails"
        }
        const query = {_id: url_token}
        result_findOne = await dbCrudHandler.findOne(query, params)
    }
    if(!result_findOne){
        console.log("NO HAY URL_TOKEN RECIBIDO EN EL LINK EN LA DB !!!")
        res.code = 500
        res.headers = {}
        return sendStaticFile(req, res)
    }

    console.log(result_findOne)


    const {id=url_token, email} = result_findOne
    
    if(!id || !email){
        console.log("Faltan datos para la verificacion del email")
        // enviamos 404
        res.code = 500
        res.headers = {}
        return sendStaticFile(req, res)

    }

    const now = Date.now();
    let user = usersByEmail[email]
    console.log(user)
    console.log({id, email})
    // SI YA ESTA ACTIVE -> VERIFICADO NO HACEMOS NADA
    if(!user){
        console.log("No hay user con este email")
        // enviamos 404
        res.code = 500
        res.headers = {}
        return sendStaticFile(req, res)
    }

    
    // Si no coincide el numero de identificacion enviado -> Puede haber clicado en un correo mas antiguo que el del ultimo codigo
    if(user.status === systemConfig.STATUS.EMAIL_NOT_VERIFIED && user.id_verify_email !== id){
        console.log("No coincide el numero de verificacion del email ?? ")
        // enviamos 404
        res.code = 200
        res.headers = {}
        
        if(!req.data){
            req.data = {}
        }
        req.data.fileName = systemConfig.PAGES.EXPIRED_ENDPOINT
        req.data.ext = systemConfig.EXTENSION_STATIC_VIEWS
        return sendStaticFile(req, res)
    }
    
    if(user.status === systemConfig.STATUS.EMAIL_NOT_VERIFIED && user.id_verify_expireTime < now){

        log("El email_id ha caducado -> enviamos otro email", from, infoLog)
        // REENVIAMOS OTRO EMAIL CON OTRO CODIGO
        
        // GENERAMOS EL URL_TOKEN 
        const data_gen_endpoint = {
            email: email,
            from: "EMAIL_VERIFICATION",
            await: true,
        }
        const gen_url_token = await generateVerificationEndpoint(data_gen_endpoint)
       
        if(gen_url_token.status !== "ok"){
            console.log("ERROR generando el url_toke")
            res.code = 500
            res.headers = {}
            if(!req.data){
                req.data = {}
            }
            req.data.fileName = systemConfig.PAGES.SEND_EMAIL_ERROR
            req.data.ext = systemConfig.EXTENSION_STATIC_VIEWS
            return sendStaticFile(req, res)
        }


        let data_email = {
            ...gen_url_token,
            task: "SEND_ID_EMAIL_VERIFICATION_AGAIN",
            await: true
        }    

        const result_email = await sendEmail(data_email);
    
        if(result_email.status !== 'ok'){
            console.log('Error en el Envio del Email')
            // Tenemos que enviar a una pagida de ERROR deonde le pedimos que prueba pasados unos minutos
            res.code = 200
            res.headers = {}
            req.data.fileName = systemConfig.PAGES.SEND_EMAIL_ERROR
            req.data.ext = systemConfig.EXTENSION_STATIC_VIEWS
            return sendStaticFile(req, res);   
        }

        // GUARDAMOS NUEVOS IDS PARA LA NUEVA VERIFICACION DEL EMAIL
        if(usersByEmail[user.email]){

            //  CAMBIAR CUANDO ENVIEMOS EL URL_TOKEN
            //
            // usersByEmail[user.email].id_verify_email = gen_url_token.url_token;
            // usersByEmail[user.email].id_verify_expireTime =  gen_url_token.expireTime

            usersByEmail[user.email].id_verify_email = result_email.id_verify_email;
            usersByEmail[user.email].id_verify_expireTime =  result_email.id_verify_expireTime
            
            // FALTA GUARDARLO EN USER -> DB
            // si es en el signin aun o esta almacenado en usersByEmail
        
            const user_data = {
                task: 'UPDATE_EMAIL_ID',
                userId: usersByEmail[user.email].userId,
                user: usersByEmail[user.email],
                
                //  CAMBIAR CUANDO ENVIEMOS EL URL_TOKEN
                //
                // new_value: {id_verify_email: gen_url_token.url_token, id_verify_expireTime: gen_url_token.expireTime},

                new_value: {id_verify_email: result_email.id_verify_email, id_verify_expireTime: result_email.id_verify_expireTime},
                await: false
            }
            // ACTUALIZAMOS LOS DATOS EN DB PERO NO ESPERAMOPS
            userHandler.updateUser(user_data)
           
            if(sessionsCached[user.email]){

                const session_data = {
                    task: 'UPDATE_EMAIL_ID',
                    sessionId: sessionsCached[user.email]._id,
                    user: usersByEmail[user.email],
                    
                    //  CAMBIAR CUANDO ENVIEMOS EL URL_TOKEN
                    //
                    // new_value: {id_verify_email: gen_url_token.url_token, id_verify_expireTime: gen_url_token.expireTime},

                    new_value: {id_verify_email: result_email.id_verify_email, id_verify_expireTime: result_email.id_verify_expireTime},
                    await: false
                }
                // ACTUALIZAMOS LOS DATOS EN DB PERO NO ESPERAMOPS
                sessionHandler.updateSession(session_data);
            }
            
        }


        
        // lE ENVIAMOS A PAGINA DONDE LE DECIMOS QUE CADUCO SU ID Y QUE LE HEMOS ENVIADO UNO NUEVO
        res.code = 200
        res.headers = {}
        if(!req.data){
            req.data = {}
        }
        req.data.fileName = systemConfig.PAGES.SEND_EMAIL_VERIFICATION_AGAIN
        req.data.ext = systemConfig.EXTENSION_STATIC_VIEWS
        return sendStaticFile(req, res);   
    }

console.log("*** ACTUALIZAMOS ESTADO DEL USER")
    // ACTUALIZAMOS EL STATUS EN db DE USERS
    let data_user = {
        task: 'UPDATE_USER_STATUS',
        user: user,
        new_value: 'ACTIVE',
        await: false,           // NO ESPERAR POR RESULTADO
    }
    // ACTUALIZAMOS LOS DATOS EN DB PERO NO ESPERAMOPS
    userHandler.updateUser(data_user)
   
     // ACTUALIZAMOS ESTADO EN LAS SESSIONES DB Y CACHEADAS
    if(sessionsCached[user.email]){
        
        let data_session = {
            task: 'UPDATE_SESSION_STATUS',
            sessionId: sessionsCached[user.email]._id,
            user: user,
            new_value: 'ACTIVE',
            await: false,           // NO ESPERAR POR RESULTADO
        }
        
        sessionHandler.updateSession(data_session)
    }

    verificationEndpoints[url_token].used = true;

    
    console.log('!!!!!! usuario Verificado...')

    delete usersByEmail[email].id_verify_email;
    delete usersByEmail[email].id_verify_expireTime;

    console.log(usersByEmail)

    // ENVIAMOS AL LOGIN PARA QUE SE CREE LA SESSION
    res.code = 302;
    res.headers = {
        'location': systemConfig.PAGES.ACCESS_PLATFORM
    }
    return sendStaticFile(req, res)
    
}
