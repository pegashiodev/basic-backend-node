

/***
 * 
 *  MANEJADOR DE LAS PETICIONES POST QUE LLEGAN EL SERVIDOR HTTP
 * 
 * 
 * - OBTENEMOS LOS DATOS DE LA PETICION : urlData y body
 * - COMPROBAMOS SI ES UNA PETICION PARA ALGUN SUBDOMINIO: SI ES ASI LA TRAMITAMOS
 * - COMPROBAMOS SI ES UN ENDPOINT QUE NO REQUIERE COOKIE DE LA PLATAFORMA: TRAMITAMOS SI PROCEDE
 * - COMPROBAMOS LA COOKIE: SI NO CORRECTA ENVIAMOS MESAJE DE REDIRECCION AL LOGIN O SIGNUP
 * - TRAMITAMOS LA PETICION -> routerPostRequest.js
 * 
 * 
 */




import getRequestBody from "../serverTools/getRequestBody.js";
import getUrlData from "../serverTools/getUrlData.js";
import routerPostRequest from "../../router/routerPostRequest.js";
import systemConfig from "../../globalData/systemConfig.js";
import getOurCookie from "../../tools/getOurCookie.js";
import subdomainPostRequestHandler from "./subdomainPostRequestHandler.js";
import sessionsCached from "../../globalData/sessionsCached.js";
import usersByEmail from "../../globalData/usersByEmail.js";


/**
 * 
 * @param {req}
 * @param {res}
 */
