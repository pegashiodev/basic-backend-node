

/**
 * GESTOR DE CONEXIONES Y BASES DE DATOS MONGODB
 */

import { MongoClient } from 'mongodb';

export let mongoClient = null;
// Mapa interno con las instancias Db de las bases de datos abiertas
const dbsInstances = new Map();

/**
 * Conecta al servidor MongoDB e inicializa las bases de datos indicadas en dbNames
 * @param {Array<string>|string} dbNames - Nombres de las bases de datos a preparar
 */
export default async function openDbs(dbNames) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        return { status: 'error', message: 'Variable de entorno MONGODB_URI no encontrada' };
    }

    try {
        // 1. Conectar el cliente global si aún no está conectado
        if (!mongoClient) {
            console.log('Iniciando conexión con MongoDB...');
            mongoClient = new MongoClient(uri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000
            });

            await mongoClient.connect();
            console.log('✅ Conexión con el servidor MongoDB establecida.');
        }

        // 2. Normalizar dbNames a un Array
        const databasesToOpen = Array.isArray(dbNames) ? dbNames : [dbNames];

        // 3. Inicializar y almacenar cada base de datos solicitada
        for (const name of databasesToOpen) {
            if (!name) continue;

            const dbInstance = mongoClient.db(name);
            
            // Opcional: hacer un ping o comprobación específica sobre la BD
            await dbInstance.command({ ping: 1 });

            // Guardamos la referencia directa de la base de datos
            dbsInstances.set(name, dbInstance);
            console.log(`  📂 Base de datos lista: [${name}]`);
        }

        return { 
            status: 'ok', 
            opened: Array.from(dbsInstances.keys()) 
        };

    } catch (err) {
        console.error('❌ Error al inicializar bases de datos en MongoDB:', err.message);
        return { status: 'error', message: err.message };
    }
}

/**
 * Obtiene la instancia de una base de datos abierta previamente
 * @param {string} dbName 
 * @returns {import('mongodb').Db}
 */
export async function getDb(dbName) {

    const uri = process.env.MONGODB_URI;
   
    // 1. Si ya se abrió al inicio, la devuelve de inmediato
    if (dbsInstances.has(dbName)) {
        return dbsInstances.get(dbName);
    }
console.log("NO HAY INSTANCIA ABIERTA DE LA DB: " + dbName)
    
// 2. Si no estaba en la lista inicial pero el cliente está conectado, la crea dinámicamente
    if(!mongoClient){
        mongoClient = new MongoClient(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000
        });

        await mongoClient.connect();
    }
    const dbInstance = mongoClient.db(dbName);
    dbsInstances.set(dbName, dbInstance);
console.log(dbInstance)
    return dbInstance;

    throw new Error(`MongoClient no inicializado. No se pudo acceder a la BD: ${dbName}`);
}

/**
 * Cierre limpio de todas las conexiones
 */
export async function closeDbs() {
    if (mongoClient) {
        await mongoClient.close();
        dbsInstances.clear();
        console.log('🔌 Conexión de MongoDB cerrada.');
    }
}