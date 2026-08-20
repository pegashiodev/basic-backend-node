


/**
 * ENRUTADOR DE ENDPOINTS RESTRINGIDOS GET
 */

import systemConfig from '../globalData/systemConfig.js';
import sendStaticFile from '../server/serverHandlers/sendStaticFile.js';
// import sessionHandler from '../sessions/sessionHandler.js';
import { getSession, createSession, updateSession } from '../sessions/sessionHandler.js';

import userTemplateHandler from '../restrictedEndpoints/userTemplateHandler.js';
import myBotsTemplateHandler from '../restrictedEndpoints/myBotsTemplateHandler.js';
import remoteControlPanelHandler from '../restrictedEndpoints/remoteControlPanelHandler.js';
import remoteControlAccessHandler from '../restrictedEndpoints/remoteControlAccessHandler.js';
import uploadFilesHandler from './routerHandlers/uploadFilesHandler.js';

import getOurCookie from '../tools/getOurCookie.js';
import verifyTokensAndSetCookie from '../tools/verifyTokensAndSetCookie.js';

const REMOTE_CONTROL_ACCESS_ENDPOINT_GET = systemConfig.REMOTE_CONTROL_ACCESS_ENDPOINT_GET;
const REMOTE_CONTROL_PANEL_ENDPOINT = systemConfig.REMOTE_CONTROL_PANEL_ENDPOINT;

const endpoints_handlers = {
    'mis-bots': myBotsTemplateHandler,
    'mis-bots.html': myBotsTemplateHandler,
    'my-bots': myBotsTemplateHandler,
    'my-bots.html': myBotsTemplateHandler,
    'user': userTemplateHandler,
    'user.html': userTemplateHandler,
    "upload-files.html": uploadFilesHandler,
    "upload-files": uploadFilesHandler,
};

endpoints_handlers[REMOTE_CONTROL_ACCESS_ENDPOINT_GET] = remoteControlAccessHandler;
endpoints_handlers[REMOTE_CONTROL_PANEL_ENDPOINT] = remoteControlPanelHandler;

export default async function routerRestrictedEndpoints(req, res) {
    const from = "RESTRICTED_ENDPOINTS";

    if (!endpoints_handlers[req.urlData.url_to_verify]) {
        res.code = 404;
        res.headers = {};
        return sendStaticFile(req, res);
    }

    let location = `${systemConfig.PAGES.SESSION_IS_REQUIRED}?from=${encodeURIComponent(req.urlData.url)}`;

    // 1. Validar presencia de Cookie
    if (!req.headers.cookie) {
        res.code = 302;
        res.headers = { "Location": location };
        req.urlData.restricted_endpoint = false;
        return sendStaticFile(req, res);
    }

    // 2. Extraer y verificar tokens
    const result_getOurCookie = await getOurCookie(req);

console.log("Router RESTRICTED !!!!")
console.log(result_getOurCookie)


    if (result_getOurCookie.status !== 'ok') {
        if (result_getOurCookie.task === "SEND_STATIC_FILE") {
            return sendStaticFile(req, res);
        }
    }

    // EL USER QUEDA REGISTRADO EN GET-OUR-COOKIE
    if (!req.user) {
        res.code = 302;
        res.headers = { "Location": location };
        return sendStaticFile(req, res);
    }

    if (req.user.status !== 'ACTIVE') {
        res.code = 302;
        res.headers = { "Location": systemConfig.PAGES.USER_NOT_ACTIVE };
        return sendStaticFile(req, res);
    }

    if (!req.body) req.body = {};
    req.body.userAgent = req.headers['user-agent'];

    // 3. Consultar sesión activa desde Redis mediante sessionId
    const sessionId = req.our_cookie?.atk_decoded?.sessionId;
    let session = await getSession(sessionId);

    // COMPROBAMOS SI HAY SESION ABIERTA Y NO EXPIRADA
    if (session) {
        const now = Date.now();
        
        // Si la sesión ha expirado o su estado es 'ENDED'
        if (session.status === 'ENDED' || !session.isValid || (session.expireTime && now > session.expireTime)) {
            session.status = 'ENDED';
            session.isValid = false;
            
            await updateSession({
                task: 'SESSION_ENDED',
                sessionId: sessionId,
                email: req.user.email,
                new_value: session,
                await: false
            });

            const result_session = await createSession(req, from);
            if (result_session.status !== 'ok') {
                res.code = 302;
                res.headers = { "Location": systemConfig.PAGES.SYSTEM_ERROR_OCURRED };
                return sendStaticFile(req, res);
            }
        } else if (session.status === 'PAUSED' || session.status === 'BLOCKED' || req.user.status === 'PAUSED' || req.user.status === 'BLOCKED') {
            res.code = 302;
            res.headers = { "Location": systemConfig.PAGES.BLOCKED_ACCOUNT_INFO };
            return sendStaticFile(req, res);
        }

        // Renovar tokens y setear cookie si procede
        await verifyTokensAndSetCookie(req, "ROUTER_RESTRICTED_ENDPOINTS");

        // ACTUAMOS EN FUNCION DEL RESULTADO DE LOS TOKENS
        // SI LA SESSION EXPIRO ENVIAMOS AL LOGIN
        if(req.session_expired){
            res.code = 302;
            res.headers = { "Location": systemConfig.PAGES.ACCESS_PLATFORM };
            return sendStaticFile(req, res);
        
        // ACCESS-TOKEN EXPIRADO: Enviamos a "  " para que se nos envie el REFRESS-TOKEN
         }else if(req.get_rtk){

            // RECUPERAMOS EL ENDPOINT DESDE EL QUE SE ENVIO EL TOKEN CADUCADO
            const redirect = req.urlData.url
            
            const location = `${systemConfig.PAGES.GET_REFRESS_TOKEN}?redirect=${redirect}`

            res.code = 302;
            res.headers = { "Location": location};
            return sendStaticFile(req, res);
            return;
        }


    } else {

console.log("NO HAY SESSION !!!! ")
        // No hay sesión activa en Redis -> Redirigir a Login
        res.code = 302;
        res.headers = { "Location": systemConfig.PAGES.ACCESS_PLATFORM };
        return sendStaticFile(req, res);
    }

    
    if (!endpoints_handlers[req.urlData.endpoint]) {
        res.code = 404;
        return sendStaticFile(req, res);
    }

    // Ejecutar el handler final
    endpoints_handlers[req.urlData.endpoint](req, res);
}