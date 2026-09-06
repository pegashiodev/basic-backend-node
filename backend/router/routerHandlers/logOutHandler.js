
/**
 *  LOGOUT DEL USUARIO DESDE EL FRONTEND
 * 
 */

import systemConfig from "../../globalData/systemConfig.js";
import { updateSession } from "../../sessions/sessionHandler.js";
import getOurCookie from "../../tools/getOurCookie.js";
import { redisClient } from '../../db/openRedis.js';
import { getRedisSession } from "../../db/redisService.js";


/**
 * 
 * @param {object} Objeto Request de NodeJS
 * @param {object} Objeto Response de NodeJS
 * 
 */
export default async function(req, res){
    console.log(" ** LogOutHandler !!")

    // Si no hay cookie enviamos al home, y no se hace nada mas: No tenemos usuario para eliminar nada en el backend
    if(!req.headers.cookie){
        const response_data = {
            "status": "ok",
            "location": systemConfig.PAGES.HOME,   
            "message": "NO COOKIE EN EL LOGOUT. -> ENVIAMOS A /HOME"
        }
                //AÑADIMOS LA COOKIE COMO UN OBJETO JSON PARA COLOCAR VARIAS VARIABLES;
        res.writeHead(200, 
            {   'Content-Type': 'application/json'
            });
            
        res.end(JSON.stringify(response_data));
        return;   

    }

    // OBTENEMOS NUESTRA COOKIE
    const result_getOuCookie = await getOurCookie(req)

    // Si no tiene nuestra cookie o esta incompleta-> Enviamos a Home y no hacemos nada mas en backend 
    if(result_getOuCookie.status !== 'ok'){
        const response_data = {
            "status": "error",
            "location": systemConfig.PAGES.HOME,   
            "message": "NO COOKIE EN EL LOGOUT. -> ENVIAMOS A /HOME"
        }
                //AÑADIMOS LA COOKIE COMO UN OBJETO JSON PARA COLOCAR VARIAS VARIABLES;
        res.writeHead(400, 
            {   'Content-Type': 'application/json'
            });
            
        res.end(JSON.stringify(response_data));
        return; 
    }

    // HAY COOKIE VALIDA: -> Eliminamos session en Redis y en MongoDB (ENDED)
    
   
    const sessionIdString = req.our_cookie?.atk_decoded?.sessionId;
    if(!sessionIdString){
        const response_data = {
            "status": "ok",
            "location": systemConfig.PAGES.HOME,   
            "message": "NO COOKIE EN EL LOGOUT. -> ENVIAMOS A /HOME"
        }
                //AÑADIMOS LA COOKIE COMO UN OBJETO JSON PARA COLOCAR VARIAS VARIABLES;
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response_data));
        return; 
    }

    const session = await getRedisSession(sessionIdString)

    // SI HAY SESSION EN REDIS, LA BORRAMOS
    if(session){
        await redisClient.del(`session:${sessionIdString}`); 
    }

    const response_data = {
        "status": "ok",
        "location": systemConfig.PAGES.HOME,
        "message": "LOGOUT EJECUTADO CON EXITO"
    }
        //AÑADIMOS LA COOKIE COMO UN OBJETO JSON PARA COLOCAR VARIAS VARIABLES;
    res.writeHead(200, 
        {   'Content-Type': 'application/json',
    });
        
    res.end(JSON.stringify(response_data));
    return;  
}