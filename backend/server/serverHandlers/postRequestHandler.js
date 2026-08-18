


/***
 * MANEJADOR DE LAS PETICIONES POST DEL SERVIDOR HTTP
 */

import getRequestBody from "../serverTools/getRequestBody.js";
import getUrlData from "../serverTools/getUrlData.js";
import routerPostRequest from "../../router/routerPostRequest.js";
import systemConfig from "../../globalData/systemConfig.js";
import getOurCookie from "../../tools/getOurCookie.js";
import subdomainPostRequestHandler from "./subdomainPostRequestHandler.js";
import usersByEmail from "../../globalData/usersByEmail.js";
import verifyTokensAndSetCookie from "../../tools/verifyTokensAndSetCookie.js";

// Función auxiliar para responder errores POST en JSON
const sendPostError = (res, statusCode, message, customCode = null) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        status: 'error',
        code: customCode || statusCode,
        message: message
    }));
};

export default async function postRequestHandler(req, res) {
    const contentType = req.headers['content-type'] || '';

    if (!contentType) {
        return sendPostError(res, 400, 'Falta la cabecera Content-Type en la petición POST', 450);
    }

    // 1. Extraer y estructurar datos de la URL
    getUrlData(req);

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

    // 3. Capturar y parsear el Body con límite de tamaño
    try {
        const result = await getRequestBody(req, req.urlData.body_type);
        req.body = result.data || {};
    } catch (err) {
        return sendPostError(res, err.code || 400, err.message, err.code);
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
            result_getOurCookie.response_data?.code || 452
        );
    }

    if (req.has_our_cookie) {

        // Verificar y renovar tokens de sesión
        await verifyTokensAndSetCookie(req, "POST_REQUEST");

        req.body.language = req.urlData.language || systemConfig.MAIN_LANGUAGE;
        req.body.ip = req.ip;
        return routerPostRequest(req, res);
    } else {
        return sendPostError(res, 401, 'No hay cookie de sesión válida', 452);
    }
}