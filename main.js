

import dbsOpened from './backend/globalData/dbsOpened.js';
import systemConfig from './backend/globalData/systemConfig.js';
import initControler from './backend/init/initControler.js';
import server from './backend/server/server.js';

// Cargar variables de entorno
process.loadEnvFile();

const PORT = process.env.MODE === "DEV" ? process.env.PORT_DEV : process.env.PORT_PROD;
const HOST = process.env.MODE === "DEV" ? process.env.HOST_DEV : process.env.HOST_PROD;

async function bootstrap() {
    try {
        console.log(`\n🚀 Iniciando proceso PID ${process.pid} en modo ${process.env.MODE || 'DEV'}...`);

        // 1. CONEXIÓN A BASES DE DATOS (MongoDB)
        const dbsResult = await initControler.openDbs(systemConfig.DBS_TO_OPEN);
        if (dbsResult.status !== 'ok') {
            console.error(`❌ Fallo crítico abriendo MongoDB: ${dbsResult.message}`);
            process.exit(1);
        }
        console.log('✅ Bases de datos MongoDB listas:', Object.keys(dbsOpened));

        // 2. CONEXIÓN A REDIS
        const redisResult = await initControler.openRedis();
        if (redisResult.status !== 'ok') {
            console.error(`❌ Fallo crítico abriendo Redis: ${redisResult.message}`);
            process.exit(1);
        }

        // 3. CACHEO DE ESTÁTICOS Y HTML (En proceso local)
        if (systemConfig.CATCH_STATIC_FILES) {
            initControler.catchStaticsFiles();
            initControler.catchHtmlFiles();
        }

        // 4. CACHEO DE DATOS DB (Si está activado)
        if (systemConfig.CATCH_DB_DATA) {
            const resultCatch = await initControler.catchDbData();
            if (resultCatch && resultCatch.status !== 'ok') {
                console.warn('⚠️ Advertencia en catchDbData');
            }
        }

        // 5. CRONS DEL SISTEMA (Evitar duplicidad en modo PM2 Cluster)
        // PM2 asigna NODE_APP_INSTANCE='0', '1', '2'... Solo el proceso 0 corre los crons
        const isMasterInstance = process.env.NODE_APP_INSTANCE === undefined || process.env.NODE_APP_INSTANCE === '0';
        if (isMasterInstance) {
            console.log('⏰ Registrando CRONs del sistema en instancia principal...');
            initControler.systemCrons();
        }

        // 6. LEVANTAR EL SERVIDOR HTTP
        server.listen(PORT, HOST, () => {
            console.log(`\n🌐 Servidor listo: PID ${process.pid} corriendo en http://${HOST}:${PORT}/\n`);
        });

    } catch (error) {
        console.error('❌ Error no controlado durante el arranque:', error);
        process.exit(1);
    }
}

// 7. GRACEFUL SHUTDOWN (Cierre limpio del servidor)
async function gracefulShutdown(signal) {
    console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor de forma ordenada...`);
    
    server.close(async () => {
        console.log('🚪 Servidor HTTP cerrado a nuevas peticiones.');
        
        try {
            await initControler.closeDbs();
            await initControler.closeRedis();
            console.log('✨ Cierre completado con éxito. Saliendo del proceso.\n');
            process.exit(0);
        } catch (err) {
            console.error('❌ Error cerrando conexiones:', err);
            process.exit(1);
        }
    });

    // Forzar salida si tarda más de 5 segundos
    setTimeout(() => {
        console.error('⏱️ Tiempo de espera agotado. Forzando salida.');
        process.exit(1);
    }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Arrancar aplicación
bootstrap();



