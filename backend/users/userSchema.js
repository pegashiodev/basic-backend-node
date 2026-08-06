
/**
 * 
 *      CREAMOS UN USUARIO EN EL SIGNUP
 * 
 */




import {ObjectId} from "mongodb"
import  {randomUUID, sign} from 'crypto'
import systemConfig from "../globalData/systemConfig.js"

const days = ["mon", "tue", "wen", "thu", "fri", "sat", "sun"]

/**
 * @param {Object} -> Body de la POST Request
 * @returns {Object} -> user
 */
export default  (body)=>{
    const now = Date.now()
    const id = new ObjectId().toHexString();
    
    let user = {
        _id: id,
        userId: id,
        id2: randomUUID(),      // UN SEGUNDO ID PARA OTRAS COSAS
        type: "BASIC",          //  ['EMPLOYEE','MASTER', 'PRO']
        // userToken: "",
        status:  systemConfig.STATUS.ACTIVE,                // ['ACTIVE', 'PAUSED', 'BLOCKED'  ] 
        signup_method: body.access_method || "USER-EMAIL",  // ["GOOGLE-EMAIL", "GITHUB", ...]
        name: body.name,
        lastName: body.lastName || undefined,
        nick: body.nick || undefined,
        comercial_name: body.comercial_name || undefined,
        email: body.email,
        role: 'USER',               //  USER / ADMIN / MASTER / ... 
        userDevices: [],      // {userAgent:"", deviceId: "", status:""}
        credentials: [],
        language: body.language || undefined,
        country: body.country || undefined,
        pin: body.pin || undefined,         // PIN PARA ACCEDER A LA WEB TRAS MINUTOS DE INACTIVIDAD
        password: body.password,
        nif: body.nif || undefined,
        phone: {
            phoneCountry: body.phoneCountry || undefined,
            phoneNumber: body.phoneNumber || undefined, 
        },
        fa2: {
            notify_mode: ["email"],             // COMO LE NOTIFICAMOS EL FA2
            endpoints: []
        },
        company: undefined,                     // COMPAÑIA A LA QUE PERTENECE EL EMPLEADO
        // SALDOS DEL USUARIO
        saldoMoney: body.saldoMoney || 0,       // SALDO EN EUROS O DOLARES
        saldoCoins: body.saldoCoins || 0,       // SALDO EN COINS
        saldoAds: body.saldoAds || 0,           // OTRO SALDO POR CONSUMIR ANUNCIOS

        subscription: undefined,               // TIPO DE SUSCRIPCION ( FREEMIUM, PREMIUM, ... )
        subscription_expireTime: undefined,
        
        // FECHA DE ALTA DEL USUARIO: USAMOS ESTOS DATOS PARA LOS NOMBRES DE SUS BASES DE DATOS O COLECCIONES
        since: now,
        since_year: new Date(now).getFullYear(),
        since_month: new Date(now).getMonth(),
        since_day_number: new Date(now).getDate(),
        since_day_week: days[new Date(now).getDay()],

        ip_signup: body.ip,
        ip_signup_country: body.ip_signup_country || undefined,
        // VIAS PARA NOTIFICAR AL USUARIO
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
        billing_address: [],
        shipping_address: [],
        
    }
    // Si no codigos de verificacion, almacenamos el token que se envia en el link 
    // del correo
    // SI TENE 2FA se envia un codigo al email para el signup y ya no 
    // hay que hacer una verificacion explicita del email
    if(!systemConfig.HAS_FA2 && !systemConfig.HAS_FA2_SIGNUP){
        user.id_verify_email = body.id_verify_email;
        user.id_verify_expireTime = body.id_verify_expireTime || now + systemConfig.TOKENS_AGE.EMAIL_VERIFICATION_AGE;
        user.status = systemConfig.STATUS.EMAIL_NOT_VERIFIED;   // se verifica desde el link que le enviamos al email
    }
    // AÑADIMOS DIRECCION DE FACTURACION SI LA HAY
    if(body.billing_address){
        const address = {
            status: "ACTIVE",
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