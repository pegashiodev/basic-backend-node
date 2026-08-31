

/**
 * GESTOR DE CONEXIONES Y BASES DE DATOS MONGODB
 */

import { MongoClient } from 'mongodb';

export let mongoClient = null;
// Mapa interno con las instancias Db de las bases de datos abiertas
const dbsInstances = new Map();
const uri = process.env.MONGODB_URI;

// Almacenamos la promesa del cliente para evitar que múltiples llamadas dupliquen la conexión
let clientMongoPromise = null;

function getClient() {
    if (!uri) {
        throw new Error("La variable de entorno MONGODB_URI no está configurada.");
    }

    // Si ya hay una promesa de conexión (en curso o resuelta), la reutilizamos
    if (!clientMongoPromise) {
        const mongoClient = new MongoClient(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000
        });
        // Guardamos la promesa directamente
        clientMongoPromise = mongoClient.connect();
    }
    return clientMongoPromise;
}



/**
 * Conecta al servidor MongoDB e inicializa las bases de datos indicadas en dbNames
 * @param {Array<string>|string} dbNames - Nombres de las bases de datos a preparar
 */
export default async function openDbs(dbNames) {
   
    try {
        // 1. Conectar el cliente global si aún no está conectado
        const mongoClient = await getClient();
       
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

   
    // 1. Si ya se abrió al inicio, la devuelve de inmediato
    if (dbsInstances.has(dbName)) {
        return dbsInstances.get(dbName);
   
    }else{

        // 1. Esperamos a que el cliente esté conectado (reutiliza la misma conexión siempre)
        const mongoClient = await getClient();
        
        const dbInstance = mongoClient.db(dbName);
        dbsInstances.set(dbName, dbInstance);
        return dbInstance;
    }


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


// NUEVA FUNCIÓN: Cierra el cliente de MongoDB de forma limpia
export async function closeDbConnection() {
    if (mongoClient) {
        try {
            console.log('Cerrando pool de conexiones de MongoDB...');
            await mongoClient.close();
            console.log('Conexión a MongoDB cerrada con éxito.');
            
            // Limpiamos las variables por si la app necesita volver a conectar
            mongoClient = null;
            clientPromise = null;
        } catch (error) {
            console.error('Error al cerrar la conexión de MongoDB:', error);
        }
    }
}

// =========================================================================
// ESCUCHADORES DE EVENTOS DE APAGADO (Añadir en el punto de entrada de tu app, ej: index.js o server.js)
// =========================================================================
const handleShutdown = async (signal) => {
    console.log(`Recibida señal ${signal}. Iniciando apagado limpio...`);
    
    // 1. Aquí cerrarías primero tu servidor HTTP (Express, Fastify, etc.) si tuvieras uno:
    // server.close(() => { ... })

    // 2. Cerramos la base de datos
    await closeDbConnection();
    
    // 3. Salimos del proceso sin errores (código 0)
    process.exit(0);
};

// Escuchar Ctrl+C en la terminal
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Escuchar señal de terminación del sistema (Docker, PM2, Kubernetes, etc.)
process.on('SIGTERM', () => handleShutdown('SIGTERM'));