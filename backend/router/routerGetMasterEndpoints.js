


/**
 * 
 *          DESDE AQUI SE ACMINISTRAN LOS ACCESOS GET A LOS ENDPOINTS DE LOS MASTERS.
 *          UNOS SERAN PUBLICOS Y OTROS PRIVADOS.
 * 
 *          EN CADA CASO HABRA QUE VER LA COOKIE, SESSION, SUBDOMINIO, ....
 * 
 * 
 */


import mastersEndpoints from "../globalData/mastersEndpoints.js"


export default (req, res)=>{
    console.log("ROUTER_GET_MASTER_ENDPOINTS")
    console.log(req.urlData)

    const master = req.urlData.url_to_verify;

    if(mastersEndpoints[master].status !== 'ACTIVE'){
        console.log("El master no esta activo")
        // RESPONDEMOS CON UNA PAGINA DE INFO
        res.code = 404,
        res.headers = {}
        sendStaticFile(req, res)
        return;
    }

}