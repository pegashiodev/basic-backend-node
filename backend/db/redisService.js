

/**
 * SERVICIO DE ÍNDICE DE USUARIOS EN REDIS
 * Mapea email -> Localización en MongoDB ({ from: { month, year }, _id, ... })
 */

import { redisClient } from './openRedis.js';
import { ObjectId } from 'mongodb';
import systemConfig from '../globalData/systemConfig.js';

export async function getUserPointer(email) {
    if (!email || !redisClient || !redisClient.isOpen) return null;
    try {
        const raw = await redisClient.get(`user:idx:${email.toLowerCase().trim()}`);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.error('❌ Error leyendo user:idx en Redis:', err.message);
        return null;
    }
}

export async function setUserPointer(email, pointerData) {
    if (!email || !pointerData || !redisClient || !redisClient.isOpen) return false;
    try {
        // Sin TTL: es un índice permanente en Redis
        await redisClient.set(`user:idx:${email.toLowerCase().trim()}`, JSON.stringify(pointerData));
        return true;
    } catch (err) {
        console.error('❌ Error guardando user:idx en Redis:', err.message);
        return false;
    }
}

export async function deleteUserPointer(email) {
    if (!email || !redisClient || !redisClient.isOpen) return false;
    try {
        await redisClient.del(`user:idx:${email.toLowerCase().trim()}`);
        return true;
    } catch (err) {
        console.error('❌ Error borrando user:idx en Redis:', err.message);
        return false;
    }
}

/*
    CREA UN SNAPSHOT DEL USER PRA EL ACCESO RAPIDO A ALGUNO DE SUS VALORES
*/

export async function setRedisUserHset(user) {

    if (!user.email || !redisClient || !redisClient.isOpen) return false;


    // TODOS LOS VALORES HAN DE SER STRING
    const userData = {
        userId: user.userId.toString(),
        userIdString: user.userIdString,
        role: user.role,
        name: user.name,
        email: user.email, 
        nick: user.nick ?? "",
        channelName: user.channelName ?? "",
        status: user.status,
        createdAt: user.createdAt.getTime().toString(),     // pasamos el Date a un String
        password: user.password,
        coinsCreate: user.coinsCreate ?? "0",
        coinsTraining: user.coinsTraining ?? "0",
        coinsGenerator: user.coinsGenerator ?? "0",
        coinsCoaching: user.coinsCoaching ?? "0",
        coinsImages: user.coinsImages ?? "0",
        coinsAudio: user.coinsAudio ?? "0",
        coinsVideo: user.coinsVideo ?? "0",
        saldoMoney: user.saldoMoney ?? "0",
        saldoAds: user.saldoAds ?? "0"
    }
    

    try{

        // Guardar el objeto desglosado en campos
        await redisClient.hSet(`user:${userData.email}`, userData);
        
        // Opcional: Define un TTL (Tiempo de vida) en segundos si no quieres que sea eterno
        // await redisClient.expire(`user:${userData.email}`, 86400); // 24 horas

    }catch(e){
        console.error('❌ Error Creando el HASH del usuario en  Redis:', e.message);
        return false;
    }

}

/*
    Crea una copia de la session en redis, con todos los campos STRING
*/

export async function setRedisSessionHset(session) {

    const sessionData = {

        sessionId: session.sessionId.toString(),
        sessionIdString: session.sessionIdString,
        email: session.email,
        userId: session.userId.toString(), 
        userIdString: session.userIdString,
        role: session.role,
        status: session.status,   // [ENDED, PAUSED, BLOCKED]
        createdAt: session.createdAt.toString(),
        expiresAt: session.expiresAt.toString(),
        lastActiveAt: session.lastActiveAt.toString(),
        ip: session.ip,
        userAgent: session.userAgent,
        isValid: session.isValid.toString()
    }

    try{

        // 1. Guardar en Redis con expiración automática (TTL)
        await redisClient.hSet(`session:${sessionData.sessionIdString}`, sessionData);
        // Opcional: Define un TTL (Tiempo de vida) en segundos si no quieres que sea eterno
        await redisClient.expire(`session:${sessionData.sessionIdString}`, systemConfig.TOKENS_AGE.SESSION_TTL_SECONDS); 

    }catch(e){
        console.error('❌ Error Creando el HASH de la SESSION en  Redis:', e.message);
        return false;
    }

}


