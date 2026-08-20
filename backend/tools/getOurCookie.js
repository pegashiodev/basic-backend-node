
/**
 * EXTRAE Y VERIFICA CRIPTOGRÁFICAMENTE LAS COOKIES DE LA PETICIÓN
 * - Valida firmas HMAC de ATK y RTK
 * - Comprueba concordancia de sessionId entre tokens
 */

import cookieParser from "./cookieParser.js";
import systemConfig from "../globalData/systemConfig.js";
import { decodeToken } from "./tokenGenerator.js";
import userHandler from "../users/userHandler.js";

export default async function getOurCookie(req) {
console.log("GET OUR COOKIE !!!!")
    const result = {};

    // 1. Extraer cookies de las cabeceras HTTP
    req.cookie_parsed = cookieParser(req.headers.cookie || '');

console.log(req.cookie_parsed)

    const deviceId = req.cookie_parsed?.deviceId;
    req.our_cookie = null;
    req.has_our_cookie = false;

    // 2. Si no hay cookies o faltan parámetros
    //if (!req.cookie_parsed || !req.cookie_parsed.atk || !req.cookie_parsed.rtk || !deviceId) {
    if (!req.cookie_parsed || !req.cookie_parsed.atk) {
        result.status = "error";
        if (req.method === "GET") {
            if (!req.urlData) req.urlData = {};
            req.urlData.restricted_endpoint = false;
            req.urlData.fileName = systemConfig.PAGES.SESSION_IS_REQUIRED;
            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS;
            result.task = "SEND_STATIC_FILE";
        } else {
            result.response_data = {
                status: "error",
                location: systemConfig.PAGES.SESSION_IS_REQUIRED,
                code: 452,
                message: "No hay cookie de sesión válida en la petición"
            };
            result.task = "SEND_FETCH_ERROR";
        }
        return result;
    }

    // 3. Decodificar y verificar firmas criptográficas HMAC
    const atk_decoded = decodeToken(req.cookie_parsed.atk);
    let rtk_decoded;
    
    if(req.cookie_parsed.rtk){
        rtk_decoded = decodeToken(req.cookie_parsed.rtk);
    }

    if (!atk_decoded) {

        result.status = "error";
        console.warn('⚠️ Token con firma alterada o inválido detectado.');
        return generateErrorResponse(req, result, 453, "Tokens de sesión inválidos");
    }

    // 4. Vínculo de seguridad: Comprobar que pertenecen al mismo sessionId y usuario
    if (!atk_decoded && !rtk_decoded) {
        if (atk_decoded.sessionId !== rtk_decoded.sessionId || atk_decoded.email !== rtk_decoded.email) {

            result.status = "error";
            console.warn('🚨 Discrepancia detectada entre ATK y RTK (posible manipulación de tokens).');
            return generateErrorResponse(req, result, 453, "Discrepancia en tokens de sesión");
        }
    }

    //const our_cookie = { atk_decoded, rtk_decoded, deviceId, sessionId: atk_decoded.sessionId };
    let our_cookie = { atk_decoded, sessionId: atk_decoded.sessionId };
    
    if(rtk_decoded){
        our_cookie["rtk_decoded"] = rtk_decoded;
    }

console.log({our_cookie})
    // Comprobar token especial de panel de control si viene presente
    if (req.cookie_parsed.stk) {
        const stk_decoded = decodeToken(req.cookie_parsed.stk);
        if (stk_decoded) {
            our_cookie["stk_decoded"] = stk_decoded;
        }
    }

    if (!req.body) req.body = {};
//req.body.deviceId = deviceId;

    // 5. Asignación de datos válidos al objeto req
    req.has_our_cookie = true;
    req.our_cookie = our_cookie;
    req.currentSessionId = atk_decoded.sessionId;
    req.accessData = req.cookie_parsed.atk;
    req.refreshData = req.cookie_parsed.rtk;

    const cleanEmail = atk_decoded.email.trim().toLowerCase();
    const user = await userHandler.getUserByEmail(cleanEmail);
    req.user = user

    result.status = 'ok';
    return result;
}

function generateErrorResponse(req, result, code, message) {
    if (req.method === "GET") {
        if (!req.urlData) req.urlData = {};
        req.urlData.restricted_endpoint = false;
        req.urlData.fileName = systemConfig.PAGES.SESSION_IS_REQUIRED;
        req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS;
        result.task = "SEND_STATIC_FILE";
    } else {
        result.response_data = {
            status: "error",
            location: systemConfig.PAGES.SESSION_IS_REQUIRED,
            code: code,
            message: message
        };
        result.task = "SEND_FETCH_ERROR";
    }
    return result;
}