

/**
 * EXTRAE Y VERIFICA CRIPTOGRÁFICAMENTE LAS COOKIES DE LA PETICIÓN
 * - Decodifica y comprueba la firma HMAC de ATK, RTK y STK
 * - Setea req.our_cookie, req.has_our_cookie y req.user
 */

import cookieParser from "./cookieParser.js";
import systemConfig from "../globalData/systemConfig.js";
import { decodeToken } from "./tokenGenerator.js";
import usersByEmail from "../globalData/usersByEmail.js";

export default function getOurCookie(req) {
    const result = {};

    // 1. Extraer cookies de las cabeceras HTTP
    req.cookie_parsed = cookieParser(req.headers.cookie || '');
    const deviceId = req.cookie_parsed?.deviceId;

    req.our_cookie = null;
    req.has_our_cookie = false;

    // 2. Si no hay cookies o faltan todas
    if (!req.cookie_parsed || (!req.cookie_parsed.atk && !req.cookie_parsed.rtk && !deviceId)) {
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
                message: "No hay cookie de sesión en la petición"
            };
            result.task = "SEND_FETCH_ERROR";
        }
        return result;
    }

    // 3. Si falta alguna de las requeridas (ATK, RTK o DeviceId)
    if (!req.cookie_parsed.atk || !req.cookie_parsed.rtk || !deviceId) {
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
                code: 453,
                message: "Cookie incompleta o manipulada"
            };
            result.task = "SEND_FETCH_ERROR";
        }
        return result;
    }

    // 4. Decodificar y verificar firmas criptográficas HMAC
    const atk_decoded = decodeToken(req.cookie_parsed.atk);
    const rtk_decoded = decodeToken(req.cookie_parsed.rtk);

    if (!atk_decoded || !rtk_decoded) {
        result.status = "error";
        console.warn('⚠️ Token inválido o firma alterada detectada.');
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
                code: 453,
                message: "Tokens de sesión inválidos"
            };
            result.task = "SEND_FETCH_ERROR";
        }
        return result;
    }

    const our_cookie = { atk_decoded, rtk_decoded, deviceId };

    // Comprobar token especial de panel de control si viene presente
    if (req.cookie_parsed.stk) {
        const stk_decoded = decodeToken(req.cookie_parsed.stk);
        if (stk_decoded) {
            our_cookie.stk_decoded = stk_decoded;
        }
    }

    if (!req.body) req.body = {};
    req.body.deviceId = deviceId;

    // 5. Asignación de datos válidos al objeto req
    req.has_our_cookie = true;
    req.our_cookie = our_cookie;
    req.accessData = req.cookie_parsed.atk;
    req.refreshData = req.cookie_parsed.rtk;
    req.user = usersByEmail[atk_decoded.email];

    result.status = 'ok';
    return result;
}