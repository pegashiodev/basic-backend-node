

/**
 * GESTOR DE USUARIOS (CRUD & CACHÉ/PUNTERO REDIS)
 */

import userSchema from './userSchema.js';
import { hashPassword } from '../router/routerTools/passwordEncript.js';
import { setUserPointer, getUserPointer, deleteUserPointer } from '../db/userIndexService.js';
import systemConfig from '../globalData/systemConfig.js';
import { getDb } from '../db/openDbs.js';
import { ObjectId } from 'mongodb';

export const addUser = async (body) => {
    try {
        const normalizedEmail = body.email.toLowerCase().trim();

        // 1. Hashear contraseña de forma segura con scrypt
        const hashedPassword = await hashPassword(body.password);
        const bodyWithHashedPass = { ...body, email: normalizedEmail, password: hashedPassword };

        // 2. Construir el documento con su esquema y _id compuesto
        const { user, normalizedMonth} = await userSchema(bodyWithHashedPass);

        if(!user || ! normalizedMonth){
            return { status: 'error', code: 500, message: 'Error Creando esquema del usuario' };
        }

        // 3. Guardar en MongoDB en la colección del mes de alta
        const dbUsers = await getDb(systemConfig.DBS.USERS_DATA);
        const collection = normalizedMonth

        const dbResult = await dbUsers.collection(collection).insertOne(user)
        if(!dbResult.acknowledged || !dbResult.insertedId){
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
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Obtener puntero desde Redis
        const pointer = await getUserPointer(normalizedEmail);
        if (!pointer || !pointer.from?.month) {
            return null;
        }

        // 2. Buscar documento exacto en su colección mensual de MongoDB

        const dbUsers = await getDb(systemConfig.DBS.USERS_DATA);
        const collection = pointer.from.month;
        let dbResult = null;
       
        try{
            dbResult = await dbUsers.collection(collection).findOne({ "_id.email": normalizedEmail })
            return dbResult;
        }catch(e){
            console.error('❌ Error en userHandler.getUserByEmail:', error);
            return null;
        }
        
};

/**
 * ACTUALIZA LOS COINS DE UN USUARIO
 */

export const incrementUserCoins = async (userId, coins)=>{

    // Obtenemos a partir de userId datos para acceder a la DB
    const userIdString = userId.split("_")[1]
    const objId = ObjectId.createFromHexString(userIdString);
    const fechaCreacionUser = objId.getTimestamp();
    const [, month, day , year] = fechaCreacionUser.toString().split(' ');
    const normalizedMonth = month.toLowerCase();
    
    const dbName = systemConfig.DBS.USERS_DATA
    const collection = normalizedMonth
    const dbUsers = await getDb(dbName);

    const incObject = {$inc: 
        {  
            "coins.create": coins.create || 0,
            "coins.generator": coins.generator || 0,
            "coins.training": coins.training || 0,
            "coins.coaching": coins.coaching || 0,
            "coins.audio": coins.audio || 0,
            "coins.images": coins.images || 0,
            "coins.video": coins.video || 0
        }}

    // El error se controla en un try-cath anterior
    await dbUsers.collection(collection).updateOne({"_id.userId": userId}, incObject)
        
}


/**
 * AÑADE PAGO REALIZADO POR EL USUARIO EN LA PLATAFORMA A SU CONTABILIDAD
 */

export const addPaymentToUserPayments = async (order)=>{
    // Obtenemos el usuario que realizo el pedido
    const user = await getUserByEmail(order.email)
    if(!user){
        throw new Error("Error en addPaymentToUserAccounting: No hemos obtenido usuario a partir de Order");
        
    }
    const orderId = order.orderId
    let validOrderId;
        
    if (orderId instanceof ObjectId) {
        console.log("Ya es un objeto ObjectId nativo de MongoDB");
        validOrderId = order.orderId
    } else if (typeof orderId === 'string') {
        console.log("Es una cadena de texto (string)");
        validOrderId = new ObjectId(orderId)
    }
    // A Partir del orderId obtenemos el Año de creacion del pedido para acceder a la base de datos
    const fechaCreacion = validOrderId.getTimestamp(); 
    // 2. Extraer el año para tu base de datos dinámica
    const year= fechaCreacion.getFullYear(); 
    const dbName = systemConfig.DBS.USERS_PAYMENTS + year
    const collection = systemConfig.COLLECTIONS.USERS_PAYMENTS
    const accountingDb = await getDb(dbName);

    // Obtenemos los coins totales de la recarga de coins que ha comprado en la plataforma
    let totalCoins = []
    if(order.items){
        let len = order.items.length;
        while(len){
            len--
            if(order.items[len].coins){
                totalCoins.push(order.items[len].coins)
            }
        }
    }
    
    const payment = {
        _id: validOrderId,
        userId: user._id.userId,
        createdAt: order.createdAt,
        coins: totalCoins,
        taype: "GATEWAY",
        gateway: "stripe",
        dataPayment: {
            type: "SAAS_PAYMENT",
            orderId: validOrderId,
            createdAt: order.createdAt,
            totalAmountInCents: order.totalAmountInCents,
            currency: 'eur',
            stripeSessionId:order.stripeSessionId,
        }

    }
    if(order.promotion){
        payment.dataPayment.promotion = order.promotion;
    }


    // USAMOS UPDATE PORQUE LO QUE HACEMOS ES AÑADIR ITEMS A UN UNICO DOCUMENTO DEL USUARIO POR MES Y AÑO
    await accountingDb.collection(collection).insertOne(payment);

}

/**
 * AÑADE PAGO REALIZADO POR EL USUARIO EN LA PLATAFORMA A SU ACTIVIDAD
 * @param {*} order 
 */

export const addItemToUserActivity = async(order, type)=>{

    // Obtenemos el usuario que realizo el pedido
    const user = await getUserByEmail(order._id.email)
    if(!user){
        throw new Error("Error en addPaymentToUserAccounting: No hemos obtenido usuario a partir de Order");
        
    }
    const orderId = order.orderId
    let validOrderId;
        
    if (orderId instanceof ObjectId) {
        console.log("Ya es un objeto ObjectId nativo de MongoDB");
        validOrderId = orderId
    } else if (typeof orderId === 'string') {
        console.log("Es una cadena de texto (string)");
        validOrderId = new ObjectId(orderId)
    }
    // A Partir del orderId obtenemos el Año de creacion del pedido para acceder a la base de datos
    const fechaCreacion = validOrderId.getTimestamp(); 
    // 2. Extraer el año para tu base de datos dinámica
    const year = fechaCreacion.getFullYear(); 
    const dbName = systemConfig.DBS.USERS_ACTIVITY + year
    const collection = systemConfig.COLLECTIONS.USERS_ACTIVITY
    const activityDb = await getDb(dbName);

    let payment, item;
    // SE INSERTA UN PAGO EN LA PLATAFORMA PARA COMPRAR COINS, U OTRO SERVICIO
    if(type === "SAAS_PAYMENT"){
        // Obtenemos los coins totales de la recarga de coins que ha comprado en la plataforma
        let totalCoins = []
        if(order.items){
            let len = order.items.length;
            while(len){
                len--
                if(order.items[len].coins){
                    totalCoins.push(order.items[len].coins)
                }
            }
        }
        const payment = {
            _id: validOrderId,
            userId: user._id.userId,
            createdAt: order.createdAt,
            coins: totalCoins,
            type: "GATEWAY",
            gateway: "stripe",
            dataPayment: {
                type: "SAAS_PAYMENT",
                orderId: order.orderId,
                createdAt: order.createdAt,
                totalAmountInCents: order.totalAmountInCents,
                currency: 'eur',
                stripeSessionId:order.stripeSessionId,
            }
    
        }
        if(order.promotion){
            payment.dataPayment.promotion = order.promotion;
        }

    // SE HAN DESCONTADO COINS DE LA CUENTA DEL USUARIO POR CONSUMO EN LA PLATAFORMA
    }else if(type === "DESCOUNT_COINS"){

        payment = {

            _id: validOrderId,
            userId: user._id.userId,
            createdAt: order.createdAt,
            coins: totalCoins,
            type: "MICROPAYMENT",
            serviceName: "new-podcast",         // [personaje, podcast, trailer, entrevista, ...]
            dataPayment: {
                
            }
            
        
        }


    // SE AÑADEN COINS A LA CUENTA DEL USUARIO POR CUMPLIR HITOS, OBJETIVOS, ...
    }else if(type === "INCREMENT_COINS"){
       
        payment = {

            _id: validOrderId,
            userId: user._id.userId,
            createdAt: order.createdAt,
            coins: totalCoins,
            type: "MICROPAYMENT",
            serviceName: "new-podcast",         // [personaje, podcast, trailer, entrevista, ...]
            dataPayment: {
                
            }
            
        
        }

    }

    // USAMOS UPDATE PORQUE LO QUE HACEMOS ES AÑADIR ITEMS A UN UNICO DOCUMENTO DEL USUARIO POR MES Y AÑO
    await activityDb.collection(collection).insertOne(payment);

}


/**
 *  ACTUALIZA ALGUN CAMPO DEL USER EN MONGODB Y EN REDIS
 */
export const updateUserData = async (data, user)=>{

    const dbName = systemConfig.DBS.USERS_DATA;
    const collection = user._id.from.month.toLowerCase();

    if(data.task === "UPDATE_USER_PASSWORD"){

        // 3. Guardar en MongoDB en la colección del mes de alta
        
        const filter = {
            "_id.userId": user._id.userId
        }
        const updateData =  { "$set": { password: data.password } }
        const dbUsers = await getDb(dbName)

        const resultUpdate = await dbUsers.collection(collection).updateOne(filter, updateData)
        if(resultUpdate.acknowledged && resultUpdate.matchedCount === 1 && resultUpdate.modifiedCount === 1){
            return { status: 'ok', message: "PASWORD ACTUALIZADO CON EXITO"}
        }else{
            return { status: 'error', code: 500, message: 'Error guardando usuario en Base de Datos' };
        }

        
        
    }


}

export default {
    addUser,
    getUserByEmail, 
    updateUserData,
    incrementUserCoins,
    addPaymentToUserPayments,
    addItemToUserActivity
}