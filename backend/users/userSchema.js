

/**
 * ESQUEMA / MODELO DE USUARIO
 */
import {ObjectId} from "mongodb"
import { randomBytes } from 'node:crypto';
import systemConfig from '../globalData/systemConfig.js';
import { updateAffiliatePromotion } from '../affiliates/affiliateService.js';

export default async function userSchema(body) {

    const [, month, day , year] = new Date().toString().split(' ');
    const userId = new ObjectId().toHexString();
    const id2 = randomBytes(16).toString('hex');
    const normalizedMonth = month.toLowerCase();
    const normalizedEmail = body.email.toLowerCase().trim();
    const customUserId = `us_${userId}_${normalizedMonth}}_${year}`

    // 1. _id compuesto inmutable (clave primaria de Mongo y puntero de Redis)
    const customId = {
        //_id: userUuid,
        userId: customUserId,
        email: normalizedEmail,
        from: {
            year: year,
            month: normalizedMonth,
            day: day
        },
        id2: id2
    };

    // 2. Dispositivo inicial si viene en la petición
    const initialDevices = [];
    if (body.deviceId && body.userAgent) {
        initialDevices.push({
            deviceId: body.deviceId,
            userAgent: body.userAgent,
            lastLogin: new Date()
        });
    }

    const date = new Date()
    // 3. Estructura completa del documento
    const user = {
        _id: customId,
        userId: customUserId,
        id2: id2,
        name: (body.name || '').trim(),
        nick: (body.nick || '').trim(),
        channelName: (body.channelName || '').trim(),
        email: normalizedEmail,
        password: body.password,        // Llega ya hasheada desde userHandler
        signupIp: body.ip,
        
        status: 'ACTIVE',
        role: 'USER',                   // [EMPLOYEE_PYME, ADMIN, ADMIN_PYME, AFILIATE]

        createdAt: date,
        createdAtTimestamp: date.getTime(),
        userDevices: initialDevices,
        isPromoAfiliate: body.promotion ? true : false,
        afiliateData: body.promotion?.owner || null,
        coins:{
            create: body.promotion?.coins?.create || 500,             // CREAR CONTENIDO: ENTRVISTA, AUDIO, IMAGENES, ....
            training: body.promotion?.coins?.training || 250,       // ENTRENAR CREAR AUDIOS, ...
            coaching: body.promotion?.coins?.coaching || 100,       // CONSULTAR DUDAS CREATIVAS ....
            generator: body.promotion?.coins?.generator || 0,
            audio: body.promotion?.coins?.audio || 0,
            images: body.promotion?.coins?.images || 0,
            video: body.promotion?.coins?.video || 0

        },
        saldoAds: body.saldoAds || 0, 
        saldoMoney: body.saldoMoney || 0,
    };

    if(systemConfig.HAS_PROMO_CODES_SIGNUP && body.promotion){
        await updateAffiliatePromotion(body.promotion, user)
       
    }

    return { user, normalizedMonth};
    


}