
/**
 *  ESQUEMA DE LA SESION
 *  CREA NUEVA SESSION LOS LOS DATOS DEL USER
 * 
 */



import {ObjectId} from "mongodb";
import systemConfig from "../globalData/systemConfig.js";


/**
 * @param{Object} -> Obleto Request de NodeJs
 * @returns{object} -> session
 */
export default  (req)=>{

    let user = req.user;
    const now = Date.now()
    const [week_day, month, day, year, time] = new Date().toString().split(' ')

    let session = {
        _id: new ObjectId().toHexString(),
        userId: user.userId,
        type: user.type,
        // TOKENS DE LA COOKIE
        atk: req.accessData.atk,
        atk_expireTime: req.accessData.expireTime,
        rtk: req.refreshData.rtk,
        rtk_expireTime: req.refreshData.expireTime, 
        // FECHA DE LA SESION
        date: {
            year: year,
            month: month.toLowerCase(),
            day: day,
            since: now
        },
        // DATOS DEL USUARIO
        userDevices: user.userDevices,
        name: user.name,
        nick: user.nick || undefined,
        email: user.email,
        signup_method: user.signup_method || "USER-EMAIL",
        role: user.role || undefined,
        comercial_name: user.comercial_name || undefined,
        language: user.language || 'es',
        country: user.country || undefined,
        ip: user.ip || undefined,
        status: user.status, // 'ACTIVE' // 'HACKED' // 'ENDED' // 'BLOCKED' -> por si hay que anularla 

        // DISTINTOS SALDOS DE LA CUENTA DEL USUARIO
        saldoMoney: user.saldoMoney,
        saldoAds: user.saldoAds,
        saldoCoins: user.saldoCoins,

        credentials: user.credentials || undefined,
        fa2: user.fa2 || {},
        // METODOS DE NOTIFICACION
        notifications: user.notifications || {},
        // SUSCRIPCION DEL USUARIO
        subscription: user.subscription,
        subscription_expireTime: user.subscription_expireTime,
        // DURACION DE LA SESSION
        start: now,
        expireTime: now + systemConfig.TOKENS_AGE.SESSION_DURATION,
        
        last_time: now,                 // ULTIMA VEZ ACTIVO
        cart: user.cart || [],          // CARRITO
        favorites: user.favorites || [],        // FAVORITOS
        preferences: user.preferences || [],    // PREFERENCIAS DEL USUARIO

        navigate: [] ,       // urls por las que navega
        actions:  [],        // pagos, ingresos, ...
    
    }

    if(!systemConfig.HAS_FA2 && !systemConfig.HAS_FA2_SIGNUP){
        session.id_verify_email = user.id_verify_email || undefined;
        session.id_verify_expireTime = user.id_verify_expireTime || now + systemConfig.TOKENS_AGE.EMAIL_VERIFICATION_AGE;
    }
    return {session:session};

}