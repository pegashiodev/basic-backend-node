

/**
 * GESTOR DE USUARIOS (CRUD & CACHÉ/PUNTERO REDIS)
 */

import userSchema from './userSchema.js';
import { hashPassword } from '../router/routerTools/passwordEncript.js';
import dbCrudHandler from '../db/dbCrudHandler.js';
import { setUserPointer, getUserPointer, deleteUserPointer } from '../db/userIndexService.js';
import systemConfig from '../globalData/systemConfig.js';

export const addUser = async (body) => {
    try {
        const normalizedEmail = body.email.toLowerCase().trim();

        // 1. Hashear contraseña de forma segura con scrypt
        const hashedPassword = await hashPassword(body.password);
        const bodyWithHashedPass = { ...body, email: normalizedEmail, password: hashedPassword };

        // 2. Construir el documento con su esquema y _id compuesto
        const { user, month } = userSchema(bodyWithHashedPass);

        // 3. Guardar en MongoDB en la colección del mes de alta
        const params = {
            dbName: systemConfig.DBS.USERS_DATA,
            collection: month.toLowerCase(),
            await: true
        };

        const dbResult = await dbCrudHandler.insertOne(user, params);
        if (dbResult.status !== 'ok') {
            return { status: 'error', code: 500, message: 'Error guardando usuario en Base de Datos' };
        }

        // 4. Guardar puntero en Redis de forma permanente
        await setUserPointer(normalizedEmail, user._id);

        return {
            status: 'ok',
            code: 200,
            user: user
        };

    } catch (error) {
        console.error('❌ Error en userHandler.addUser:', error);
        return { status: 'error', code: 500, message: error.message };
    }
};

/**
 * Obtener usuario completo desde MongoDB usando el puntero de Redis
 */
export const getUserByEmail = async (email) => {
    try {
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Obtener puntero desde Redis
        const pointer = await getUserPointer(normalizedEmail);
        if (!pointer || !pointer.from?.month) {
            return null;
        }

        // 2. Buscar documento exacto en su colección mensual de MongoDB
        const params = {
            dbName: systemConfig.DBS.USERS,
            collection: pointer.from.month,
            await: true
        };

        const result = await dbCrudHandler.findOne({ "_id.email": normalizedEmail }, params);
        return result && result.data ? result.data : null;

    } catch (error) {
        console.error('❌ Error en userHandler.getUserByEmail:', error);
        return null;
    }
};

export default {
    addUser,
    getUserByEmail
};