
/**
 *      OBTIENE NUESTRA COOKIE DE  ENVIADA POR EL NAVEGADOR
 *      - se añade al objeto Request: req.our_cookie
 *      - si la cookie es correcta se añade al objeto Request el objeto user: req.user
 * 
 *      - SI FALTA ALGUNOS DE LOS VALORES, MANDA ENVIAR AL LOGIN
 *      
 * 
 * 
 */


import cookieParser from "./cookieParser.js";
import systemConfig from "../globalData/systemConfig.js";
import { decodeToken } from "./tokenGenerator.js";
import usersByEmail from "../globalData/usersByEmail.js";

/**
 * 
 * @param {Object} req  -> Objeto Request de Node
 */
export default (req)=>{

    console.log("getOurCookie.js !!")
    let result = {}

     // HAY COOKIE
    req.cookie_parsed = cookieParser(req.headers.cookie);
    // console.log(req.cookie_parsed)

    const deviceId = req.cookie_parsed?.deviceId
    
    // INICIALIZAMOS 
    req.our_cookie = null;
    req.has_our_cookie = false;

    // SI FALTA ALGUNO DE LOS TOKENS ENVIAMOS AL LOGIN -> NO LO DECODIFICAMOS
    // if(!req.cookie_parsed || !req.cookie_parsed?.atk || !req.cookie_parsed?.rtk){

    // Faltan los 3 -> BORRADO DEL HISTORIAL ->  Enviamos a login    
    if(!req.cookie_parsed || (!req.cookie_parsed?.atk && !req.cookie_parsed?.rtk && !req.cookie_parsed?.deviceId)){
        console.log('ERROR NO HAY COOKIES NUESTRAS')

        result.status = "error";
        
        if(req.method === "GET"){

            if(!req.urlData){
                req.urlData = {}
            }
            // NO HAY COOKIE -> HAY QUE LOGUEARSE
            req.urlData.restricted_endpoint = false;
            req.urlData.fileName = systemConfig.PAGES.SESSION_IS_REQUIRED
            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
            result.task = "SEND_STATIC_FILE"
            return result;
       
        // ES POST -> TENEMOS QUE RESPONDER AL FETCH
        }else {

            // ENVIAMOS AL LOGIN PARA SETEAR NUEVAS COOKIES
            result.response_data = {
                status: "ok",
                location: systemConfig.PAGES.SESSION_IS_REQUIRED,
                code: 452,
                message: "NO HAY COOKIE EN LA PETICION"
            }
            result.task = "SEND_FETCH_ERROR"
            return result;

        }
    
    // Falta ALGUNO -> SE HA MANIPULADO -> BORRAR Y AL LOGIN
    }else if(!req.cookie_parsed.atk ||  !req.cookie_parsed.rtk || !req.cookie_parsed.deviceId){
        console.log('ERROR FALTA ALGUNA DE LAS COOKIES')

        // RENVIAMOS AL LOGIN / SIGNIN
        result.status = "error";
        
        if(req.method === "GET"){

            if(!req.urlData){
                req.urlData = {}
            }
            req.urlData.restricted_endpoint = false;  // para que NO BUSQUE LA PAGINA EN /restricted-urls-es
            // req.urlData.fileName = systemConfig.PAGES.DELETE_COOKIES_AND_LOGIN
            // req.urlData.fileName = systemConfig.PAGES.ACCESS_PLATFORM
            req.urlData.fileName = systemConfig.PAGES.SESSION_IS_REQUIRED

            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
            result.task = "SEND_STATIC_FILE"
            return result;
       
        // ES POST -> TENEMOS QUE RESPONDER AL FETCH
        }else {

            // ENVIAMOS AL LOGIN PARA SETEAR NUEVAS COOKIES
            result.response_data = {
                status: "ok",
                // location: systemConfig.PAGES.ACCESS_PLATFORM,
                location: systemConfig.PAGES.SESSION_IS_REQUIRED,

                code: 453,
                message: "ERROR CON LAS COOKIES"
            }
            result.task = "SEND_FETCH_ERROR"
            return result;

        }

    }
    
    /***
     * 
     *      AQUI DECODIFICAMOS TODAS LAS KEYS DE NUESTRA COOKIE
     * 
     *      [atk_decoded, rtk_decoded, ]    PARA ACCESO DE USUARIOS
     * 
     *      [stk_decoded]   PARA ACCESO DE SYSTEMA A PANNEL DE CONTROL
     */

    let atk_decoded = JSON.parse(decodeToken(req.cookie_parsed.atk))
    let rtk_decoded = JSON.parse(decodeToken(req.cookie_parsed.rtk))
    let our_cookie = {atk_decoded, rtk_decoded, deviceId}

    // COMPROBAMOS EL RESTO DE COOKIES PARA ACCESOS ESPECIALES
    let stk_decoded;
    if(req.cookie_parsed.stk){
        stk_decoded = JSON.parse(decodeToken(req.cookie_parsed.stk))
        if(stk_decoded){
            our_cookie[stk_decoded] = stk_decoded
        }
    }

    
    // req.tokens = {atk_decoded, rtk_decoded, req.cookie_parsed.deviceId}


    // req.set_new_cookie = false;
    
    if(!req.body){
        req.body = {}
    }
    req.body.deviceId = deviceId;

    // todos los datos de la cookie son correctos.
    if(atk_decoded && rtk_decoded && req.body.deviceId){

        req.has_our_cookie = true;
        req.our_cookie = our_cookie;
        req.accessData = req.cookie_parsed.atk;
        req.refreshData = req.cookie_parsed.rtk

        // AÑADIMOS EL USUARIO QUE EXTRAEMOS DE LOS DATOS DE LA COOKIE
        req.user = usersByEmail[req.our_cookie.atk_decoded.email]

    // SI FALTAN LOS 3 PUEDE SER POR BORRADO DE HISTORIAL
    }else if(!atk_decoded && !rtk_decoded && !req.body.deviceId){
        // RENVIAMOS AL LOGIN / SIGNIN
        result.status = "error";
        
        if(req.method === "GET"){

            if(!req.urlData){
                req.urlData = {}
            }
            req.urlData.restricted_endpoint = false;  // para que NO BUSQUE LA PAGINA EN /restricted-urls-es
            // req.urlData.fileName = systemConfig.PAGES.DELETE_COOKIES_AND_LOGIN
            // req.urlData.fileName = systemConfig.PAGES.ACCESS_PLATFORM
            req.urlData.fileName = systemConfig.PAGES.SESSION_IS_REQUIRED
            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
            result.task = "SEND_STATIC_FILE"
            return result;

            
        }else {
            // ENVIAMOS AL LOGIN PARA SETEAR NUEVAS COOKIES
            result.response_data = {
                status: "ok",
                // location: systemConfig.PAGES.ACCESS_PLATFORM,
                location: systemConfig.PAGES.SESSION_IS_REQUIRED,

                code: 453,
                message: "ERROR CON LAS COOKIES"
            }
            result.task = "SEND_FETCH_ERROR"
            return result;
        }
        
    
    // FALTA UNO DE LOS TOKENS ??? NO PUEDE SER
    }else if (!atk_decoded || !rtk_decoded || !req.body.deviceId){
        console.log('FALTA UNO DE LOS TOKENS ??? NO PUEDE SER !!!')
        result.status = "error"
        if(req.method === "GET"){

            if(!req.urlData){
                req.urlData = {}
            }
            req.urlData.restricted_endpoint = false;  // para que NO BUSQUE LA PAGINA EN /restricted-urls-es
            // req.urlData.fileName = systemConfig.PAGES.ACCESS_PLATFORM

            req.urlData.fileName = systemConfig.PAGES.SESSION_IS_REQUIRED
            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
            result.task = "SEND_STATIC_FILE"
            return result;

            
        }else {
            // ENVIAMOS AL LOGIN PARA SETEAR NUEVAS COOKIES
            result.response_data = {
                status: "ok",
                // location: systemConfig.PAGES.ACCESS_PLATFORM,
                location: systemConfig.PAGES.SESSION_IS_REQUIRED,
                code: 453,
                message: "ERROR CON LAS COOKIES"
            }
            result.task = "SEND_FETCH_ERROR"
            return result;
        }
       

    }else if(atk_decoded.rtk !== rtk_decoded.rtk){  // DEBEN DE SER IGUALES
        console.log("atk.rtk ha de ser igual al rtk ?????????? ")
        result.status = "error"
       
        if(req.method === "GET"){

            if(!req.urlData){
                req.urlData = {}
            }
            req.urlData.restricted_endpoint = false;  // para que NO BUSQUE LA PAGINA EN /restricted-urls-es

            req.urlData.fileName = systemConfig.PAGES.SESSION_IS_REQUIRED
            req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
            result.task = "SEND_STATIC_FILE"
            return result;

            
        }else {
            // ENVIAMOS AL LOGIN PARA SETEAR NUEVAS COOKIES
            result.response_data = {
                status: "ok",
                // location: systemConfig.PAGES.ACCESS_PLATFORM,
                location: systemConfig.PAGES.SESSION_IS_REQUIRED,
                code: 453,
                message: "ERROR CON LAS COOKIES"
            }
            result.task = "SEND_FETCH_ERROR"
            return result;
        }
    }
    console.log(`OUR COOKIE: ${req.our_cookie}`)

    result.status = 'ok'
    return result;



}