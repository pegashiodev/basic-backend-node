

/***
 * 
 * 
 *      SE MANEJAN LAS PETICIONES POST QUE SE RECIBEN 
 *      EN UN ENDPINTS DE UN MASTER
 * 
 * 
 * 
 * 
 */

import mastersEndpoints from "../globalData/mastersEndpoints.js"


export default (req, res)=>{


    console.log("ROUTER_POST_MASTER_ENDPOINTS")

    const master = req.urlData.url_to_verify;
    
    if(mastersEndpoints[master].status !== 'ACTIVE'){
        console.log("El master no esta activo")
        const response_data = {
            code: 455,
            message: "EL MASTER NO ESTA ACTIVO"
        }
        res.writeHead(445, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(response_data));
        return;

    }

    // Marcamos que ha se ha verificado que es un mester_endpoint
    req.master_endpoint_access_verified = true;



}