


import sendStaticFile from "../server/serverHandlers/sendStaticFile.js";



const endpoints_handlers = {

    

}

export default function (req, res){

    if(!endpoints_handlers[req.urlData.endpoint]){
        res.code = 404,
        sendStaticFile(req, res)
        
    }

    endpoints_handlers[req.urlData.endpoint](req, res);
}


