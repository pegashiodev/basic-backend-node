
import systemConfig from "../../globalData/systemConfig.js"
import { readdirSync, readFileSync, stat, statSync }  from  'node:fs'
import {Buffer} from 'node:buffer'
import htmlFilesCachedEN from "../../globalData/htmlFilesCatchedEN.js"
import htmlFilesCachedES from "../../globalData/htmlFilesCatchedES.js"

import languages from "../../globalData/languages.js"




export default function(){

    console.log("CATCH_HTML_FILES !!")

    if(!systemConfig.CATCH_FILES_FOLDERS){
        return;
    }
        
    const FOLDERS = systemConfig.CATCH_HTML_FILES_FOLDERS;
    const MAX_SIZE_CATCH_FILES = systemConfig.MAX_SIZE_CATCH_HTML_FILES;
    const BASE_URL = process.env.MODE === "PROD" ? systemConfig.BASE_URL_CATCH_FILES_PROD : systemConfig.BASE_URL_CATCH_FILES_DEV;
    let max_size_catched = 0

    let folders_len = FOLDERS.length;
    if(folders_len <= 0){
        return;
    }

    for(let i=0; i<folders_len; i++){

        let language = systemConfig.MAIN_LANGUAGE
        let dir_url;
        let arr = FOLDERS[i].split('-')
        let files = null;
        let files_len = 0;

        
        if(systemConfig.HAS_MULTI_LANGUAJES){

            language = arr[arr.length-1]
            dir_url = BASE_URL + FOLDERS[i] + '/'
            files = readdirSync(dir_url);
            files_len = files.length

        }else{
            // SI ES EL PRINCIPAL, DEJAMOS SEGUIR
            if(arr[arr.length-1] === systemConfig.MAIN_LANGUAGE){
                dir_url = BASE_URL + FOLDERS[i] + '/'
                files = readdirSync(dir_url);
                files_len = files.length
            
            //  ALTAMOS ESTA CARPETA   
            }else{
                files_len = 0
            }
        }

        // lEEMOS LOS ARCHIVOS DEL DIRECTORIO
        // const dir_url  = BASE_URL + FOLDERS[i] + '/'
       
        while(files_len --){
            // console.log(FOLDERS[i])
            const file_url = dir_url + files[files_len]
            const stats = statSync(file_url);
            max_size_catched += stats.size;

            if(languages[language]){

                // CACHEO EN ESPAÑOL O INGLES SEGUN CORRESPONDA
                languages[language].HTML_FILES_CACHED[files[files_len]] = Buffer.alloc(stats.size, readFileSync(file_url))
    
                // if(language === systemConfig.LANGUAGE_EN){
                //     htmlFilesCachedEN[files[files_len]] = Buffer.alloc(stats.size, readFileSync(file_url))
                // }else{
                //     htmlFilesCachedES[files[files_len]] = Buffer.alloc(stats.size, readFileSync(file_url))
                // }
                
                if(max_size_catched > MAX_SIZE_CATCH_FILES){
        
                    files_len = 0
                }
                
            }else{
               console.log("QUEREMOS CACHEAR ESTATICOS DE UN IDIOMA QUE NO ESTA PREVISTO")
            }

        }
        if(max_size_catched > MAX_SIZE_CATCH_FILES){
    
            i = folders_len
        }
    }
    
    
    console.log("HTML_FILESCATCHED_ES: " + Object.keys(htmlFilesCachedES).length)
    console.log("HTML_FILESCATCHED_EN: " + Object.keys(htmlFilesCachedEN).length)
    
    console.log({max_size_catched})






}