export default  async (req, res)=>{
    
    console.log("\n\nNUEVA PETICION POST ************************************")
    console.log(`URL: ${req.url}`)
    console.log("** PostRequestHandler !!")
    
    if(!req.headers['content-type']){
        console.log('POST -> NO Content-Type IN REQUEST -> devolvemos 404')
        const response_data = {
            message: 'NO HEADER[CONTENT-TYPE] EN LA PETICION',
            code: 450
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(response_data))
        return;
    }

    const contentType = req.headers['content-type']
    
    // Obtenemos Datos de la URL
    //getUrlData(req);

    if(!req.urlData.endpoint){
        console.log('POST -> NO endpoint IN REQUEST -> devolvemos 404')
        const response_data = {
            message: 'NO ENDPOINT EN LA PETICION',
            code: 450
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(response_data))
        return;
    }
    
    
    if(contentType === 'application/json'){
        req.urlData.body_type = 'JSON';

    }else if(contentType.startsWith('image/')){
        req.urlData.body_type = 'IMAGE';

    }else if(contentType.startsWith('audio/')){
        req.urlData.body_type = 'AUDIO';

    }else if(contentType.startsWith('file/')){
        req.urlData.body_type = 'FILE';     

    }else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({status: "error", code: 445, message: 'TIPO DE BODY NO ESPERADO!!'}));
        return;
    }

   
    // OBTENEMOS EL BODY DE LA PETICION
    try{
        const result = await getRequestBody(req, req.urlData.body_type);
        
        if(result.status === 'ok'){
            req.body = result.data;                
        }else{
            console.log('ERROR con el BODY ENVIADO')
            const response_data = {
                code: 440,
                message: "LOS DATOS DEL BODY NO SE HAN PODIDO RECIBIR CORRECTAMENTE"
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(JSON.stringify(response_data));
            return;
        }

    }catch(err){

        console.log('ERROR AL CAPTURAR EL BODY')
        const response_data = {
            code: 440,
            message: "LOS DATOS DEL BODY NO SE HAN RECIBIDO CORRECTAMENTE"
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(response_data));
        return;
    }

    // TRAMITAMOS AQUI SI ES UNA PETICION A UN SUBDOMAIN

    // ...
    if(systemConfig.HAS_SUBDOMAINS){

        // req.urlData.subdomains = req.urlData.host.split(":")[0].split(".")
        // SOLO ELIMINAMOS EL HOST PRINCIPAL. EL RESTO ES EL SUBDOMAIN
        const host_name = process.env.MODE === "DEV" ? systemConfig.HOST_DEV : systemConfig.HOST_PROD
        
        req.urlData.subdomains = req.urlData.host.replace(host_name, "")
        let len = req.urlData.subdomains.length;
        console.log(req.urlData.subdomains)

        if(len > 0){
            
            // Eliminamos el "."
            let str = req.urlData.subdomains;
            str = str.substring(1, str.length - 1)
            req.urlData.subdomains = str;

            let is_valid_subdomain = false;

            // COMPROBAMOS SI ESTAN PERMITIDOS
            if(systemConfig.SUBDOMAINS_ALLOWED.includes(req.urlData.subdomains[i])){
                is_valid_subdomain = true;
            }

            if(is_valid_subdomain){

                return subdomainPostRequestHandler(req, res)

            }else{
                const response_data = {
                    code: 486,
                    message: "INVALID SUBDOMAIN"
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(JSON.stringify(response_data));
                return;
            }   
        }

    }
   
    // PERMITIMOS EL PASO DIRECTO  A ESOS ENDPOINTS QUE NO REQUIEREN COOKIE
    if(req.urlData.endpoint && systemConfig.VALID_POST_ENDPOINTS_WITHOUT_COOKIE.includes(req.urlData.endpoint)){
        // AÑADIMOS DATOS AL BODY
        console.log("Ruta valida")
        req.body.language = req.urlData.language;
        req.body.ip = req.urlData.ip;
        return routerPostRequest(req, res)
    }


    // PERMITIMOS EL PASO DIRECTO  A ESOS ENDPOINTS QUE NO REQUIEREN SESSION
    if(req.urlData.endpoint && systemConfig.VALID_POST_ENDPOINTS_WITHOUT_SESSION.includes(req.urlData.endpoint)){
        // AÑADIMOS DATOS AL BODY
        console.log("Ruta valida")
        req.body.language = req.urlData.language;
        req.body.ip = req.urlData.ip;
        return routerPostRequest(req, res)
    }



    // OJO !!!
    // OJO DEJAMOS PASAR PARA PROBAR LAS OPCIONES DE REMOTE PANEL

    // if(req.urlData.endpoint === "remote-control-handler-post" || req.urlData.endpoint === "verify-from-remote-panel"){
    //     // AÑADIMOS DATOS AL BODY
    //     req.body.language = req.urlData.language;
    //     req.body.ip = req.urlData.ip;
    // console.log(req.urlData.endpoint)
    //     routerPostRequest(req, res)
    //     return;
    // }

   

    // PARA EL RESTO DE ENDPOINTS COMPROBAMOS COOKIE
    if(req.urlData.hasCookie){

        const result_getOurCookie = getOurCookie(req)

        if(result_getOurCookie.status !== 'ok'){

            if(result_getOurCookie.task === "SEND_FETCH_ERROR"){
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result_getOurCookie.response_data));
                return;
            }else{
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({status: "error", message: "Error Obteniendo Cookie desde postRequestHandler"}));
                return;
            }
        }
    }


    // PERMITIMOS SEGUIR SI HAY NUESTRA COOKIE Y HAY SESION
    if(req.has_our_cookie){

        // VERIFICAMOS NUESTRA COKKIE POR SI HAY QUE ACTUALIZAR ALGUN TOKEN
        req.user = usersByEmail[req.our_cookie.atk_decoded.email]
        verifyTokensAndSetCookie(req, req.user, "POST_REQUEST")

        // AÑADIMOS DATOS AL BODY
        req.body.language = req.urlData.language;
        req.body.ip = req.urlData.ip;
        routerPostRequest(req, res)
      
    }else{

        let location = systemConfig.PAGES.SESSION_IS_REQUIRED

        // SI LA HAY, AÑADIMOS LA RUTA DESDE LA QUE SE LE ENVIO AL LOGUEARSE: "req.urlData.search"
        if(req.urlData.searchParams?.from){
            location = `${systemConfig.PAGES.SESSION_IS_REQUIRED}/?${req.urlData.search}`;
            // if(req.urlData.searchParams.search){
            //     location += `params=${req.urlData.searchParams.search.slice(1)}`
            // }
        }
        
        const response_data = {
            status: "error",
            // location: systemConfig.PAGES.SESSION_IS_REQUIRED,
            location: location, 
            code: 452,
            message: "NO HAY nuestras  COOKIES"
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data));
        return;

    }
     


}
