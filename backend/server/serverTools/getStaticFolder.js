
import systemConfig from "../../globalData/systemConfig.js"
import languages from "../../globalData/languages.js"


export default function (req, res){

     // SI ES UN ARCHIVO HTML, LO TRAMITAMOS AQUI -> COLOCAMOS LA CARPETA STATICS O RESTRICTED_ENDPOINTS
   


     if(req.urlData.ext === systemConfig.EXTENSION_STATIC_VIEWS){
        res.headers['content-type'] = 'text/html'

        if(!req.urlData.language){
            req.urlData.language = systemConfig.MAIN_LANGUAGE
        }


        if(req.urlData.restricted_endpoint){
            req.static_folder = languages[req.urlData.language].HTML_RESTRICTED_URLS_FOLDER
            
            // req.static_folder = systemConfig.FOLDERS.RESTRICTED_FILES
        }else if(req.urlData.dinamic_url){
            req.static_folder = languages[req.urlData.language].HTML_DINAMIC_URLS_FOLDER

            // req.static_folder = systemConfig.FOLDERS.DINAMIC_FILES
        }else{
            req.static_folder = languages[req.urlData.language].HTML_URLS_FOLDER

            // req.static_folder = systemConfig.FOLDERS.TEMPLATE_FILES
        }


        req.static_folder += '/'


    }else{
        
        const types_statics_files = {
    
            'css':      { type: 'text/css', folder: systemConfig.FOLDERS.STATICS_FILES},
            'js':       { type: 'application/javascript', folder: systemConfig.FOLDERS.STATICS_FILES},
            'woff':     { type: 'font/woff', folder: systemConfig.FOLDERS.STATICS_FILES},
            'woff2':    { type: 'font/woff2', folder: systemConfig.FOLDERS.STATICS_FILES},
            'ttf':      { type: 'font/ttf', folder: systemConfig.FOLDERS.STATICS_FILES},
            'otf':      { type: 'font/otf', folder: systemConfig.FOLDERS.STATICS_FILES},
            'json':     { type: 'application/json', folder: systemConfig.FOLDERS.STATICS_FILES},
            'pdf':      { type: 'application/pdf', folder: systemConfig.FOLDERS.STATICS_FILES},
    
            'jpeg':     { type: 'image/jpeg', folder: systemConfig.FOLDERS.IMAGES_FILES},
            'png':      { type: 'image/png', folder: systemConfig.FOLDERS.IMAGES_FILES},
            'jpg':      { type: 'image/jpeg', folder: systemConfig.FOLDERS.IMAGES_FILES},
            'gif':      { type: 'image/gif', folder: systemConfig.FOLDERS.IMAGES_FILES},
            'webp':     { type: 'image/webp', folder: systemConfig.FOLDERS.IMAGES_FILES},
            'svg':      { type: 'image/svg+xml', folder: systemConfig.FOLDERS.IMAGES_FILES},
            'ico':      { type: 'image/ico', folder: systemConfig.FOLDERS.STATICS_FILES},
    
            'wav':      { type: 'audio/wav', folder: systemConfig.FOLDERS.MEDIA_FILES},
            'mp3':      { type: 'audio/mpeg', folder: systemConfig.FOLDERS.MEDIA_FILES},
            'ogg':      { type: 'audio/ogg', folder: systemConfig.FOLDERS.MEDIA_FILES},
            'oga':      { type: 'audio/ogg', folder: systemConfig.FOLDERS.MEDIA_FILES},
    
    
        }
    
        // SI NO EXISTE COLOCAMOS EN BLANCO Y CARPETA DE ESTATICOS -> LUEGO SE MANEJA EL ERROR DE BUSQUEDA DEL ARCHIVO
        res.headers['content-type'] = types_statics_files[req.urlData.ext]?.type || ''
        
        req.static_folder = types_statics_files[req.urlData.ext]?.folder || systemConfig.FOLDERS.TEMPLATE_FILES;
        req.static_folder += '/'

    }

}