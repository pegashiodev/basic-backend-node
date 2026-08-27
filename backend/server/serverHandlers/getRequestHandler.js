
/**
 *  manejador de las peticiones GET que llegan al servidor HTTP
 * 
 */


import sendStaticFile from './sendStaticFile.js';
import systemConfig from '../../globalData/systemConfig.js';
import routerRestrictedEndpoints from '../../router/routerRestrictedEndpoints.js';
import subdomainGetRequestHandler from "./subdomainGetRequestHandler.js"
process.loadEnvFile();


/**
 * 
 * @param {object} Objeto Request de NodeJS 
 * @param {object} Objeto Response de NodeJS
 * @returns 
 */
export default  async(req, res)=>{
   
    
    if(systemConfig.HAS_SUBDOMAINS){

        // req.urlData.subdomains = req.urlData.host.split(":")[0].split(".")
        // SOLO ELIMINAMOS EL HOST PRINCIPAL. EL RESTO ES EL SUBDOMAIN
        const host_name = process.env.MODE === "DEV" ? systemConfig.HOST_DEV : systemConfig.HOST_PROD
        req.urlData.subdomains = req.urlData.host.replace(host_name, "")
        let len = req.urlData.subdomains.length;
       
        if(len > 0){
            // Eliminamos el "."
            let str = req.urlData.subdomains;
            str = str.substring(0, str.length - 1)
            req.urlData.subdomains = str;

            let is_valid_subdomain = false;
            
            // COMPROBAMOS SI ESTAN PERMITIDOS
            if(systemConfig.SUBDOMAINS_ALLOWED.includes(req.urlData.subdomains)){
                is_valid_subdomain = true;
            }

            if(is_valid_subdomain){

                return subdomainGetRequestHandler(req, res)

            }else{
                res.code = 200,
                res.headers = {}
                req.urlData.fileName = systemConfig.PAGES.INVALID_SUBDOMAIN_REQUEST;
                req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS;
                sendStaticFile(req, res)
                return;
            }   
        }

    }
    
    req.urlData.verification_endpoint = false;
    req.urlData.restricted_endpoint = false;
    req.urlData.dinamic_endpoint = false;
    req.urlData.pay_endpoint = false;
    req.urlData.master_endpoint = false;

   
    
    // COMPROBAMOS SI TRABAJAMOS CON RESTRICTED_URLS SI LO ES  
    if(systemConfig.HAS_RESTRICTED_ENDPOINTS){
        if(req.urlData.url_to_verify && systemConfig.RESTRICTED_ENDPOINTS.includes(req.urlData.url_to_verify)){
            req.urlData.restricted_endpoint = true
            routerRestrictedEndpoints(req, res);
            return;
        
        }

    }
    
    // NO HAY HABILITADO NADA DE LO ANTERIOR
    // Es un Staic file o Static View
console.log("Es un Simple ENDPOINT !!!!")
    res.code = 200,
    res.headers = {}
    sendStaticFile(req, res)
    return;
    
}


/*

CUANDO LAS TOOLS ESTAN ABIERTAS NOS PIDE ESTE ARCHIVO ??

// resolvedPath: '/home/carlos/dev/basic-project-old/frontend/statics/com.chrome.devtools.json'


*/

