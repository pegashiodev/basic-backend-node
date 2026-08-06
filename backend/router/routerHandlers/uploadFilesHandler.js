
/**
 * 
 *  - ESTO ESTA SIN  TERMINAR !!!!! 
 * 
 */


import sendStaticFile from "../../server/serverHandlers/sendStaticFile.js"

/**
 * 
 * @param {object} Objeto Request de NodeJS
 * @param {object} Objeto Response de NodeJS
 * 
 */
export default (req, res)=>{
    
    console.log("uploadFilesHandler.js !!")

    console.log(req.has_cookie)
    console.log(req.tokens)
    console.log(req.our_cookie)
    console.log(req.set_new_cookie)
    console.log(req.cookie_parsed)
    console.log(req.data)


    if(req.method === "GET"){

        // SERVIMOS EL ESTATICO
        if(req.set_new_cookie){
            res.code = 200,
            res.headers = {
                'Content-type': "text/html",
                'Set-Cookie': req.cookie
            }
        }else{

            res.code = 200,
            res.headers = {
                'Content-type': "text/html",
            }
        }
        // en req.data ya esta el endpoint, filename y ext
        return sendStaticFile(req, res)
    
    
    }else if(method === "POST"){


        console.log("uploadFilesHandler, POST esta sin terminar")
        res.end("ESta sin terminar de hacer")
    }






}