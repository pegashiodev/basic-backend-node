
/**
 *  CREA NUEVA SESSION LOS LOS DATOS DEL USER
 * 
 */



import {ObjectId} from "mongodb";
import systemConfig from "../globalData/systemConfig.js";



export default  (req)=>{
    // console.log(user)

    let user = req.user;
    
    const now = Date.now()
    const [week_day, month, day, year, time] = new Date().toString().split(' ')

    let session = {
        // _id: user.userId,
        _id: new ObjectId().toHexString(),
        userId: user.userId,
        type: user.type,
        atk: req.accessData.atk,
        atk_expireTime: req.accessData.expireTime,
        rtk: req.refreshData.rtk,
        rtk_expireTime: req.refreshData.expireTime, 

        date: {
            year: year,
            month: month.toLowerCase(),
            day: day,
            since: now
        },
        userDevices: user.userDevices,
        name: user.name,
        nick: user.nick || undefined,
        saldoMoney: user.saldoMoney,
        saldoAds: user.saldoAds,
        saldoCoins: user.saldoCoins,
        credentials: user.credentials || undefined,
        isMaster: user.isMaster,
        masterId: user.masterId || undefined,
        masterData: user.masterData || undefined,
        masters: user.masters,
        fa2: user.fa2 || {},
        notifications: user.notifications || {},
        subscription: user.subscription,
        subscription_expireTime: user.subscription_expireTime,
        comercial_name: user.comercial_name || undefined,
        role: user.role || undefined,
        email: user.email,
        ip: user.ip || undefined,
        language: user.language || 'es',
        country: user.country || undefined,
        start: now,
        expireTime: now + systemConfig.TOKENS_AGE.SESSION_DURATION,
        last_time: now,
        status: user.status, // 'ACTIVE' // 'HACKED' // 'ENDED' // 'BLOCKED' -> por si hay que anularla 
        cart: user.cart || [],
        favorites: user.favorites || [],
        preferences: user.preferences || [],

        navigate: [] ,       // urls por las que navega
        actions:  [],        // pagos, ingresos, ...
        //automates: user.automates || []       // Automatizaciones creadas
    
    }

    if(!systemConfig.HAS_2FA && !systemConfig.HAS_2FA_SIGNUP){
        session.id_verify_email = user.id_verify_email || undefined;
        session.id_verify_expireTime = user.id_verify_expireTime || now + systemConfig.TOKENS_AGE.EMAIL_VERIFICATION_AGE;
    }
    return {session:session};

}