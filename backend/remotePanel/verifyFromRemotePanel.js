
/**
 * 
 *      REcibe una peticion para porder verificar una accionn desde el remote panel
 * 
 *      - Enviaremos un sms o un email con un codigo
 * 
 */


import sendEmail from "../notifications/sendEmail.js";
import sendSMS from "../notifications/sendSMS.js"

export default function(req, res){
    
    console.log("En verifyFromRemotePanel")
    console.log(req.body)

    const response_data = {
        status: "ok",
        message: "Hemos enviaso un SMS"
    }
    res.writeHead(200, { 'Content-Type': 'application/js' });
    return res.end(JSON.stringify(response_data))

    

    
}