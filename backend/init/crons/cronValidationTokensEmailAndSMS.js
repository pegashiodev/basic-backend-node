
/**
 * 
 *      RECORRE LOS validationTokens CACHEADOS
 *      ** DE ENVIO DEL TOKEN POR SMS
 *      ** DE ENVIO DEL TOKEN POR EMAIL
 * 
 *      Y BORRA LOS CADUCADOS
 * 
 *      SI HAN SIDO USADOS O REVISADOS EN EL LOGIN O SIGNUP YA SE BORRARON ALLI 
 * 
 */



import validationTokens from "../../globalData/validationTokens.js"
import verificationSMS from "../../globalData/verificationSMS.js";


export default ()=>{

    console.log("CRON Validations Tokens [EMAIL && SMS]")

    let items = Object.keys(validationTokens)
    let len = items.length;
    const now = Date.now()
    // SI EXPIRADOS -> BORRAMOS: SI YA USADOS O REVISADOS YA SE HAN BORRADO
    while(len--){

        if(validationTokens[items[len]].expireTime < now){
            delete validationTokens[items[len]]

        }

    }

    items = Object.keys(verificationSMS)
    len = items.length;

    while(len--){

        // SI USADO O EXPIRADO LO BORRAMOS
        if(verificationSMS[items[len]].expireTime < now || verificationSMS[items[len]].used){
            delete verificationSMS[items[len]]

        }

    }
}