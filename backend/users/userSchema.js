

/**
 * ESQUEMA / MODELO DE USUARIO
 */
import {ObjectId} from "mongodb"
import { randomBytes } from 'node:crypto';
import systemConfig from '../globalData/systemConfig.js';
import { updateAffiliatePromotion } from '../affiliates/affiliateService.js';

export default async function userSchema(body) {

    const [, month, day , year] = new Date().toString().split(' ');
    const userId = new ObjectId();
    const id2 = randomBytes(16).toString('hex');
    const normalizedMonth = month.toLowerCase();
    const normalizedEmail = body.email.toLowerCase().trim();
    const userIdString = userId.toString()

   
    const date = new Date()

    // 3. Estructura completa del documento
    const user = {
        _id: userId,
        userId: userId,
        userIdString: userIdString,
        id2: id2,
        name: (body.name || '').trim(),
        nick: (body.nick || '').trim(),
        channelName: (body.channelName || '').trim(),
        email: normalizedEmail,
        password: body.password,        
        signupIp: body.ip,
        
        status: 'ACTIVE',           // [ PAUSED, BLOCKED, ]
        role: 'USER',                // [EMPLOYEE_PYME, ADMIN, ADMIN_PYME, AFILIATE]  
        
        createdAt: date,
        createdAtTimestamp: date.getTime(),
        //userDevices: initialDevices,
        isPromoAffiliate: body.promotion ? true : false,
        affiliateData: body.promotion?.affiliate || null,
       
        coinsCreate: body.promotion?.coins?.create ?? 0,           // CREAR CONTENIDOs: ENTRVISTA, AUDIO, IMAGENES, ....
        coinsTraining: body.promotion?.coins?.training ?? 0,       // ENTRENAR CREAR AUDIOS, ...
        coinsCoaching: body.promotion?.coins?.coaching ?? 0,       // CONSULTAR DUDAS CREATIVAS ....
        coinsGenerator: body.promotion?.coins?.generator ?? 0,
        coinsAudio: body.promotion?.coins?.audio ?? 0,
        coinsImages: body.promotion?.coins?.images ?? 0,
        coinsVideo: body.promotion?.coins?.video ?? 0,

        saldoAds: body.saldoAds ?? 0, 
        saldoMoney: body.saldoMoney ?? 0,
    };

    if(systemConfig.HAS_PROMO_CODES_SIGNUP && body.promotion){
        await updateAffiliatePromotion(body.promotion, user)
       
    }

    return user;
}