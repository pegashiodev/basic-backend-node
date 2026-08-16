

/**
 * ESQUEMA / MODELO DE USUARIO
 */

import { randomUUID } from 'node:crypto';

export default function userSchema(body) {
    const [, month, , year] = new Date().toString().split(' ');
    const userUuid = randomUUID();
    const id2 = randomUUID();
    const normalizedEmail = body.email.toLowerCase().trim();

    // 1. _id compuesto inmutable (clave primaria de Mongo y puntero de Redis)
    const customId = {
        _id: userUuid,
        email: normalizedEmail,
        from: {
            month: month,
            year: year
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

    // 3. Estructura completa del documento
    const user = {
        _id: customId,
        name: (body.name || '').trim(),
        email: normalizedEmail,
        password: body.password, // Llega ya hasheada desde userHandler
        status: 'ACTIVE',
        role: 'USER',               // [EMPLOYEE, ADMIN]
        createdAt: new Date(),
        userDevices: initialDevices,
        coins:{
            generator: 0,
            trainnig: 0,
            coaching: 0,
            audio: 0,
            images: 0,
            video: 0
        }
    };

    return { user, month, year };
}