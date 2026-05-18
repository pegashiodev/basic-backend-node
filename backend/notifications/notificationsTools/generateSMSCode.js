


import systemConfig from "../../globalData/systemConfig.js"
import verificationSMS from "../../globalData/verificationSMS.js"


export default (data, user)=>{



    if(data.task === "BIZUM_PHONE_VERIFICATION"){

        let sms_message = ""
        const sms_token = "AABBCC"
        // sms_token += Math.random().toString().slice(2,8)

        sms_message += `El código para verificar su número de Teléfono es: ${sms_token}` ;
        
        if(user.email){
            sms_token = user.email + "_"
        }
        // email_user@gmail.com_RANDOM-CODE = {}
            
        verificationSMS[sms_token] = {
            sms_token: sms_token,
            expireTime: Date.now() + systemConfig.TOKENS_AGE.SMS_TOKEN,
            purpose: data.task,
            used: false
        }
        return sms_message;


    }else if(data.task === "SEND_SMS_CODE_VERIFICATION"){
        
        // const sms_token = Math.random().toString().slice(2,8)

        
        return "SMSVERIFICATION"
    }

}