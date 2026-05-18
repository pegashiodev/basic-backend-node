
import { createReadStream, access, constants  }  from  'node:fs'
import systemConfig from "../../globalData/systemConfig.js";
import staticsFilesCached from "../../globalData/staticsFilesCached.js"
import siteStats from '../../router/routerTools/siteStats.js';
import getStaticFolder from "../serverTools/getStaticFolder.js"
import htmlFilesCatchedEN from '../../globalData/htmlFilesCatchedEN.js';
import htmlFilesCatchedES from '../../globalData/htmlFilesCatchedES.js';
import languages from '../../globalData/languages.js';
process.loadEnvFile();


export default (req, res)=>{

    console.log('sendStaticFile')
    //console.log(res.headers)

    // MANEJAMOS LOS DIFERENTES CODIGOS DE ERROR
    if(!res.headers){
        res.headers = {}
    }
    // SI ES UNA REDIRECCION TERMINAMOS AQUI.
    if(res.code === 302 || res.code === 301){
        res.writeHead(res.code, res.headers)
        return res.end();
    }

    if(res.code === 404){
        
        if(req.urlData.language){

            req.urlData.fileName = systemConfig.PAGES.PAGE_NOT_FOUND + "-" + req.urlData.language;
        }else{
            req.urlData.fileName = systemConfig.PAGES.PAGE_NOT_FOUND + "-" + systemConfig.MAIN_LANGUAGE;

        }
        req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
        // res.writeHead(res.headers_response.code, res.headers_response.headers)
        // return res.end();
    
    }else if(res.code === 500){

        if(req.urlData.language){

            req.urlData.fileName = systemConfig.PAGES.REQUEST_INVALID + "-" + req.urlData.language;
        }else{
            req.urlData.fileName = systemConfig.PAGES.REQUEST_INVALID + "-" + systemConfig.MAIN_LANGUAGE;

        }
        req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
    }

    
    // PUEDE HABER SIDO ASIGNADA EN OTRA PARTE. EJ. EN SUBDOMAINS, ...
    if(!req.static_folder){
        
        // la añade en req.static_folder
        // aÑADE LA CARPETA DONDE ESTA EL ESTAICO DEPENDIENDO DE SU TIPO
        getStaticFolder(req, res)
    }
        
    let filePath = ""
    
    // BUSCAMOS ENTRE LOS CACHEADOS Y SI NO ESTA DEJAMOS PASAR PARA LEER DE DISCO
    // INICIALIZAMOS CON 200 Y SI HAY ERROR DENTRO SE CAMBIA
    // res.code = 200;

    // BUSCAMOS ENTRE LOS CACHEADOS Y SI NO ESTA DEJAMOS PASAR PARA LEER DE DISCO

    console.log(`ENVIAMOS: ${req.urlData.fileName}`)
    res.headers['Cache-Control'] = systemConfig.TOKENS_AGE.CATCH_STATICS_FILES_TIME
       

    // BUSCAMOS ENTRE LOS CACHEADOS Y SI NO ESTA DEJAMOS PASAR PARA LEER DE DISCO

    // SI ES UN HTML
    if(req.urlData.ext === systemConfig.EXTENSION_STATIC_VIEWS){
        res.headers["Content-type"] = "text/html"
        // ELIMINAMOS LAS  "/" DEL FILENAME SI LAS TIENE
        req.urlData.fileName = req.urlData.fileName.replace("/", "")
       
        if(systemConfig.HAS_MULTI_LANGUAJES){

            if(languages[req.urlData.language]?.HTML_FILES_CACHED[req.urlData.fileName]){
                // console.log("**** ESTA CACHEADO !!")

                if(!res.code){res.code = 200}
                res.writeHead(res.code, res.headers)
                // res.write(htmlFilesCatchedES[req.urlData.fileName])
                res.write(languages[req.urlData.language].HTML_FILES_CACHED[req.urlData.fileName])

                res.end()
                siteStats(req)
                return
            }

        }else{


            if(languages[systemConfig.MAIN_LANGUAGE].HTML_FILES_CACHED[req.urlData.fileName]){

                if(!res.code){res.code = 200}
                res.writeHead(res.code, res.headers)
                res.write(languages[systemConfig.MAIN_LANGUAGE].HTML_FILES_CACHED[req.urlData.fileName])
                res.end()

                siteStats(req)
                return;
            }
        }
        // Almacenamos estadistica
        
        

    // ES OTRO TIPO DE ESTATICO
    }else if(staticsFilesCached[req.urlData.fileName]){
        if(!res.code){res.code = 200}
        res.writeHead(res.code, res.headers)
        res.write(staticsFilesCached[req.urlData.fileName])
        res.end()
        return
        
    }

    // console.log("NO ESTA CACHEADO !!!")
    // console.log(req.urlData.fileName)
    if(process.env.MODE === "DEV"){

        // filePath= new URL('../../frontend/' + req.static_folder + req.urlData.fileName, import.meta.url).pathname;
        filePath = systemConfig.BASE_URL_FRONTEND_FILES_DEV + req.static_folder + req.urlData.fileName 
        console.log({enviamos: filePath})

    }else{
        // filePath = new URL('RUTA-DEL-SERVER' + req.static_folder + req.urlData.fileName, import.meta.url).pathname;
        filePath = systemConfig.BASE_URL_FRONTEND_FILES_PROD + req.static_folder + req.urlData.fileName 

    }
    
    
    access(filePath, constants.F_OK, (error) => {   
        if (error) {
            // SI SE SOLICITA UN HTML RESPONDEMOS 404
            if(req.urlData.ext === systemConfig.EXTENSION_STATIC_VIEWS){

                // SE SOLICITA UN ESTATICO distinto de HTML (JS, CSS, ...)
                console.log(`El archivo HTML ${req.urlData.fileName} NO EXISTE -1`)
                
                // console.log(req.urlData.language);
                // DEVOLVEMOS 404 EN EL LENGUAJE QUE CORRESPONDA
                res.writeHead(404, {"content-type": "text/html"})
                if(languages[req.urlData.language]?.HTML_FILES_CACHED["404-" + req.urlData.language + ".html"]){
                    res.write(languages[req.urlData.language].HTML_FILES_CACHED["404-" + req.urlData.language + ".html"])
                    res.end()
                }else{
                    res.end("ERROR en la PLATAFORMA: VUELVA A INTENTARLO PASADOS UNOS MINUTOS.")
                }
                return;



            
            // SE SOLICITA UN ESTATICO distinto de HTML (JS, CSS, ...)
            }else{
                console.log(`El archivo Statico ${req.urlData.fileName} NO EXISTE -2`)
                res.writeHead(404, {})
                if(languages[req.urlData.language]?.HTML_FILES_CACHED["404-" + req.urlData.language + ".html"]){
                    res.write(languages[req.urlData.language].HTML_FILES_CACHED["404-" + req.urlData.language + ".html"])
                    res.end()
                }else{
                    res.write(languages[systemConfig.MAIN_LANGUAGE].HTML_FILES_CACHED["404-" + systemConfig.MAIN_LANGUAGE + ".html"])
                    res.end()
                }

                return;
            }
        }

        // SI ES UN HTML Y CODE === 200
        // ACTUALIZAMOS ESTADISTICAS DE USO DEL SITIO WEB
        if(req.urlData.ext === systemConfig.EXTENSION_STATIC_VIEWS && res.code === 200){
            siteStats(req)
        }

        // Añadimos el tiempo de cache de los staticos por defecto
        // res.headers['Cache-Control'] = systemConfig.TOKENS_AGE.CATCH_STATICS_FILES_TIME
        // res.writeHead(res.code, res.headers)
        if(!res.code){res.code = 200}
        res.writeHead(res.code, res.headers)
        const readStream = createReadStream(filePath); 
        readStream.on('data', chunk => res.write(chunk));
        readStream.on('close', () => res.end());

    })    


}