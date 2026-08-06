

/**
 *  MANEJADOR DE UN ENDPOINT RESTRINGIDO
 *  EN ESTE CASO SE TRATA DE LA URL "host:/user/... "
 * 
 * 
 */



import sendStaticFile from "../server/serverHandlers/sendStaticFile.js"

/**
 * 
 * @param {} req 
 * @param {*} res 
 * @returns 
 */

export default function(req, res){

    console.log('In USER TEMPLATE HANDLER')
    

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

        // AQUI HABRA RUTAS DONDE HABRA QUE RENDERIZAR HTML Y OTRAS STATICS 
        // EL RECURSO A SERVIR ESTA en searchParams -> Para que siempre entren por "/mis-bots/"

        if(!req.urlData.searchParams?.userIdResource){
            
            // en req.data ya esta el endpoint, filename y ext
            return sendStaticFile(req, res)
        }

        // Comprobamos que el el recurso de users pertenece al usuario que lo solicita
        // Si el usuario esta ACTIVE, ...
        
        
    }

}