
import systemConfig from "../../globalData/systemConfig.js"
import { readdirSync, readFileSync, stat, statSync }  from  'node:fs'
import staticsFilesCached from "../../globalData/staticsFilesCached.js"
import {Buffer} from 'node:buffer'

export default ()=>{

    console.log('Catch Statics Files !!!')

    if(!systemConfig.CATCH_FILES_FOLDERS){
        return;
    }
        
    const FOLDERS = systemConfig.CATCH_FILES_FOLDERS;
    const MAX_SIZE_CATCH_FILES = systemConfig.MAX_SIZE_CATCH_STATIC_FILES;
    const BASE_URL = process.env.MODE === "PROD" ? systemConfig.BASE_URL_CATCH_FILES_PROD : systemConfig.BASE_URL_CATCH_FILES_DEV;
    let max_size_catched = 0

    let folders_len = FOLDERS.length;
    if(folders_len <= 0){
        return;
    }

    for(let i=0; i<folders_len; i++){

        // lEEMOS LOS ARCHIVOS DEL DIRECTORIO
        const dir_url  = BASE_URL + FOLDERS[i] + "/"
        const files = readdirSync(dir_url);
        let files_len = files.length
        while(files_len --){
            // console.log(FOLDERS[i])
            const file_url = dir_url + files[files_len] 
            const stats = statSync(file_url);
            max_size_catched += stats.size;

            staticsFilesCached[files[files_len]] = Buffer.alloc(stats.size, readFileSync(file_url))
            if(max_size_catched > MAX_SIZE_CATCH_FILES){
    
                files_len = 0
            }
        }
        if(max_size_catched > MAX_SIZE_CATCH_FILES){
    
            i = folders_len
        }
    }
    
    
    // console.log(staticsFilesCached)
    console.log("STATICS_FILES_CATCHED: " + Object.keys(staticsFilesCached).length)
    
    console.log({max_size_catched})


}