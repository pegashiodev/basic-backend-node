


/***
 * MANEJADOR DE LAS PETICIONES POST DEL SERVIDOR HTTP
 */

import getRequestBody from "../serverTools/getRequestBody.js";
import routerPostRequest from "../../router/routerPostRequest.js";
import systemConfig from "../../globalData/systemConfig.js";
import getOurCookie from "../../tools/getOurCookie.js";
import subdomainPostRequestHandler from "./subdomainPostRequestHandler.js";
import verifyTokensAndSetCookie from "../../tools/verifyTokensAndSetCookie.js";
import { getRawAndParsedBody } from "../serverTools/getRawAndParsedBody.js";

// Función auxiliar para responder errores POST en JSON
const sendPostError = (res, statusCode, message, customCode = null, location = null) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        status: 'error',
        code: customCode || statusCode,
        message: message,
        location
    }));
};

export default async function postRequestHandler(req, res) {
    const contentType = req.headers['content-type'] || '';

    let location = systemConfig.PAGES.ACCESS_PLATFORM;
    if(req.urlData.searchParams?.redirect){
        location = `${systemConfig.PAGES.ACCESS_PLATFORM}?redirect=${req.urlData.searchParams.redirect}`
    }

    if (!contentType) {
        return sendPostError(res, 400, 'Falta la cabecera Content-Type en la petición POST', 450);
    }

    // 1. Extraer y estructurar datos de la URL
    //getUrlData(req);

    if (!req.urlData.endpoint) {
        return sendPostError(res, 404, 'No se especificó un endpoint válido en la petición', 450);
    }

    // 2. Determinar el tipo de contenido
    if (contentType.includes('application/json')) {
        req.urlData.body_type = 'JSON';
    } else if (contentType.startsWith('image/')) {
        req.urlData.body_type = 'IMAGE';
    } else if (contentType.startsWith('audio/')) {
        req.urlData.body_type = 'AUDIO';
    } else if (contentType.startsWith('multipart/form-data') || contentType.startsWith('application/octet-stream')) {
        req.urlData.body_type = 'FILE';
    } else {
        return sendPostError(res, 415, 'Tipo de contenido (Content-Type) no soportado', 445);
    }

    // SI L APETICION ES PARA EL WEBHOOK DE STRIPE EL BODY HA DE OBTENERSE DE OTRA MANERA

    if(req.urlData.endpoint === "stripe-webhook" || req.urlData.endpoint === "stripe-webhook.html"){
        try{
            getRawAndParsedBody(req)
        } catch (err) {
            return sendPostError(res, err.code || 400, err.message, err.code);
        }
    
    }else{

        // 3. Capturar y parsear el Body con límite de tamaño
        try {
            const result = await getRequestBody(req, req.urlData.body_type);
            req.body = result.data || {};
        } catch (err) {
            return sendPostError(res, err.code || 400, err.message, err.code);
        }
    }



    // 4. Gestión de Subdominios (si aplica)
    if (systemConfig.HAS_SUBDOMAINS) {
        const hostName = process.env.MODE === "DEV" ? systemConfig.HOST_DEV : systemConfig.HOST_PROD;
        const sub = req.urlData.host.replace(hostName, '').replace(/\.$/, '').replace(/^\./, '');

        if (sub.length > 0) {
            req.urlData.subdomains = sub;
            if (systemConfig.SUBDOMAINS_ALLOWED.includes(sub)) {
                return subdomainPostRequestHandler(req, res);
            } else {
                return sendPostError(res, 403, 'Subdominio no permitido', 486);
            }
        }
    }

    // 5. Endpoints públicos que no requieren autenticación (Login, Signup, Forgot Password, etc.)
    const isPublicWithoutCookie = systemConfig.VALID_POST_ENDPOINTS_WITHOUT_COOKIE?.includes(req.urlData.endpoint);
    const isPublicWithoutSession = systemConfig.VALID_POST_ENDPOINTS_WITHOUT_SESSION?.includes(req.urlData.endpoint);

    if (isPublicWithoutCookie || isPublicWithoutSession) {
        req.body.language = req.urlData.language || systemConfig.MAIN_LANGUAGE;
        req.body.ip = req.ip;
        return routerPostRequest(req, res);
    }

    // 6. Endpoints protegidos: Validación de Cookie y Sesión
    const result_getOurCookie = await getOurCookie(req);
    if (result_getOurCookie.status !== 'ok') {
        return sendPostError(
            res, 
            401, 
            result_getOurCookie.response_data?.message || 'Autenticación requerida',
            result_getOurCookie.response_data?.code || 405,
            location
        );
    }

    if (req.has_our_cookie) {

        // Verificar y renovar tokens de sesión
        await verifyTokensAndSetCookie(req, "POST_REQUEST");
        
        // ACTUAMOS EN FUNCION DEL RESULTADO DE LOS TOKENS
       
        // SI LA SESSION EXPIRO ENVIAMOS AL LOGIN
        if(req.session_expired){
            location = `${systemConfig.PAGES.SESSION_IS_REQUIRED}?redirect=${req.urlData.searchParams.redirect}`
            return sendPostError(
                res, 
                401, 
                'Session Expirada: Autenticación requerida',
                302, 
                location
            );
        
        // ACCESS-TOKEN EXPIRADO: 
        // SOLICITAMOS A ESA PETICION POST QUE SE HA HECHO, QUE SE PAUSE Y QUE SE ENVIE EL 
        // REFRESH-TOKEN ANTES DE CONTINUAR
        }else if(req.get_rtk){
            
            return sendPostError(
                res, 
                444, 
                'SEND-REFRESS-TOKEN',
                444, 
                // LE PEDIMOS QUE ENVIE EL REFRESS-TOKEN EN OTRO FETCH A "REFESH-BRIDGE"
            );
        
        }

        req.body.language = req.urlData.language || systemConfig.MAIN_LANGUAGE;
        req.body.ip = req.ip;
        return routerPostRequest(req, res);
    
    } else {
        // ENVIAMOS A ACCESO-PLATAFORMA
        return sendPostError(res, 405, 'No hay cookie de sesión válida', 302, location);
    }
}