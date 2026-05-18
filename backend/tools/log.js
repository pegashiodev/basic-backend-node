


/***
 *      @param type [TIPO DE MENSAJE] : "INFO", "ERROR", "SAVE"  
 *      @param from [NOMBRE DEL FICHERO QUE LO ENVIA "fileName.js"]
 *      @param data [INFORMACION QUE ENVIA]
 * 
 * 
 */

import systemConsoleLogs from "../globalData/systemConsoleLogs.js"

export default function(from, data, type='INFO'){

    if(process.env.MODE === 'DEV'){

        if(type === "ERROR" || type === "SAVE"){

            return console.error({CONSOLE: type, from, data})
        
        }else{
            return console.log({CONSOLE:"INFO", from, data })
        }
   
    }

    if(type === 'ERROR' || type === "SAVE"){       

        systemConsoleLogs.push(
            {   from: from,
                data, data,
                // stamp: Date.now()
            }
        )
    }


}