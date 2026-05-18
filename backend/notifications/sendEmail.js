



/**
 * 
 *  data: {
 *      task, email, name, lastName, from, url_token, await
 * }, 
 * from = 'LOGIN, SIGNIN, HACKED, 
 * 
 *      - DESDE AQUI SE GENERAN LOS CODIGOS DE VALIDACION Y DE VERIFICACION
 *      enviamos un email al user
 *      y almacenamos el codigo en 
 *          - usersByEmail
 *          - user (catch y DB)
 *          - session del usuario (catch y DB)
 * 
 * 
 */

import systemConfig from '../globalData/systemConfig.js';
import generateVerificationEndpoint from './notificationsTools/generateVerificationEndpoint.js';
import generateValidationToken from './notificationsTools/generateValidationToken.js';
process.loadEnvFile();

import { SendEmailCommand, SESClient} from "@aws-sdk/client-ses";
const REGION = process.env.REGION;
// Create SES service object.
const sesClient = new SESClient({ 
  region: process.env.AWS_SMTP_REGION,
  credentials:{
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_PRIVATE_KEY
}});



export default async (data, user)=>{        // {task, name, email, lastName, url_tokren, await}

    console.log('IN SendEmail !!!!')
    // console.log(data)
    // console.log({usersByEmail})

    if(data.task === "SEND_VALIDATION_TOKEN"){
        // ENVIAMOS UN EMAIL A data.email con el token para terminar el signup
        
        const validation_token = generateValidationToken(user);
        // token: validation_token.token,
        // token_expireTime: validation_token.expireTime,

        const data_email = {
            sender: systemConfig.EMAIL_NOT_REPLY_SENDER,
            subject: "CONSULTA LEGAL: CODIGO DE ACCESO",
            emails: [data.email],
            name: data.name,
            body_type: "html",
            
        }

        // ESTOS DATOS NO PUEDEN SER NULL, SINO HABRA ERROR EN EL ENVIO DEL EMAIL 
        if(!data.email || !data.name){
            return {ststus: "error", mesage: "Datos incompletos: name or validation_token.token"}
        }

        if(data.from === "SIGNUP"){

            data_email.body_data = 
            `<p>Hola ${data.name}:</p>
            <p style="margin-bottom: 20px;">Te damos la bienvenida a Consulta Legal.<br> A continuacion te facilitamos el código de verificación para completar la creación de la cuenta</p>
            <div style="width: 320px;height: auto; border: 1px solid plum;border-radius: 12px;margin: 0 auto;text-align: center;background-color:aliceblue;">
                <h2 style="text-align: center;">ConsultaLegal</h2>
                <h3 style="text-align: center;">Codigo de Verificacion</h3><hr>
                <h1 style="font-weight: bold;">${validation_token.token}</h1>
            </div>
            <p style="text-align: center;">Mas texto</p></div>`
        
        }else if(data.from === "LOGIN"){

            data_email.body_data = 
            `<p>Hola ${data.name}:</p>
            <p style="margin-bottom: 20px;">Te damos la bienvenida a Consulta Legal.<br> A continuacion te facilitamos el código de verificación para Iniciar Sesión</p>
            <div style="width: 320px;height: auto; border: 1px solid plum;border-radius: 12px;margin: 0 auto;text-align: center;background-color:aliceblue;">
                <h2 style="text-align: center;">ConsultaLegal</h2>
                <h3 style="text-align: center;">Codigo de Verificacion</h3>
                <hr><h1 style="font-weight: bold;">${validation_token.token}</h1>
            </div>
            <p style="text-align: center;">Mas texto</p></div>`
        
        }else if(data.from === "ACCESS_REMOTE_PANNEL"){
           
            data_email.body_data = 
            `<p>Hola ${data.name}:</p>
            <p style="margin-bottom: 20px;"> A continuacion te facilitamos el código de verificación para ACCEDER AL PANNEL </p>
            <div style="width: 320px;height: auto; border: 1px solid plum;border-radius: 12px;margin: 0 auto;text-align: center;background-color:aliceblue;">
                <h2 style="text-align: center;">ConsultaLegal</h2>
                <h3 style="text-align: center;">Codigo de Verificacion</h3>
                <hr><h1 style="font-weight: bold;">${validation_token.token}</h1>
            </div>
            <p style="text-align: center;">Mas texto</p></div>`
            
            // ESTE CODIGO SOLO SE ENVIA A UNOS DETERMINADOS EMAILS
            data.emails = systemConfig.EMAILS_TO_SEND_ACCESS_CODES
        }

        const params = setEmailParams(data_email)
        const result = await sendEmail(params)
        return result;

        // return {status: 'ok', message: "Email con validation Token Enviado"}   

    }else if(data.task === "SEND_ID_EMAIL_VERIFICATION"){
        
        let id_verify_email, id_verify_expireTime;
        const endpoint = data.endpoint + `?tk=${data.url_token}`
        console.log(`ENDPOINT ENVIADO POR EMAIL:  https://midominio.com${endpoint}`)
        // IMPORTANTE
        // En data.url_token esta la url que hay que hay que colocar en la url del email
        // midominio.com/email-verification?tk=url_token
        // body: "Haz clic en este enlace para confirmar tu email -> https://midominio.com/email-verification/?tk=data.url_token"

        // id_verify_email = randomUUID();           

        id_verify_email = '12345';           
        id_verify_expireTime = Date.now() + systemConfig.TOKENS_AGE.EMAIL_VERIFICATION_AGE;
        return {status: 'ok', message: '', id_verify_email: id_verify_email, id_verify_expireTime: id_verify_expireTime}   


    }else if(data.task === 'SEND_USER_HACKED_ALERT'){
        const data_gen_endpoint = {
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            from: "HACKED",
            await: true
        }
        const gen_url_token = await generateVerificationEndpoint(data_gen_endpoint);
        
        const data_email = {
            sender: systemConfig.EMAIL_NOT_REPLY_SENDER,
            subject: "CONSULTA LEGAL: CAMBIO DE CONTRASEÑA",
            emails: [user.email],
            name: user.name,
            body_type: "html",
            body_data: `<p>Hola ${user.name}:</p>
            <p style="margin-bottom: 20px;">HEMOS DETECTADO UN TRAFICO INCORRECTO DESDE TU CUENTA. TE ENVIAMOS UN LINK PARA EL CAMBIO DE LA CONTRASEÑA. ANTES DEBERAS BORRAR LAS COOKIES DE TU NAVEGADOR PARA LIMPIAR LAS SESSIONES ANTERIORES. LO PUEDES HACE BORRANDO EL HISTORIAL.</p>
            <div style="width: 320px;height: auto; border: 1px solid plum;border-radius: 12px;margin: 0 auto;text-align: center;background-color:aliceblue;">
                <h3>ConsultaLegal</h3>
                <h2 style="text-align: center;"><a href ="${gen_url_token.endpoint}">Cambiar Contraseña</a></h2>
            </div>
           <p style="text-align: center;">SI NO HAS SIDO TU NO HAGAS USO DE ESTE ENLACE</p>`

        }
        const params = setEmailParams(data_email)
        
        if(data.await){
            const result = await sendEmail(params)
            return result;
        }else{
            sendEmail(params)
            return;
        }
     

    }else if(data.task === 'SEND_ID_EMAIL_VERIFICATION_AGAIN'){
        
        const endpoint = data.endpoint + `?tk=${data.url_token}`
        console.log(`ENDPOINT ENVIADO POR EMAIL:  https://midominio.com${endpoint}`)
        
        let id_verify_email, id_verify_expireTime;
        id_verify_email = '67890';           
        id_verify_expireTime = Date.now() + systemConfig.TOKENS_AGE.EMAIL_VERIFICATION_AGE;
       
        if(data.await){
            return {status: 'ok', message: '', id_verify_email: id_verify_email, id_verify_expireTime: id_verify_expireTime}   
        }
        return;


    }else if(data.task === "SEND_FORGOT_PASSWORD_EMAIL"){

        const data_gen_endpoint = {
            email: user.email,
            name: user.name,
            lastName: user.lastName,
            from: "FORGOT_PASSWORD",
            await: true
        }
        const gen_url_token = await generateVerificationEndpoint(data_gen_endpoint);

        const data_email = {
            sender: systemConfig.EMAIL_NOT_REPLY_SENDER,
            subject: "CONSULTA LEGAL: CAMBIO DE CONTRASEÑA",
            emails: [user.email],
            name: user.name,
            body_type: "html",
            body_data: `<p>Hola ${user.name}:</p>
            <p style="margin-bottom: 20px;">Haz CLICK en el siguiente enlace para hacer el cambio de contraseña.</p>
            <div style="width: 320px;height: auto; border: 1px solid plum;border-radius: 12px;margin: 0 auto;text-align: center;background-color:aliceblue;">
                <h3 style="text-align: center;">ConsultaLegal</h3>
                <h2 style="text-align: center;"><a style="text-decoration: underline;" href ="${gen_url_token.endpoint}">CAMBIAR CONTRASEÑA</a></h2>
            </div>
            <p style="text-align: center;">SI NO HAS SIDO TU QUIEN HA REQUERIDO ESTA ACCIÓN NO HAGAS USO DE ESTE ENLACE</p>`

        }
      
        const params = setEmailParams(data_email)
        
        if(data.await){
            const result = await sendEmail(params)
            return result;
        }else{
            sendEmail(params)
            return;
        }
        
    
    // enviamos email de confirmacion de cambio de password
    }else if(data.task === "SEND_PASSWORD_UPDATE_SUCCESS"){

        
        const data_email = {
            sender: systemConfig.EMAIL_NOT_REPLY_SENDER,
            subject: "CONSULTA LEGAL: CAMBIO DE CONTRASEÑA",
            emails: [user.email],
            name: user.name,
            body_type: "html",
            body_data: `<p>Hola ${user.name}:</p><p style="margin-bottom: 20px;">Le confirmamos que hemos actualizado su clave de acceso</p>`

        }
        const params = setEmailParams(data_email)
        
        if(data.await){
            const result = await sendEmail(params)

            return {status: "ok", message: "Email enviado"}
        }else{
            sendEmail(params)
            return;
        }
    }

}



