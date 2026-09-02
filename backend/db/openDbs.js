

/**
 * GESTOR DE CONEXIONES Y BASES DE DATOS MONGODB
 */

import { MongoClient } from 'mongodb';
import systemConfig from '../globalData/systemConfig';

export let mongoClientInstance = null;
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
            mongoClientInstance = new MongoClient(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000
        });
        // Guardamos la promesa directamente
        clientMongoPromise = mongoClientInstance.connect();
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
        await getClient();
       
        // 2. Normalizar dbNames a un Array
        const databasesToOpen = Array.isArray(dbNames) ? dbNames : [dbNames];

        // 3. Inicializar y almacenar cada base de datos solicitada
        for (const name of databasesToOpen) {
            if (!name) continue;

            const dbInstance = mongoClientInstance.db(name);
            
            // Opcional: hacer un ping o comprobación específica sobre la BD
            await dbInstance.command({ ping: 1 });

            let collection;

            // Creamos indices de busqueda en estas DBS
            if(name === "users_activity_2026"){

                collection = dbInstance.collection(systemConfig.COLLECTIONS.USERS_ACTIVITY)
                // Para listar el historial de ACTIVIDAD del usuario ordenado por fecha
                // Si ya existen, no pasa nada (operación ultra rápida)
                await collection.createIndex({ userId: 1, createdAt: -1 })
                

            }else if(name === "users_payments_2026"){
                // En el payment ha de haber userId
                collection = dbInstance.collection(systemConfig.COLLECTIONS.USERS_PAYMENTS)
                // Para listar el historial de PAGOS del usuario ordenado por fecha
                // Si ya existen, no pasa nada (operación ultra rápida)
                await collection.createIndex({ userId: 1, createdAt: -1 });
                
           
            }else if(name === "orders_2026"){
                // En el Order ha de haber userId
                collection = dbInstance.collection(systemConfig.COLLECTIONS.ORDERS)
                // Para listar el historial de PAGOS del usuario ordenado por fecha
                // Si ya existen, no pasa nada (operación ultra rápida)
                await collection.createIndex({ userId: 1, createdAt: -1 });
               
            }

            /*
            Con los indices con una sola consulta obtenemos todos los documentos de ese usuario en la DB

                async function getUserPayments(req, res) {
                    try {
                        const { userIdStr } = req.params;

                        const payments = await db.collection('payments')
                        .find({ userId: new ObjectId(userIdStr) }) // Usamos ObjectId para activar el índice
                        .sort({ createdAt: -1 }) // MongoDB usa el índice para ordenar al instante
                        .toArray();

                        // El driver nativo convierte automáticamente los ObjectIds a string al hacer res.json()
                        res.json(payments); 
                    } catch (error) {
                        res.status(500).send({ error: "Error al obtener pagos." });
                    }
                }

            */

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
    }
    // 1. Esperamos a que el cliente esté conectado (reutiliza la misma conexión siempre)
    await getClient();
    
    const dbInstance = mongoClientInstance.db(dbName);
    // Opcional: hacer un ping o comprobación específica sobre la BD
    await dbInstance.command({ ping: 1 });
    dbsInstances.set(dbName, dbInstance);

    let collection;
    
    // dependiendo de la base de datos hay que crear los indices PARA LA BUSQUEDA DE CONTENIDO POR USERID
    if(dbName.includes("users_activity_")){
        collection = dbInstance.collection(systemConfig.COLLECTIONS.USERS_ACTIVITY)
        await collection.createIndex({ userId: 1, createdAt: -1 })
    
    }else if(dbName.includes("users_payments_")){
        collection = dbInstance.collection(systemConfig.COLLECTIONS.USERS_PAYMENTS)
        await collection.createIndex({ userId: 1, createdAt: -1 })

    }else if(dbName.includes("orders_")){
        collection = dbInstance.collection(systemConfig.COLLECTIONS.ORDERS)
        await collection.createIndex({ userId: 1, createdAt: -1 })

    }

    return dbInstance;
    

}

/**
 * Cierre limpio de todas las conexiones
 */
export async function closeDbs() {
    if (mongoClientInstance) {
        await mongoClientInstance.close();
        dbsInstances.clear();
        console.log('🔌 Conexión de MongoDB cerrada.');
    }
}


// NUEVA FUNCIÓN: Cierra el cliente de MongoDB de forma limpia
export async function closeDbConnection() {
    if (mongoClientInstance) {
        try {
            console.log('Cerrando pool de conexiones de MongoDB...');
            await mongoClientInstance.close();
            console.log('Conexión a MongoDB cerrada con éxito.');
            
            // Limpiamos las variables por si la app necesita volver a conectar
            mongoClientInstance = null;
            clientMongoPromise = null;
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