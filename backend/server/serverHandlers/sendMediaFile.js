
/**
 * 
 * MANEJADOR PARA EL ENVIO DE ARCHIVOS MEDIA: AUDIO, VIDEO, ...
 * 
 * ESTA SIN TERMINAR !!! 
 * 
 * - DE MOMENTO NO SE USA. PODEMOS USARLO PARA SERVIR LOS AUDIO POR WEBSOCKETS MAS ADELANTE ??? 
 * 
 * 
 */


import { createReadStream, existsSync, access, constants  }  from  'node:fs'




/**
 * 
 * @param {object} Objeto Request de NodeJS 
 * @param {object} Objeto Response de NodeJS
 * @returns 
 */
export const sendMediaFile = (data, res)=>{

    console.log("Sending Media File")
    
    const {pathname: filePath} = new URL('../../frontend/' + data.folder + data.fileName, import.meta.url);

    let readStream = createReadStream(filePath);
    // let stats = fs.statfsSync(filePath);
    // console.log(stats)
    res.writeHead(200, {'Content-Type': 'text/html'});
    readStream.on('data', data => res.write(data));
    readStream.on('close', () => res.end());

}