const setEmailParams = (data)=>{
    
    let params = {
        Source: data.sender,
        Destination: {
            ToAddresses: data.emails,       // es un []
        },
        Message: {
            Subject: {
                Data: data.subject
            },
            Body: {
                Html:{},
                Text:{}
            },
        },

    };

    if(data.body_type === "html"){
        params.Message.Body.Html = {
            Charset: "UTF-8",
            Data: data.body_data,
        }
        delete params.Message.Body.Text
    }else if(data.body_type === "text"){
        params.Message.Body.Text = {
            Charset: "UTF-8",
            Data: data.body_data,
        }
        delete params.Message.Body.Html
    }

  return new SendEmailCommand(params);
    
}

const sendEmail = async (params)=>{

    // const params = {
    //     Source: "pegashio70@gmail.com",
    //     Destination: {
    //         ToAddresses: emails
    //     },
    //     Message: {
    //         Subject: {
    //             Data: "Asunto de PRUEBA"
    //         },
    //         Body: {
    //             Html:{
    //                 Charset: "UTF-8",
    //                 Data:`<p>Hola ${"nombre-del-usuario"}:</p><p style="text-align: center;margin-bottom: 20px;">Te damos la bienvenida a Consulta Legal<br/> A continuacion te failitamos un codgo de verificación para completar la creación de la cuenta</p><div style="width: 320px;height: auto; border: 1px solid plum;border-radius: 12px;margin: 0 auto;text-align: center;background-color:aliceblue;"><p style="text-align: center;"><h2>${"NAME-PLATAFORMA"}</h2></p><hr><h3 style="text-align: center;">Codigo de Verificacion</h3><h1 style="font-weight: bold;">${"CODIGO-DEMO"}</h1></div><div style="max-width: 70%;border: 1px solid plum; margin: 0 auto; min-height: 400px; border-radius: 12px;margin-top: 20px;"><p style="text-align: center;">Mas texto</p></div>`
    //             },
    //             // Text: {
    //             //     Data: message,
    //             // }
    //         }
    //     }
    // }


    // console.log(params)
    try{
        // const result = await ses.sendEmail(params).promise();
        const result = await sesClient.send(params);
        console.log("Email Sent")
        result.status = "ok"
        // console.log(result)
        return result

    }catch(error){
        console.log("ERROR SENDING Email")
        const result = {status: "error"}
        console.log(error)
        return result


    }

}
