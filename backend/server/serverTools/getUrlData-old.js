
/***
 * 
 *      OBTIENE LOS DATOS QUE VIENEN EN UNA PETICION 
 *      EN LA URL Y LOS HEADERS DE LA PETICION
 *      ( endpoint, url, ext, cookie, host, ...)
 * 
 * 
 *      PETICION: 
 *      host/domain.com/language/url_to_verify/.../.../endpoint/?search
 * 
 */


import path from "node:path";
import systemConfig from '../../globalData/systemConfig.js'


export default (req)=>{
    
    // console.log('** getRequestData')

    // console.log(req.headers)
    //console.log(req.url)
    req.its_bad_get_request = false;

    let data = {
        method: req.method,
        host: req.headers.host || undefined,
        mode: req.headers['sec-fetch-mode'] || undefined,
        url: "",
        url_parts: null,
        url_to_verify: "",
        endpoint: '',
        fileName: '',
        ext: "",
        from: "", 
        search: "",
        searchParams: null,
        ip: req.socket.address().address,
        hasCookie: req.headers.cookie ? true : false,
        url_language: undefined,                                   // language que viene el la url
        language: "",
        userAgent: "",
        authorization: "",

    }
   
    // data.subdomains = process.env.MODE === 'DEV' ?  req.headers.host.split(systemConfig.HOST_DEV)[0].split('.') :  req.headers.host.split(systemConfig.host_prod)[0].split('.');

    let arr = req.url.split('?');
    data.url = arr[0].toLowerCase();
    data.url_parts = data.url.split('/')

    // Obtenemos el lenguage de la respuesta y url_to_verify

    // EJEMPLOS Y EXTRAEMOS URL_PARTS
    // dominio.com -> ["",""]
    // dominio.com/es/ -> ["","es"]
    // dominio.com/es/mis-bots  -> ["","es", "mis-bots"]
    // dominio.com/mis/bots -> ["", "mis-bots"]

    if(data.url === "/"){
        // ES hOME SIN LANGUAGE EN URL
        data.language = systemConfig.MAIN_LANGUAGE;
        data.url_to_verify = "";
        data.url_to_verify_position = 0;

    }else {
        
        // hay language en la url o endpoint: Entonces se desplaza la url_to_verify
        if(data.url_parts[1].length === 2){
           
            data.url_language = data.url_parts[1].toLowerCase();
            data.url_to_verify_position = 2;
           
            if(data.url_parts[2]){
                data.url_to_verify = data.url_parts[2]
            }else{
                data.url_to_verify = "";
            }


        // no hay language en la url: ES UN ENDPOINT
        }else if(data.url_parts[1].length > 2){
            
            data.url_to_verify = data.url_parts[1]
            data.url_to_verify_position = 1;

            data.language = systemConfig.MAIN_LANGUAGE;


        // el length es menos que 2 -> NO PUEDE SER A PROPOSITO
        }else{
            data.language = systemConfig.MAIN_LANGUAGE;
            data.url_to_verify = "";

        }
   
    }

    // COMPROBAMOS QUE EL EL RESTO DE URL_PARTS, desde "data.url_to_verify_position"  NO HAY UNA "RESTRICTED ENDPOINT" 
    // PARA EVITAR EL ACCESO A UN RESTRICTED ENDPOINT COLOCANDO UNA RUTA COMO : MI-DOMINIO.COM/BLOG/MIS-BOTS
    const len_url_parts = data.url_parts.length;
console.log(data.url_parts)
console.log(data.url_to_verify_position)
    data.url_to_verify_position ++

    if(data.url_to_verify_position < len_url_parts){

        for( let i = data.url_to_verify_position; i<len_url_parts; i++){
            if( systemConfig.RESTRICTED_ENDPOINTS.includes(data.url_parts[i])){
                req.its_bad_get_request = true;
            }
        }
    }


    // Eliminamos la extension si la tiene
    data.url_to_verify = data.url_to_verify.split('.')[0]


    // REVISAMOS EL LENGUAJE DE LA PETICION PARA RESPONDER CON EL QUE SE SOLICITA
    if(!data.url_language){

        // si no hay language en la url enviamos la lengua del browser
        if(req.headers['accept-language']){
            const browser_language = req.headers['accept-language'].split(",")[0].split("-")[0].toLowerCase()
           
    
            if(systemConfig.LANGUAGES_AVAILABLE.includes(browser_language)){
                data.language = browser_language
            }else{
                data.language = systemConfig.MAIN_LANGUAGE
            }
    
        }else{
            data.language = systemConfig.MAIN_LANGUAGE;

        }

    }else{
        // Enviamos el language de la url 
        if(data.url_language && systemConfig.LANGUAGES_AVAILABLE.includes(data.url_language)){
            data.language = data.url_language
       
        //si lenguaje no admitido enviamos el main_language
        }else{
            data.language = systemConfig.MAIN_LANGUAGE;
        }

    }

    data.userAgent = req.headers['user-agent'];
    data.authorization = req.headers['authorization'];

    // LIMPIAMOS Y ELIMINAMOS // QUE HAYA DE MAS
    data.endpoint = arr[0].split('/')
        .filter((item)=>{
        if(item != '') return item.trim()})
        .join('/')
        .toLowerCase();

    // Comprobamos si es home, home en distintos idioma, o una ruta completa
    if(data.endpoint === '/' || data.endpoint === '' || systemConfig.LANGUAGES_AVAILABLE.includes(data.endpoint)){
        data.fileName = data.endpoint = systemConfig.HOME_STATIC_FILE
    }else{
        data.fileName = path.basename(data.endpoint)

    }
    // EL ENDPOINT ES LA URL FINAL
    // EL FILENAME ES EL ARCHIVO con la  EXTENSION DE ESA RUTA FINAL
    data.endpoint = data.fileName;
    data.endpoint = data.endpoint.split('.')[0]


    // Obtenemos los parametros del Search
    if(arr[1]){

        data.search = arr[1]
        data.searchParams = {}
        let tmp = arr[1].split('&');
        
        for(const item of tmp){
            let tmp2 = item.split('=');
            if(tmp2.length == 2){
                if(tmp2[0] && tmp2[0] != ''){
                    if(tmp2[1] && tmp2[1] != ''){
                        //let key = tmp2[0].toLowerCase();
                        // data.searchParams[tmp2[0].toLowerCase()] = decodeURIComponent(tmp2[1]).toLowerCase();
                        data.searchParams[tmp2[0]] = decodeURIComponent(tmp2[1]);

                    }
                }
            }
        }
        if(Object.keys(data.searchParams).length == 0){
            data.searchParams = null;
        }
        
    }

    const temp = data.fileName.split('.')
    const len = temp.length;
    
    // SI el endpoint llega sin extension, es un archivo HTML
    if(len < 2){
        data.ext = systemConfig.EXTENSION_STATIC_VIEWS
        data.fileName += '.' + data.ext;
    
    }else{
        data.ext = temp[len-1]

    }
    
    console.log(data)

    // Añadimos los datos de la url a Request Object
    req.urlData = data
    return 
}