

/**
 * 
 *  RECIBE EL REFESS-TOKEN PARA COMPROBAR SI ES CORRECTO
 * 
 */

import systemConfig from "../../globalData/systemConfig.js";
import getOurCookie from "../../tools/getOurCookie.js"
import verifyTokensAndSetCookie from "../../tools/verifyTokensAndSetCookie.js";



export default async function refershBridgeHandler(req, res) {

    console.log("REFRESH-BRIDGE-HANDLER !!")

    // OBTENEMOS NUESTRA COOKIE CON ATK Y RTK
   const result_getOurCookie = await getOurCookie(req);
    if (result_getOurCookie.status !== 'ok') {
        res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            status: 'error',
            code: 405,
            message: "COOKIE INCORRECTA"
        }));
        return;
    }
console.log(req.our_cookie)
    // COMPROBAMOS SI FALTA ALGUN TOKEN
    if(!req.has_our_cookie || !req.our_cookie.atk_decoded || !req.our_cookie.rtk_decoded){
        res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
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
   console.log("Despues de VERIFY") 
    // SI LA SESSION EXPIRO ENVIAMOS AL LOGIN
    if(req.session_expired){

        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            status: 'error',
            code: 401,
            message: "SEND-LOGIN",
            location: systemConfig.PAGES.ACCESS_PLATFORM
        }));
        return
        
    
    // TOKENS RENOVADOS
    }else{


        let headers = {
            'Content-Type': 'application/json; charset=utf-8' 
        }

        if(req.set_new_cookie){
            headers['Set-Cookie'] = req.cookie;
        }
        res.writeHead(200, headers);
        res.end(JSON.stringify({
            status: 'error',
            code: 200,
            message: "TOKENS-RENOVED",
            
        }));
        return
        
    }
   
}