/*
    OBTENEMOS EL USUARIO POR SU EMAIL  CONSULTANDO REDIS
*/
export async function getRedisUser(email) {

    try{

        // 1. Obtienes todos los campos del Hash
        const userHash = await redisClient.hGetAll(`user:${email}`);
    
        // 2. Redis devuelve un objeto plano. Validamos si existe:
        if (!userHash || Object.keys(userHash).length === 0) {
        // El usuario no está en Redis (Cache Miss), debes buscarlo en MongoDB
        console.log("EL USUARIO NO ESTA EN REDIS ???? ")
        return null;
        }
    
        // 3. Convertimos los campos necesarios a sus tipos de datos correctos
        // El userId se almaceno en Redis como un String 
        const userIdString = userHash.userId

        const user = {
            userId: new ObjectId(userIdString),     // Convertimos a ObjectId()
            userIdString: userIdString,
            role: userHash.role,
            name: userHash.name,
            email: userHash.email, 
            nick: userHash.nick || "",
            status: userHash.status, 
            channelName: userHash.channelName || "",
            createdAt: new Date(userHash.createdAt),
            password: userHash.password,
            coinsCreate: Number(userHash.coinsCreate || 0),
            coinsTraining: Number(userHash.coinsTraining || 0),
            coinsGenerator: Number(userHash.coinsGenerator || 0),
            coinsCoaching: Number(serHash.coinsCoaching || 0),
            coinsImages: Number(userHash.coinsImages || 0),
            coinsAudio: Number(userHash.coinsAudio|| 0),
            coinsVideo: Number(userHash.coinsVideo || 0),
            saldoMoney: Number(userHash.saldoMoney || 0),
            saldoAds: Number(userHash.saldoAds || 0)
            
        };
        return user

    }catch(e){
        console.error('❌ Error en userIndexService: Obteniendo Ususario de Redis: ->', e);
        return null;
    }

}


/*
    OBTENEMOS LA SESSION DE  USUARIO POR SU EMAIL  CONSULTANDO REDIS
*/

export async function getRedisSession(sessionIdString) {
    
    try{

        // 1. Obtienes todos los campos del Hash
        const sessionHash = await redisClient.hGetAll(`session:${sessionIdString}`);
    
        // 2. Redis devuelve un objeto plano. Validamos si existe:
        if (!sessionHash || Object.keys(sessionHash).length === 0) {
        // LA SESSION NO  está en Redis (Cache Miss), CADUCADA ??
        console.log("LA SESSION YA  NO ESTA EN REDIS -> CADUCADAD ")
        return null;

        }
        const sessionId = new ObjectId(sessionIdString)
        const session = {

            _id: sessionId,
            sessionId: sessionId,
            sessionIdString: sessionIdString,
            email: sessionHash.email,
            userId: new ObjectId(sessionHash.userIdString), 
            userIdString: sessionHash.userIdString,
            role: sessionHash.role,
            status: sessionHash.status,
            createdAt: new Date(sessionHash.createdAt),
            expiresAt: new Date(sessionHash.expiresAt),
            lastActiveAt: new Date(sessionHash.lastActiveAt),
            ip: sessionHash.ip,
            userAgent: sessionHash.userAgent,
            isValid: Boolean(sessionHash.isValid)
        }


        return session


    }catch(e){
        console.error('❌ Error en userIndexService: Obteniendo SESSION  de Redis: ->', e);
        return null;
    }

}



/*
    COMPROBAMOS SI EXISTE EL USUARIO DE ESE EMAIL
*/
export async function existingRedisUserByEmail(email) {

    // 1. Obtienes todos los campos del Hash
    const userHash = await redisClient.hGetAll(`user:${email}`);
    // 2. Redis devuelve un objeto plano. Validamos si existe:
    if (!userHash || Object.keys(userHash).length === 0) {
        return false;
    }
    return true


}




/*
    ACTUALIZA CAMPOS STRING EN EL USER DE REDIS: [ PASSWORD, NICK, CHANNELNAME, ...]
*/
export async function updateRedisUserString(email, data) {

    // Actualiza el campo de forma directa
    await redis.hset(`user:${email}`, data.item, data.newValue);
}



/*
    ACTUALIZA EL SALDO EN EL SNAPSHOT DEL USER EN REDIS
*/

export async function updateRedisUserCoins(email, data) {

    // Actualiza el campo de forma directa
    await redis.hset(`user:${email}`, 'coins.create', data.nuevoSaldo.toString());


}


/*
    LEE EL SALDO DISPONIBLE EN EL SNAPSHOT DEL USER EN REDIS
*/

export async function getRedisUserCoins(email, typeCoins) {

    // Obtiene únicamente el saldo (Retorna un String)
    const saldo = await redis.hget(`user:${email}`, typeCoins);
    const saldoNum = Number(saldo);

}


