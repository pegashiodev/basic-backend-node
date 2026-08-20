

/**
 * 
 *  RECIBE EL REFESS-TOKEN PARA COMPROBAR SI ES CORRECTO
 * 
 */

import systemConfig from "../../globalData/systemConfig";
import getOurCookie from "../../tools/getOurCookie"


const sendPostError = (res, statusCode, message, customCode = null, location = null) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        status: 'error',
        code: customCode || statusCode,
        message: message
    }));
};

export default refershBridgeHandler =  async function (params) {

    // OBTENEMOS NUESTRA COOKIE CON ATK Y RTK
   const result_getOurCookie = await getOurCookie(req);
    if (result_getOurCookie.status !== 'ok') {
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            status: 'error',
            code: 405,
            message: "COOKIE INCORRECTA"
        }));
        return;
    }

    // COMPROBAMOS SI FALTA ALGUN TOKEN
    if(!req.has_our_cookie || !req.our_cookie.atk_decodec || !req.our_cookie.rtk_decodec){
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            status: 'error',
            code: 406,
            message: "FALTAN TOKENS EN LA COOKIE"
        }));
        return
    }

    
    // Verificar y renovar tokens de sesión
    await verifyTokensAndSetCookie(req, "REFRESH-BRIDGE");
    
    // ACTUAMOS EN FUNCION DEL RESULTADO DE LOS TOKENS
    
    // SI LA SESSION EXPIRO ENVIAMOS AL LOGIN
    if(req.session_expired){
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            status: 'error',
            code: 401,
            message: "SEND-LOGIN",
            location: systemConfig.PAGES.ACCESS_PLATFORM
        }));
        return
        
    
    // TOKENS RENOVADOS
    }else{
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        if(req.set_new_cookie){
            headers['Set-Cookie'] = req.cookie;
        }
        res.end(JSON.stringify({
            status: 'error',
            code: 200,
            message: "TOKENS-RENOVED",
            
        }));
        return
        
    }
   
}