

/**
 * 
 * 
 *  EL USER HA CLICADO EN QUE "FORGOT PASSWORD"
 * 
 *      LE ENVIAMOS UN EMAIL CON UNA URL + URL_TOKEN 
 *      PARA CAMBIAR EL PASSWORD
 * 
 */



// import generateVerificationEndpoint from "../../tools/generateVerificationEndpoint.js";
import sendEmail from "../../notifications/sendEmail.js";
import systemConfig from "../../globalData/systemConfig.js";
import usersByEmail from "../../globalData/usersByEmail.js";


export default async function(req, res){

    const from = "FORGOT_PASSWORD"

    if(!req.body.email){
        console.log('NO HAY EMAIL EN EL FORGOT-PASSWORD')
        const response_data = {
        status: systemConfig.STATUS.ERROR_FETCH,
        message: 'EMAIL INCORRECTO',
        code: 435
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }

    if(!usersByEmail[req.body.email]){
        console.log('NO HAY USUARIO CON ESE EMAIL')
        const response_data = {
        status: systemConfig.STATUS.ERROR_FETCH,
        message: 'EL EMAIL NO PERTENECE A NINGUN USUARIO',
        code: 436
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }
    
    req.user = usersByEmail[req.body.email]

    // HAY QUE ENVIAR UN EMAIL CON LA URL /renove-password/ + url_token con los datos del usuario

    // const data_gen_endpoint = {
    //     email: req.body.email,
    //     name: req.body.name,
    //     lastName: req.body.lastName,
    //     from: "FORGOT_PASSWORD",
    //     await: true
    // }
    // const gen_url_token = await generateVerificationEndpoint(data_gen_endpoint);
 
    // if(gen_url_token.status !== "ok"){
    //     console.log("ERROR generando el url_toke")
    //     res.code = 500
    //     res.headers = {}
    //     if(!req.data){
    //         req.data = {}
    //     }
    //     req.data.fileName = systemConfig.PAGES.SEND_EMAIL_ERROR
    //     req.data.ext = systemConfig.EXTENSION_STATIC_VIEWS
    //     return sendStaticFile(req, res)
    // }

    // ENVIAR EMAIL --> 
    let data_email = {
        // ... data_gen_endpoint, 
        task: "SEND_FORGOT_PASSWORD_EMAIL",
        from: "FORGOT_PASSWORD", 
        await: true, 
    }

    const result_email = await sendEmail(data_email, req.user);

    if(result_email.status != 'ok'){
        console.log('Error en el Envio del Email')
        const response_data = {
            status: 'error',
            message: 'ERROR EN EL ENVIO DEL EMAIL',
            code: 535
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }
    const response_data = {
        status: 'ok',
        message: 'LE HEMOS ENVIADO UN EMAIL PARA EL CAMBIO DE CONTRASEÑA',
        code: 200,
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response_data))
    return;
}