



/**
 * 
 *      MANEJAMOS LAS PETICIONES POST QUE LLEGAN POR SUBDOMINIOS
 * 
 * 
 * 
 */



import systemConfig from "../../globalData/systemConfig.js"

/**
 * 
 * @param {object} Objeto Request de NodeJS 
 * @param {object} Objeto Response de NodeJS
 * @returns 
 */
export default (req, res)=>{

    console.log('SUBDOMAIN_POST_REQUEST_HANDLER !!!!')

    console.log(req.subdomains)

    // AQUI PODEMOS COMPROBAR SI SON VALIDOS, 

    const response_data = {
        status: 'ok',
        message: 'SUBDOMAIN POST REQUEST ACCEPTED',
        code: 200
    }
    res.writeHead(200, { 'Content-Type': 'application/json'});
    res.end(JSON.stringify(response_data))
    return;
}