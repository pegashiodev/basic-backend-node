
/**
 * 
 *      CREAMOS UN USUARIO EN EL SIGNUP
 * 
 */




import {ObjectId} from "mongodb"
import  {randomUUID, sign} from 'crypto'
import systemConfig from "../globalData/systemConfig.js"

const days = ["mon", "tue", "wen", "thu", "fri", "sat", "sun"]

export default  (body)=>{
    const now = Date.now()
    const id = new ObjectId().toHexString();
    let user = {
        _id: id,
        userId: id,
        id2: randomUUID(),
        type: "BASIC",      //  ['MASTER', 'PRO']
        // userToken: "",
        status:  systemConfig.STATUS.ACTIVE,    // ['ACTIVE', 'EMAIL_NOT_VERIFIED', 'PAUSED', 'BLOCKED'  ] 
        name: body.name,
        lastName: body.lastName || undefined,
        nick: body.nick || undefined,
        comercial_name: body.comercial_name || undefined,
        email: body.email,
        fa2: {
            notify_mode: ["email"],
            endpoints: []
        },
        saldoMoney: body.saldoMoney || 0,
        saldoCoins: body.saldoCoins || 0,
        saldoAds: body.saldoAds || 0,
        subdcription: "FREEMIUM", // PREMIUM, ...
        isMaster: false,
        masterId: undefined,
        masterData: [],
        masters: [],                // SUSCRIPCIONES A LAS QUE PUEDE ESTAR ADHERIDO [SUS CONTENIDOS ENTRAN POR SUBDOMINIOS]
        role: 'USER',               //  USER / ADMIN / MASTER / ... 
        userDevices: [],      // {userAgent:"", deviceId: "", status:""}
        credentials: [],
        language: body.language || undefined,
        country: body.country || undefined,
        since: now,
        since_year: new Date(now).getFullYear(),
        since_month: new Date(now).getMonth(),
        since_day_number: new Date(now).getDate(),
        since_day_week: days[new Date(now).getDay()],
        ip_signup: body.ip,
        ip_signup_country: body.ip_signup_country || undefined,
        pin: body.pin || undefined,
        password: body.password,
        nif: body.nif || undefined,
        phone: {
            phoneCountry: body.phoneCountry || undefined,
            phoneNumber: body.phoneNumber || undefined, 
        },
        notifications: {
            email: body.email,
            phone: {
                phoneCountry: body.phoneCountry,
                phoneNumber: body.phoneNumber,
                
            },        // {country_code: "", number: ""}
            phoneChannel: body.phoneNotificationsChannel?.toLowerCase(),    // wathsapp / telegram / ...
            push_subscription: body.push_subscription || {},
            app_subscription: body.app_subscription || {},
        },

        favorites: [],
        preferencces: [],
        cart: [], 
        billing_address: [],
        shipping_address: [],
        automates: [],
        
    }
    // Si no codigos de verificacion, almacenamos el token que se envia en el link 
    // del correo
    // SI TENE 2FA se envia un codigo al email para el signup y ya no 
    // hay que hacer una verificacion explicita del email
    if(!systemConfig.HAS_2FA && !systemConfig.HAS_2FA_SIGNUP){
        user.id_verify_email = body.id_verify_email;
        user.id_verify_expireTime = body.id_verify_expireTime || now + systemConfig.TOKENS_AGE.EMAIL_VERIFICATION_AGE;
        user.status = systemConfig.STATUS.EMAIL_NOT_VERIFIED;   // se verifica desde el link que le enviamos al email
    }
    // AÑADIMOS DIRECCION DE FACTURACION SI LA HAY
    if(body.billing_address){
        const address = {
            street: body.billing_address.street,
            street_2: body.billing_address.street_2,
            cp: body.billing_address.cp,
            village: body.billing_address.village,
            city: body.billing_address.city,
            country: body.billing_address.country,
            phone: body.billing_address.phone,
            more_info: body.more_info
        }
        user.billing_address.push(address)
    }

    if(body.userDevice){
        user.userDevices.push(body.userDevice)
    }


    return user
}