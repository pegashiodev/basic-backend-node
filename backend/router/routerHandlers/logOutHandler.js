import systemConfig from "../../globalData/systemConfig.js";
import { decodeToken } from "../../tools/tokenGenerator.js";
import cookieParser from "../../tools/cookieParser.js";
import sessionsCached from "../../globalData/sessionsCached.js";
import sessionHandler from "../../sessions/sessionHandler.js";
import getOurCookie from "../../tools/getOurCookie.js";


export default function(req, res){
    console.log(" ** LogOutHandler !!")

    console.log(req.headers);

    if(!req.headers.cookie){
        const response_data = {
            "status": "ok",
            "location": systemConfig.PAGES.MAIN_CAT_ENPOINT,   
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
    const result_getOuCookie = getOurCookie(req)
   
    if(result_getOuCookie.status !== 'ok'){
        if(result_getOuCookie.task === "SEND_FETCH_ERROR"){
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result_getOuCookie.response_data));
            return;
        }
    }

    if(!req.has_our_cookie){
        const response_data = {
            "status": "ok",
            "location": systemConfig.PAGES.MAIN_CAT_ENPOINT,   
            "message": "NO COOKIE EN EL LOGOUT. -> ENVIAMOS A /HOME"
        }
                //AÑADIMOS LA COOKIE COMO UN OBJETO JSON PARA COLOCAR VARIAS VARIABLES;
        res.writeHead(200, 
            {   'Content-Type': 'application/json'
            });
            
        res.end(JSON.stringify(response_data));
        return;   
    }

    // let {atk, rtk, deviceId: id} = cookieParser(req.headers.cookie);
    // console.log({atk, rtk, id});

    // let atk_decoded = JSON.parse(decodeToken(atk))
    // let rtk_decoded = JSON.parse(decodeToken(rtk))
    // let deviceId = id

    // if(!atk_decoded || !rtk_decoded || !deviceId){
    //     console.log('! No todos los tokens')
    //     const response_data = {
    //         "status": "ok",
    //         "location": systemConfig.PAGES.MAIN_CAT_ENPOINT,   
    //         "message": "NO COOKIE EN EL LOGOUT. -> ENVIAMOS A /HOME"
    //     }
    //     res.writeHead(200, 
    //         {   'Content-Type': 'application/json'
    //         });
            
    //     res.end(JSON.stringify(response_data));
    //     return;  
    // }

    let session = sessionsCached[req.our_cookie.atk_decoded.email];
    
    if(session){

        // MARCAMOS COMO FINALIZADA Y LA ALMACENAMOS
        session.status = 'ENDED'
        let data = {
            task: 'SESSION_ENDED',
            email: req.our_cookie.atk_decoded.email,
            new_value: session,
            await: false
        }
        sessionHandler.updateSession(data)
    }


    // REENVIAMOS A /BOTS
    // BORRAMOS LAS COOKIES

    const response_data = {
        "status": "ok",
        "location": systemConfig.PAGES.MAIN_CAT_ENPOINT,
        "message": "LOGOUT EJECUTADO CON EXITO"
    }
        //AÑADIMOS LA COOKIE COMO UN OBJETO JSON PARA COLOCAR VARIAS VARIABLES;
    res.writeHead(200, 
        {   'Content-Type': 'application/json',
    });
        
    res.end(JSON.stringify(response_data));
    return;  
}