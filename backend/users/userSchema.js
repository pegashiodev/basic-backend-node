

/**
 * ESQUEMA / MODELO DE USUARIO
 */

import { randomUUID } from 'node:crypto';
import systemConfig from '../globalData/systemConfig.js';
import { updatePromotion } from '../promotions/promotionsHandler.js';

export default async function userSchema(body) {

    const [, month, day , year] = new Date().toString().split(' ');
    const userUuid = randomUUID();
    const id2 = randomUUID();
    const normalizedEmail = body.email.toLowerCase().trim();

    // 1. _id compuesto inmutable (clave primaria de Mongo y puntero de Redis)
    const customId = {
        _id: userUuid,
        email: normalizedEmail,
        from: {
            year: year,
            month: month.toLowerCase(),
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
        userId: userUuid,
        name: (body.name || '').trim(),
        email: normalizedEmail,
        password: body.password,        // Llega ya hasheada desde userHandler
        status: 'ACTIVE',
        role: 'USER',                   // [EMPLOYEE_PYME, ADMIN, ADMIN_PYME, AFILIATE]
        createdAt: date,
        createdAtTimestamp: date.getTime(),
        userDevices: initialDevices,
        isPromoAfiliate: body.promotion ? true : false,
        afiliateData: body.promotion?.owner || null,
        coins:{
            generator: body.promotion?.coins?.generator || 0,
            trainnig: body.promotion?.coins?.trainnig || 0,
            coaching: body.promotion?.coins?.coaching || 0,
            audio: body.promotion?.coins?.audio || 0,
            images: body.promotion?.coins?.images || 0,
            video: body.promotion?.coins?.video || 0
        }
    };

    if(systemConfig.HAS_PROMO_CODES && body.promotion){
        await updatePromotion(body.promotion, user)
       
    }

    return { user, month, year };
    


}