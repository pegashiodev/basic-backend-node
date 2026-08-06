
/**
*      MANEJADOR DE UN ENDPOINT RESTRINGIDO "mis-bots"
*      EN ESTE CASO SE TRATA DE LA URL "host:/mis-bots/... "
* 
* 
*/



import systemConfig from "../globalData/systemConfig.js";
import sendStaticFile from "../server/serverHandlers/sendStaticFile.js";


/**
 * 
 * @param {object} Objeto Request de NodeJS 
 * @param {object} Objeto Response de NodeJS
 * @returns 
 */

export default function(req, res){

    console.log('In MY-BOTS TEMPLATE HANDLER')

    // SI NO TIENE NUESTRA COOKIE REDIRECCIONAMOS A "ACCESS PLATFORM"
    if(!req.our_cookie){            // req.our_cookie = {atk_decoded, rtk_decoded, id}
        
        // No cookie y es restricted_url -> Enviamos a login/signin
        res.code = 302, 
        res.headers = {
            'Location' : systemConfig.PAGES.ACCESS_PLATFORM,
            'Cache-Control': 'no-cache, no-store, max-age=0, private,  must-revalidate',
            'Pragma': 'no-cache',
            'Expires': 0,
        }
        return sendStaticFile(req, res)

    // TIENE NUESTRA COOKIE Y VERIFICAMOS SI HAY QUE ACTUALIZARLA, PARA AÑADIRLA A LOS HEADERS
    }else{
       
        if(req.set_new_cookie){
            res.code = 200,
            res.headers = {
                'Content-type': "text/html",
                'Set-Cookie': req.cookie
            }
        }else{

            res.code = 200,
            res.headers = {
                'Content-type': "text/html",
            }
        }

        // enviamos el html que corresponde
        return sendStaticFile(req, res)
        
        
    }

          
}
