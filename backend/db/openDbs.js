

/***
 * ABRE LAS BASES DE DATOS CUYOS NOMBRES RECIBE POR PARÁMETRO (UN STRING O UN ARRAY)
 * Y LAS AÑADE A UN DICCIONARIO PARA QUE PUEDAN SER ACCEDIDAS.
 */

import { MongoClient } from 'mongodb';
import dbsOpened from "../globalData/dbsOpened.js";

// Instancia única del cliente para reutilizar la conexión en todo el proceso
let mongoClient = null;

export default async function openDbs(dbNames) {
    console.log('Iniciando conexión con MongoDB...');

    if (!dbNames || (Array.isArray(dbNames) && dbNames.length === 0)) {
        return { status: 'error', message: 'dbNames no es válido o está vacío' };
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        return { status: 'error', message: 'Variable de entorno MONGODB_URI no encontrada' };
    }

    try {
        if (!mongoClient) {
            mongoClient = new MongoClient(uri);
            await mongoClient.connect();
            // Comprobación de salud inicial
            await mongoClient.db("admin").command({ ping: 1 });
            console.log('✅ Conexión con MongoDB establecida correctamente.');
        }

        const namesList = Array.isArray(dbNames) ? dbNames : [dbNames];

        for (const name of namesList) {
            if (typeof name === 'string' && name.trim() !== '') {
                dbsOpened[name] = mongoClient.db(name);
            }
        }

        return { status: 'ok', client: mongoClient };

    } catch (err) {
        console.error('❌ Error al conectar con MongoDB:', err.message);
        return { status: 'error', message: err.message };
    }
}

// Exportamos una función para cerrar la conexión limpiamente durante el apagado (Shutdown)
export async function closeDbs() {
    if (mongoClient) {
        await mongoClient.close();
        console.log('🔌 Conexión de MongoDB cerrada.');
    }
}