

import { createClient } from 'redis';


const url = process.env.REDIS_URI || 'redis://127.0.0.1:6379';

// 1. Creamos la instancia inmediatamente para que la exportación sea fija y segura
export const redisClient = createClient({
    url: url,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                console.error('❌ Redis: Límite de reintentos alcanzado.');
                return new Error('Límite de reintentos alcanzado');
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

// 2. Escuchamos errores globales del cliente
redisClient.on('error', (err) => {
    console.error('⚠️ Error en cliente Redis:', err.message);
});

// 3. Función simplificada que solo se encarga de CONECTAR al arrancar la app
export async function openRedis() {
    // Si ya está abierto o abriéndose, Node-Redis lo gestiona internamente
    if (redisClient.isOpen) {
        return { status: 'ok', client: redisClient };
    }

    try {
        console.log('Iniciando conexión con Redis...');
        await redisClient.connect();
        console.log('✅ Conexión con Redis establecida correctamente.');

const email = "pegashio@gmail.com"
// await redisClient.del(`user:${email}`);

const userHash = await redisClient.hGetAll(`user:${email}`);
console.log({userHash})

        return { status: 'ok', client: redisClient };
    } catch (err) {
        console.error('❌ Fallo al conectar con Redis:', err.message);
        return { status: 'error', message: err.message };
    }
}

// Cierre limpio de Redis en el apagado del servidor
export async function closeRedis() {
    if (redisClient) {
        console.log('🔌 Conexión de Redis cerrada limpiamente.');
        await redisClient.quit();
    }
}