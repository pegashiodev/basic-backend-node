
/**
 * 
 *      MANEJAMOS LAS PETICIONES GET QUE LLEGAN POR SUBDOMINIOS
 *      PARA SEPARARLAS DEL FLUJO NORMAL
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

    console.log(' SUB-DOMAIN REQUEST HANDLER !!!!')

    console.log(req.subdomains)

    // AQUI PODEMOS COMPROBAR SI SON VALIDOS, 

    res.writeHead(200, {})
    res.end(" PETICION GET A SUBDOMAIN ACEPTADA !!")
    
    return;
}