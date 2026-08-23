

/**
 * 
 * 
 *      EL USER HA SOLICITADO UN CAMBIO DE PASSWORD: "FORGOT PASSWORD"
 * 
 *          - nos envia un {body} con el email
 * 
 *      LE ENVIAMOS UN EMAIL CON UNA URL + URL_TOKEN 
 *      PARA CAMBIAR EL PASSWORD
 * 
 */

import sendEmail from "../../notifications/sendEmail.js";
import systemConfig from "../../globalData/systemConfig.js";
import generateVerificationEndpoint from "../../notifications/notificationsTools/generateVerificationEndpoint.js";
import userHandler from "../../users/userHandler.js";
import emailValidation from "../routerTools/emailValidation.js";

/**
 * 
 * @param {object} Objeto Request de NodeJS
 * @param {object} Objeto Response de NodeJS
 * 
 */
export default async function(req, res){

    const from = "FORGOT_PASSWORD"
    console.log("FORGOT PASSWORD !!!!")
    console.log(req.body)

    if(!req.body.email){
        console.log('NO HAY EMAIL EN EL FORGOT-PASSWORD')
        const response_data = {
        status: systemConfig.STATUS.ERROR_FETCH,
        message: 'FALTAN DATOS EN LA PETICION: EMAIL',
        code: 435
        }
        res.writeHead(435, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }

    if (!emailValidation(req.body.email)) {
        res.writeHead(415, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 415,
            message: 'Dirección de correo electrónico inválida.'
        }));
    }

    const normalizedEmail = req.body.email.trim().toLowerCase();
    req.user = await userHandler.getUserByEmail(normalizedEmail);

    if(!req.user){
        console.log('NO HAY USUARIO CON ESE EMAIL')
        const response_data = {
        status: systemConfig.STATUS.ERROR_FETCH,
        message: 'EMAIL INCORRECTO',
        code: 435
        }
        res.writeHead(435, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }

    // ENVIAMOS EMAIL PARA HACER EL CAMBIO DE PASSWORD 
    const validationEndpoint = await generateVerificationEndpoint(normalizedEmail);
    const lang = req.urlData?.language || systemConfig.MAIN_LANGUAGE || 'es';
console.log({validationEndpoint})
    
    const emailResult = await sendEmail({
        email: normalizedEmail,
        code: validationEndpoint,
        type: 'VERIFICATION_ENDPOINT',
        language: lang
    });

    if (emailResult && emailResult.status === 'error') {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 504,
            message: 'No se pudo enviar el correo de verificación.'
        }));
    }

    // RESPONDEMOS QUE LE HEMOS ENVIADO UN EMAIL CON UNA URL PARA CAMBIAR EL PASSWORD
    const response_data = {
        status: 'ok',
        message: 'LE HEMOS ENVIADO UN EMAIL PARA EL CAMBIO DE CONTRASEÑA',
        code: 200,
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response_data))
    return;
}