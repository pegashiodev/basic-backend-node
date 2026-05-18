


import systemConfig from "../../globalData/systemConfig.js"
import {decodeToken} from "../../tools/tokenGenerator.js"
import sendEmail from "../../notifications/sendEmail.js"

// HE EXPIRADO UN EMAIL QUE ENVIAMOS PARA ALGUNA TAREA Y ENVIAMOS OTRO

export default async(req, res)=>{

    console.log("EXPIRED_ENDPOINT")

    console.log(req.body)
    console.log(req.headers)
    return;

    // LOS DATOS DEL USER HAY QUE SACARLOS DE LA COOKIE -> HA DE HABERSE LOGEADO
    

    const url_token = req.body.url_params.split('=')[1]
    console.log(url_token)
    const {email, name, lastName, tokenId} = JSON.parse(decodeToken(url_token))
    console.log(email, name, lastName, tokenId)


    
    let data_email = {
        task: "SEND_ID_EMAIL_VERIFICATION_AGAIN",
        email: email,
        name: name,
        lastName: lastName,
        from: "EXPIRED_ENDPOINT",
        await: true
    }    

    // if(req.body.endpoint === "/email-verification/"){
    //     data_email.
    // }

    const result_email = await sendEmail(data_email);

    if(result_email.status !== 'ok'){
        console.log('Error en el Envio del Email')
        const response_data = {
            code: 250,
            status: 'error',
            message: 'ERROR EN EL ENVÍO DEL EMAIL',
            location: systemConfig.PAGES.ACCESS_PLATFORM,
        }

        // colocamos un 250 para no entrar en el Catch del fetch
        res.writeHead(250, { 'Content-Type': 'application/json' }); 
        res.end(JSON.stringify(response_data))
        return
    }

    const response_data = {
        status: 'ok',
        code: 200,
        message: 'LE HEMOS ENVIADO UN NUEVO EMAIL',
        location: systemConfig.PAGES.ACCESS_PLATFORM,
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response_data))
    return


}