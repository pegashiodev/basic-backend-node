

/**
 * GESTOR DE USUARIOS (CRUD & CACHÉ/PUNTERO REDIS)
 */

import userSchema from './userSchema.js';
import { hashPassword } from '../router/routerTools/passwordEncript.js';
import {setRedisUserHset, getRedisUser} from '../db/redisService.js';
import systemConfig from '../globalData/systemConfig.js';
import { getDb } from '../db/openDbs.js';
import { ObjectId } from 'mongodb';
import { redisClient } from '../db/openRedis.js';

export const addUser = async (body) => {
    try {
        const normalizedEmail = body.email.toLowerCase().trim();

        // 1. Hashear contraseña de forma segura con scrypt
        const hashedPassword = await hashPassword(body.password);
        const bodyWithHashedPass = { ...body, email: normalizedEmail, password: hashedPassword };

        // 2. Construir el documento con su esquema y _id compuesto
        const user = await userSchema(bodyWithHashedPass);

        if(!user){
            return { status: 'error', code: 500, message: 'Error Creando esquema del usuario' };
        }

        // 3. Guardar en MongoDB en la colección del mes de alta
        const dbUsers = await getDb(systemConfig.DBS.USERS_DATA);
        const collection = systemConfig.COLLECTIONS.USERS_DATA

        const dbResult = await dbUsers.collection(collection).insertOne(user)
        if(!dbResult.acknowledged || !dbResult.insertedId){
            return { status: 'error', code: 500, message: 'Error guardando usuario en Base de Datos' };
        }

        // Guardamos una copia modificada (todo String) del user en REdis 
        await setRedisUserHset(user)

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
 * Obtener usuario completo desde Redis.  SI NO EN REDIS BUSCAMOS EN MONGO
 */
export const getUserByEmail = async (email) => {
        
    const normalizedEmail = email.toLowerCase().trim();

    const userRedis = await getRedisUser(normalizedEmail)
    if (userRedis) {
        return userRedis;
    }

    // 2. Buscar documento exacto en su colección mensual de MongoDB

    const dbUsers = await getDb(systemConfig.DBS.USERS_DATA);
    const collection = systemConfig.COLLECTIONS.USERS_DATA
    let userMongo = null;
    
    try{
        userMongo = await dbUsers.collection(collection).findOne({ "email": normalizedEmail })
        return userMongo;
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
            "amount": 0.50,                 // Coste del servicio (puede ser en dinero o equivalente)
            "coinsDebited": 5,
            dataPayment: {
                
            }
            
        
        }
        /*
        Nunca traigas el usuario a Node.js, restes el saldo en memoria y luego hagas un save(). 
        Si el usuario hace dos clics rápidos, ambos leerán el mismo saldo inicial y uno pisará al otro.
        En su lugar, delega la resta directamente a MongoDB usando el operador $inc con un valor negativo, 
        y añade una condición en el filtro para asegurarte de que el usuario aún tiene saldo suficiente:

        async function autorizarYDescontarCoins(userId, costoServicio) {
            const result = await db.collection('users').updateOne(
              { 
                _id: new ObjectId(userId), 
                coins: { $gte: costoServicio } // Con esto validas el saldo de forma atómica
              },
              { 
                $inc: { coins: -costoServicio } // Resta los coins directamente en la BD
              }
            );
          
            // Si modifiedCount es 0, significa que el usuario no tenía saldo suficiente
            return result.modifiedCount > 0; 
        }

            Como buena práctica contable, cada vez que registres un micropago en payments_YEAR, 
            guarda un campo llamado balanceSnapshot. Este campo almacena cuántos coins le quedaron 
            al usuario exactamente después de esa transacción.

        {
            "_id": ObjectId("65f1a2cc..."),
            "userId": ObjectId("507f1f77..."),
            "type": "micropayment",
            "coinsDebited": 5,
            "balanceSnapshot": 95, // Tenía 100, consumió 5, le quedan 95
            "createdAt": ISODate("2026-09-02T20:00:00Z")
        }
        Si en el futuro algún usuario reclama que su saldo está mal, 
        no tendrás que calcular todo su historial desde el año uno. 
        Bastará con mirar el balanceSnapshot de su último micropago para saber 
        con total certeza qué falló y en qué momento exacto.

        */


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

            // ACTUALIZAMOS AHORA EN REDIS
            await redisClient.hSet(`user:${user.email}`, "password", data.password);
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