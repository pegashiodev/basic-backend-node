

/**
 * GESTOR DE USUARIOS (CRUD & CACHÉ/PUNTERO REDIS)
 */

import userSchema from './userSchema.js';
import { hashPassword } from '../router/routerTools/passwordEncript.js';
import dbCrudHandler from '../db/dbCrudHandler.js';
import { setUserPointer, getUserPointer, deleteUserPointer } from '../db/userIndexService.js';
import systemConfig from '../globalData/systemConfig.js';
import { getDb } from '../db/openDbs.js';

export const addUser = async (body) => {
    try {
        const normalizedEmail = body.email.toLowerCase().trim();

        // 1. Hashear contraseña de forma segura con scrypt
        const hashedPassword = await hashPassword(body.password);
        const bodyWithHashedPass = { ...body, email: normalizedEmail, password: hashedPassword };

        // 2. Construir el documento con su esquema y _id compuesto
        const { user, month, year } = await userSchema(bodyWithHashedPass);

        if(!user || ! month){
            return { status: 'error', code: 500, message: 'Error Creando esquema del usuario' };
        }

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
            dbName: systemConfig.DBS.USERS_DATA,
            collection: pointer.from.month,
            await: true
        };
        const options = {}

        const result = await dbCrudHandler.findOne({ "_id.email": normalizedEmail }, params, options);
        // return result && result.data ? result.data : null;
        return result;

    } catch (error) {
        console.error('❌ Error en userHandler.getUserByEmail:', error);
        return null;
    }
};

/**
 * ACTUALIZA LOS COINS DE UN USUARIO
 */

export const incrementUserCoins = async (userId, coins)=>{
    const userIdParts = userId.split('_')
console.log({userIdParts})
    const dbName = systemConfig.DBS.USERS_DATA
    const collection = userIdParts[2].toLowerCase();
    const dbUsers = await getDb(dbName);

    const incObject = {$inc: 
        {   "coins.generator": coins.generator || 0,
            "coins.training": coins.training || 0,
            "coins.coaching": coins.coaching || 0,
            "coins.audio": coins.audio || 0,
            "coins.images": coins.images || 0,
            "coins.video": coins.video || 0
        }}

    const resultIncrementCoins = await dbUsers.collection(collection).updateOne({"_id.userId": userId}, incObject)
    console.log(resultIncrementCoins)


}

/**
 *  ACTUALIZA ALGUN CAMPO DEL USER EN MONGODB Y EN REDIS
 */
export const updateUser = async (data, user)=>{


    if(data.task === "UPDATE_USER_PASSWORD"){

        // 3. Guardar en MongoDB en la colección del mes de alta
        const params = {
            dbName: systemConfig.DBS.USERS_DATA,
            collection: user._id.from.month.toLowerCase(),
        };
        const filter = {
            "_id.email": user._id.email
        }
        const updateData =  { "$set": { password: data.password } }
        const dbResult = await dbCrudHandler.updateOne(filter, updateData, params);
        
        if (dbResult.status !== 'ok') {
            return { status: 'error', code: 500, message: 'Error guardando usuario en Base de Datos' };
        }
        return { status: 'ok', message: "PASWORD ACTUALIZADO CON EXITO"} 
    }


}

export default {
    addUser,
    getUserByEmail, 
    updateUser,
    incrementUserCoins
};