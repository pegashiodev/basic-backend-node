
/**
 *  manejador de las peticiones GET que llegan al servidor HTTP
 * 
 */


import sendStaticFile from './sendStaticFile.js';
import systemConfig from '../../globalData/systemConfig.js';
import getUrlData from "../serverTools/getUrlData.js"
import routerVerificationEndpoints from '../../router/routerVerificationEndpoints.js'
import routerRestrictedEndpoints from '../../router/routerRestrictedEndpoints.js';
import routerDinamicEndpoints from '../../router/routerDinamicEndpoints.js';
import subdomainGetRequestHandler from "./subdomainGetRequestHandler.js"
import mastersEndpoints from '../../globalData/mastersEndpoints.js';
import routerGetMasterEndpoints from '../../router/routerGetMasterEndpoints.js';
import routerPayEndpoints from "../../router/routerPayEndpoints.js"
process.loadEnvFile();


/**
 * 
 * @param {object} Objeto Request de NodeJS 
 * @param {object} Objeto Response de NodeJS
 * @returns 
 */
export default  async(req, res)=>{
    
    console.log("\n\n NUEVA PETICION GET ************************************")
    
    // EXTRAEMOS TODA LA DATA DE LA REQUEST
    getUrlData(req);
    console.log(`URL: ${req.urlData.url}`)
    // console.log(req.urlData);

    // PETICION QUE SE HACE CUANDO TIENES LAS HERRAMIENTAS DE DESARROLLADOR ABIERTAS
    // en este caso desde Chrome o Brave
    // NO COMPROBAMOS NADA MAS DE MOMENTO -> teRMINAMOS ESTA CONEXION
    if(req.urlData.url === "/.well-known/appspecific/com.chrome.devtools.json"){
        return res.end()
    }
    
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

    // comprobamos si el sistema permite URLS DE VERIFICACION y ES UNA DE ELLAS
    if(systemConfig.HAS_VERIFICATION_ENDPOINTS && systemConfig.VERIFICATION_ENDPOINTS.includes(req.urlData.endpoint)){
        req.urlData.verification_endpoint = true
        routerVerificationEndpoints(req, res)
        return;

    // COMPROBAMOS SI ES UNA RUTA DE PAGOS
    }else if(systemConfig.HAS_PAY_ENDPOINTS && systemConfig.PAY_ENDPOINTS.includes(req.urlData.endpoint)){
        req.urlData.pay_endpoint = true;
        routerPayEndpoints(req, res)
        return;
    
    // COMPROBAMOS SI TRABAJAMOS CON RESTRICTED_URLS SI LO ES  
    }else if(systemConfig.HAS_RESTRICTED_ENDPOINTS){
        if(req.urlData.url_to_verify && systemConfig.RESTRICTED_ENDPOINTS.includes(req.urlData.url_to_verify)){
            req.urlData.restricted_endpoint = true
            routerRestrictedEndpoints(req, res);
            return;
        
        }
    
    // COMPROBAMOS SI TRABAJAMOS CON DINAMIC_URLS -> sE CREAN PARA ATENDER UN SERVIVIO PUNTUAL 
    }else if(systemConfig.HAS_DINAMIC_ENDPOINTS && systemConfig.DINAMIC_ENDPOINTS.includes(req.urlData.endpoint)){
        req.urlData.dinamic_endpoint = true;
        routerDinamicEndpoints(req, res)
        return;
    
    // COMPROBAMOS SI TRABAJAMOS CON MASTERS_ENDPOINTS y SI EXISTE  ESE MASTER  
    }else if(systemConfig.HAS_MASTERS_ENDPOINTS){
        if(req.urlData.url_to_verify && mastersEndpoints[req.urlData.url_to_verify]){
            req.urlData.master_endpoint = true
            routerGetMasterEndpoints(req, res);
            return;
       
        }
   
    }
    
    // NO HAY HABILITADO NADA DE LO ANTERIOR
    // Es un Staic file o Static View
    // 
    res.code = 200,
    res.headers = {}
    sendStaticFile(req, res)
    return;
    
}




