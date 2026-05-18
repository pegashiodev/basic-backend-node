



/**
 * 
 *      @param
 *      data: {
 *          task, sender, destination, name, lastName, await
 *      }, 
 *      @param
 *      user: { // al menos
 *          email: 
 *          ...      
 *      }
 * 
 *      - DESDE AQUI SE GENERAN LOS CODIGOS DE VALIDACION Y DE VERIFICACION
 *      enviamos un email al user
 *      y almacenamos el codigo en 
 *          - user (catch y DB) -> El nº de Telefono
 *          - usersByEmail
 */


import { PinpointSMSVoiceV2Client, SendTextMessageCommand } from "@aws-sdk/client-pinpoint-sms-voice-v2";
import userHandler from "../users/userHandler.js"

process.loadEnvFile();

const config = {
    region: process.env.AWS_SMTP_REGION,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_PRIVATE_KEY
    }
}

const client = new PinpointSMSVoiceV2Client(config)


export default async (data, user)=>{

    console.log("SEND SMS !!")

    // ENVIAMOS UN CODIGO SMS AL TELEFONO FACILITADO PARA VERIFICAR SU NUMERO
    // ESTE TELEFONO HAY QUE GUARDARLO EN USER
    // HAY QUE GUARDARLO EN CACHE PARA VERIFICARLO CUANDO DE INTRODUZCA
    if(data.task === "BIZUM_PHONE_VERIFICATION"){
        const sms_data = {
            DestinationPhoneNumber: data.destination,
            // messageBody: generateSMSCode(data, user),
            messageBody: "PRUEBASMS",
            messageType: "TRANSACTIONAL",

        }
        const params = setSMSParams(sms_data)
        const result_send_sms = await sendSMS(params)

        console.log(result_send_sms)
        return result_send_sms;

        // const update_user = {
        //     user: user,
        //     task: "UPDATE_PHONE_NUMBER",
        //     new_value: {
        //         phoneCountry: data.phoneCountry,    // CODIGO ALFANUMERICO "ES" ??? 
        //         phoneNumber: data.phoneNumber       // YA LLEGA CON EL COUNTRY -> +34619XXXXXX

        //     }
        // }
        // userHandler.updateUser()

    // ENVIAMOS UN SMS PARA VERICFICAR ALGO: PAGO, ACCESO A UN ENDPOINT, ...
    // ESTE CODIGO HAY QUE GUARDARLO EN CACHE PARA VERIFICAR 
    }else if(data.task === "SEND_SMS_CODE_VERIFICATION"){


    }


}

const setSMSParams = (data)=>{

    
    const input = { // SendTextMessageRequest
        DestinationPhoneNumber: "+34619200763", // required
        // OriginationIdentity: "arn:aws:sms-voice:eu-west-1:640150338389:sender-id/CL-PRUEBAS/ES",
        OriginationIdentity: process.env.AWS_SMS_ARN_OriginationIdentit,

        MessageBody: data.messageBody,
        MessageType: data.messageType,
        //   Keyword: "STRING_VALUE",
        //   ConfigurationSetName: "STRING_VALUE",
        //   MaxPrice: "0.01",
        // TimeToLive: Number("int"),
        Context: {},// ContextMap
        //     "<keys>": "STRING_VALUE",
        // },
        DestinationCountryParameters: {},// DestinationCountryParameters
        //     "ES": "IN_ENTITY_ID",
        //   },
        DryRun: false,
        //   ProtectConfigurationId: "STRING_VALUE",
        //  MessageFeedbackEnabled: true || false,
    };
    return  new SendTextMessageCommand(input);
}

const sendSMS = async (params)=>{

    try{

        let response = await client.send(params);
        // response.messageId = chunk con el id del mensaje
        response.status = "ok"
        return response;

    }catch(error){

        return {status: "error", message: error}

    }
    
}



