

/**
 * 
 *  cada ruta Restringida  tiene si propio manejador
 *      
 *      - mis bots
 *      - user interface
 *      - contabilidad
 *      - 
 *      - ...
 * 
 * 
 * 
 */



import systemConfig from '../globalData/systemConfig.js';
import sessionsCached from '../globalData/sessionsCached.js';
import sendStaticFile from '../server/serverHandlers/sendStaticFile.js';
import sessionHandler from '../sessions/sessionHandler.js';
import usersByEmail from '../globalData/usersByEmail.js';
/**
 * MANEJADORES "GET" DE RESTRICTED-ENDPOINT 
*/
import userTemplateHandler from '../restrictedEndpoints/userTemplateHandler.js'
import myBotsTemplateHandler from '../restrictedEndpoints/myBotsTemplateHandler.js'
import remoteControlPanelHandler from '../restrictedEndpoints/remoteControlPanelHandler.js';
import remoteControlAccessHandler from '../restrictedEndpoints/remoteControlAccessHandler.js';
import uploadFilesHandler from './routerHandlers/uploadFilesHandler.js';
/**
 * VERIFICADORES DE LA COOKIE Y DE LOS TOKENS QUE CONTIENEN
 */
import getOurCookie from '../tools/getOurCookie.js';
import verifyTokensAndSetCookie from '../tools/verifyTokensAndSetCookie.js';



const REMOTE_CONTROL_ACCESS_ENDPOINT_GET = systemConfig.REMOTE_CONTROL_ACCESS_ENDPOINT_GET;
const REMOTE_CONTROL_PANEL_ENDPOINT = systemConfig.REMOTE_CONTROL_PANEL_ENDPOINT

const endpoints_handlers = {

    'mis-bots': myBotsTemplateHandler,
    'mis-bots.html': myBotsTemplateHandler,

    'my-bots': myBotsTemplateHandler,
    'my-bots.html': myBotsTemplateHandler,

    'user': userTemplateHandler,
    'user.html': userTemplateHandler,

    "upload-files.html": uploadFilesHandler,
    "upload-files": uploadFilesHandler,
    
}
endpoints_handlers[REMOTE_CONTROL_ACCESS_ENDPOINT_GET] = remoteControlAccessHandler
endpoints_handlers[REMOTE_CONTROL_PANEL_ENDPOINT] = remoteControlPanelHandler


// Añadimos Manejador del Login o SingIn
//endpoints_handlers[systemConfig.PAGES.ACCESS_PLATFORM] = accessPlatformHandler

