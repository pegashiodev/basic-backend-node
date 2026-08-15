

/***
 * RATE LIMITING Y CONTROL DE ABUSOS CON REDIS
 */

import { redisClient } from '../../db/openRedis.js';
import systemConfig from '../../globalData/systemConfig.js';

export default async function proxy(req) {
    // Si Redis no está listo o la opción está deshabilitada, continuamos
    if (!redisClient || !redisClient.isOpen || !systemConfig.HAS_OWN_PROXY_DDOS) {
        return { status: 'ALLOWED' };
    }

    const ip = req.ip;
    const url = req.url.split('?')[0]; // Quitar query params para la comprobación

    const blackListKey = `blacklist:ip:${ip}`;

    try {
        // 1. VERIFICAR SI YA ESTÁ EN LISTA NEGRA EN REDIS
        const currentBlacklistStatus = await redisClient.get(blackListKey);
        if (currentBlacklistStatus) {
            return { 
                status: currentBlacklistStatus, // 'PAUSED' o 'BLOCKED'
                message: currentBlacklistStatus === 'BLOCKED' 
                    ? 'IP Bloqueada permanentemente por tráfico irregular' 
                    : 'IP Pausada temporalmente. Intente en unos minutos.'
            };
        }

        // 2. CONTROL GLOBAL DE PETICIONES POR MINUTO
        const globalMinKey = `ratelimit:ip:${ip}:min`;
        const currentRequests = await redisClient.incr(globalMinKey);

        if (currentRequests === 1) {
            // Si es la primera petición en este ciclo de minuto, fijamos expiración en 60 segundos
            await redisClient.expire(globalMinKey, 60);
        }

        if (currentRequests > systemConfig.DDOS_RULES.MAX_REQUEST_BY_MINUTE) {
            // Superó el límite global -> Pausar la IP por el tiempo configurado
            const pauseSeconds = Math.ceil(systemConfig.DDOS_RULES.TIME_IP_PAUSED / 1000);
            await redisClient.set(blackListKey, 'PAUSED', { EX: pauseSeconds });
            
            console.warn(`⚠️ IP ${ip} pausada por ${pauseSeconds}s (Exceso de peticiones por minuto: ${currentRequests})`);
            return { status: 'PAUSED', message: 'Exceso de peticiones. IP pausada temporalmente.' };
        }

        // 3. CONTROL DE RUTAS CRÍTICAS (Login y Signup)
        const isAuthRoute = url === '/login' || url === '/login.html' || url === '/signup' || url === '/signup.html';
        if (isAuthRoute) {
            const authKey = `ratelimit:ip:${ip}:auth:min`;
            const authRequests = await redisClient.incr(authKey);

            if (authRequests === 1) {
                await redisClient.expire(authKey, 60);
            }

            const maxAuth = url.includes('signup') 
                ? systemConfig.DDOS_RULES.MAX_TIMES_SIGNUP_BY_MIN 
                : systemConfig.DDOS_RULES.MAX_TIMES_LOGIN_BY_MIN;

            if (authRequests > maxAuth) {
                const pauseSeconds = Math.ceil(systemConfig.DDOS_RULES.TIME_IP_PAUSED / 1000);
                await redisClient.set(blackListKey, 'PAUSED', { EX: pauseSeconds });

                console.warn(`⚠️ IP ${ip} pausada por ${pauseSeconds}s (Exceso de intentos de autenticación: ${authRequests})`);
                return { status: 'PAUSED', message: 'Demasiados intentos en esta ruta. IP pausada.' };
            }
        }

        return { status: 'ALLOWED' };

    } catch (err) {
        console.error('Error en proxy rate-limiter:', err.message);
        // Fail-open: si Redis diera un error puntual, no bloqueamos la petición legítima
        return { status: 'ALLOWED' };
    }
}