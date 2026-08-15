

import { createServer } from 'node:http';
import getClientIp from './serverTools/getClientIp.js';
import proxy from './serverHandlers/proxy.js';
import getRequestHandler from './serverHandlers/getRequestHandler.js';
import postRequestHandler from './serverHandlers/postRequestHandler.js';
import optionsRequestHandler from './serverHandlers/optionsRequestHandler.js';
import systemConfig from '../globalData/systemConfig.js';

export default createServer(async (req, res) => {
    // 1. Obtener la IP real normalizada
    req.ip = getClientIp(req);

    // 2. Cabeceras de seguridad básicas
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // 3. Control de Acceso y Rate Limiting con Redis
    if (systemConfig.HAS_OWN_PROXY_DDOS) {
        const checkProxy = await proxy(req);
        
        if (checkProxy.status === 'BLOCKED' || checkProxy.status === 'PAUSED') {
            res.statusCode = 429; // 429 Too Many Requests
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ 
                error: 'RATE_LIMIT_EXCEEDED', 
                status: checkProxy.status,
                message: checkProxy.message 
            }));
        }
    }

    // 4. Enrutador por Método HTTP
    if (req.method === 'GET') {
        getRequestHandler(req, res);

    } else if (req.method === 'POST') {
        postRequestHandler(req, res);

    } else if (req.method === 'OPTIONS') {
        optionsRequestHandler(req, res);

    } else {
        res.statusCode = 405; // 405 Method Not Allowed es más semántico que 404
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end('METHOD NOT ALLOWED');
    }
});