export default async function (req, res){
    const from = "RESTRICTED_ENDPOINTS"
    console.log("** routerRestrictedEndpoints.js")

    if(!endpoints_handlers[req.urlData.url_to_verify]){
      
        console.log('INVALID RESTRICTED URL')
        res.code = 404,
        res.headers = {}
        return sendStaticFile(req, res)
    }


// PETICION QUE LLEGA POR GET
// AÑADIMOS DE DONDE VENIA PARA REENVIARLO CUANDO ACCEDA: 
// LA URL Y EL SERACH SI LO HAY
let location = systemConfig.PAGES.SESSION_IS_REQUIRED
location += `?from=${req.urlData.url}`
if(req.urlData.searchParams){
    location += `?&${req.urlData.search}`
}

    // if(req.urlData.searchParams?.from){
    //     location = `${systemConfig.PAGES.SESSION_IS_REQUIRED}?from=${req.urlData.searchParams.from}&search=${req.urlData.searchParams.search}`;
    // }


    // OBTENEMOS NUESTRA COOKIE
    if(!req.headers.cookie ){

        
        
        console.log(" ** enviamos al login !!!")
        // REDIRIGIMOS A LOGIN
        res.code = 302,
        // res.headers = {"Location" : systemConfig.PAGES.SESSION_IS_REQUIRED}
        res.headers = {"Location" : location}

        
        req.urlData.restricted_endpoint = false; 
        return sendStaticFile(req, res)
    }

    const result_getOurCookie = getOurCookie(req);

    if(result_getOurCookie !== 'ok'){
        if(result_getOurCookie.task === "SEND_STATIC_FILE"){
            // EL ARCHIVO Y EL CODIGO YA ESTAN EN req.data
            return sendStaticFile(req, res)
        }
    }

  

    req.user = usersByEmail[req.our_cookie.atk_decoded.email]

    if(!req.user){
        // solicitamos ruta y no hay user?? 
        // enviamos al login
        console.log("RESTRICTED-ENDPOINTS -> NO HAY USER CACHEADO -> ENVIAMOS A LOGIN")
        // REDIRIGIMOS A LOGIN
        
        res.code = 302,
        // res.headers = {"Location" : systemConfig.PAGES.SESSION_IS_REQUIRED}
        res.headers = {"Location" : location}

        return sendStaticFile(req, res)

    }

    if(req.user.status !== 'ACTIVE'){
        // REDIRIGIMOS A  login
        console.log("RESTRICTED-ENDPOINTS -> EL usuario no esta activo")
        res.code = 302,
        res.headers = {"Location" : systemConfig.PAGES.USER_NOT_ACTIVE}
        return sendStaticFile(req, res)
    }

    if(!req.body){
        req.body = {}
    }
    req.body.userAgent = req.headers['user-agent'],
    req.body.deviceId = req.body.deviceId

    // FORMATO DE req.our_cookie = {atk_decoded, rtk_decoded, id}

    let session = sessionsCached[req.our_cookie.atk_decoded.email];

    if(session){

        console.log('*** HAY SESSION ABIERTA');

        const now = Date.now();
     
        // comprobamos si la session ha teminado
        if(session.status === 'ENDED' || now > session.expireTime){

            console.log('!! SESION CADUCADA **** ');
            // ALMACENAMOS LA FINALIZADA
        
            session.status = 'ENDED'
            let session_data = {
                task: 'SESSION_ENDED',
                email: req.user.email,
                new_value: session,
                await: false
            }
            sessionHandler.updateSession(session_data)

            // NUEVA SESSION
            let result_session = await sessionHandler.addSession(req, from)
       
            if(result_session.status !== 'ok'){
                console.log("NO HEMOA PODIDO CREAR LA NUEVA SESSION DEL USUARIO -> FROM: ROUTER-RESTRICTED-ENDPOINTS")
                // REDIRIGIMOS A LOGIN
                res.code = 302,
                res.headers = {"Location" : systemConfig.PAGES.SYSTEM_ERROR_OCURRED}
                return sendStaticFile(req, res)
            }

        }else if(req.user.status === 'PAUSED'){

            console.log('ERROR -> Usuario PAUSADO POR ALGUN MOTIVO')
            res.code = 302,
            res.headers = {"Location" : systemConfig.PAGES.BLOCKED_ACCOUNT_INFO}
            return sendStaticFile(req, res)
        
        }else if(req.user.status === 'BLOCKED'){

            console.log('ERROR -> Usuario BLOQUEADO POR ALGUN MOTIVO')
            res.code = 302,
            res.headers = {"Location" : systemConfig.PAGES.BLOCKED_ACCOUNT_INFO}
            return sendStaticFile(req, res)
        } 

        // hay session -> verificamos expireTime de los tokens
        verifyTokensAndSetCookie(req, req.user, "ROUTER_RESTRICTED_ENDPOINTS")

        
    // NO HAY SESION: TAL VEZ CADUCO Y SE ELIMINO -> REENVIAMOS AL LOGIN
    }else{

        console.log('*** ES UN RESTRICTED-ENDPOINT: NO HAY SESSION ABIERTA -> caduco y  RECOLECTO Y se elimino' );
        
        // CREAMOS UNA NUEVA SESION -> NO ES BUENA IDEA
        // let result_session = await sessionHandler.addSession(req, from)

        // if(result_session.status !== 'ok'){
        //     console.log("NO HEMOA PODIDO CREAR LA NUEVA SESSION DEL USUARIO -> FROM: ROUTER-RESTRICTED-ENDPOINTS")
        //     // REDIRIGIMOS A LOGIN
        //     res.code = 302,
        //     res.headers = {"Location" : systemConfig.PAGES.SYSTEM_ERROR_OCURRED}
        //     return sendStaticFile(req, res)
        // }

        // REDIRIGIMOS A LOGIN
        res.code = 302,
        res.headers = {"Location" : systemConfig.PAGES.ACCESS_PLATFORM}
        return sendStaticFile(req, res)

                
    }

    if(!endpoints_handlers[req.urlData.endpoint]){
        res.code = 404;
        return sendStaticFile(req, res)
    }

    // Manejamos la ruta con los valores de session y cookie
    endpoints_handlers[req.urlData.endpoint](req, res);
}


