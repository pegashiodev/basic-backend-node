
/**
 * 
 *  cada ruta de verificacion tiene si propio manejador
 *      
 *      -email
 *      - phone
 *      - pays
 *      - doble check
 *      - ...
 * 
 * 
 * 
 */



import emailVerificationHandler from "./routerHandlers/emailVerificationHandler.js";
import renovePasswordHandler from "./routerHandlers/renovePasswordHandler.js"
import sendStaticFile from "../server/serverHandlers/sendStaticFile.js";
import recoveryAccountHandler from "./routerHandlers/recoveryAccountHandler.js";
import siteStats from "./routerTools/siteStats.js";



const endpoints_handlers = {

    // LAS ELIMINAMOS PORQUE TENEMOS FA2 EN EL SIGNUP Y NO SE HACE ESTA VERIFICACION DEL EMAIL
    //'email-verification': emailVerificationHandler,
    //'email-verification.html': emailVerificationHandler,


    "renove-password": renovePasswordHandler,
    "renove-password.html": renovePasswordHandler,
    "recovery-account" : recoveryAccountHandler,
    "recovery-account.html": recoveryAccountHandler

}

export default function (req, res){
    console.log(req.urlData)

    if(!endpoints_handlers[req.urlData.endpoint]){
        console.log('No ha manejador para este endpoint !!!')

        res.code = 404,
        sendStaticFile(req, res)
        return;
        
        
    }
    // Marcamos que ha se ha verificado que es un verification_endpoint

    req.verification_endpoint_access_verified = true;


    siteStats(req)

    endpoints_handlers[req.urlData.endpoint](req, res);
}


