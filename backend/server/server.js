

import { createServer } from 'node:http';
import getClientIp from './serverTools/getClientIp.js';
import proxy from './serverHandlers/proxy.js';
import getRequestHandler from './serverHandlers/getRequestHandler.js';
import postRequestHandler from './serverHandlers/postRequestHandler.js';
import systemConfig from '../globalData/systemConfig.js';
import { systemRequestsHandler } from './serverHandlers/systemRequestHandler.js';
import getUrlData from './serverTools/getUrlData.js';

export default createServer(async (req, res) => {

    //try {

    
        // -------------------------------------------------------------
        // 1. PRIMER FILTRO: Peticiones automáticas del navegador / DevTools
        // -------------------------------------------------------------
        if (systemRequestsHandler(req, res)) {
          return; // Corta la ejecución de inmediato sin procesar nada más
        }
    
        // -------------------------------------------------------------
        // 2. EXTRACCIÓN Y NORMALIZACIÓN DE LA URL
        // -------------------------------------------------------------
        getUrlData(req);


        // 3. Obtener la IP real normalizada
        req.ip = getClientIp(req);

        // 4. Cabeceras de seguridad básicas
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // 5. Control de Acceso y Rate Limiting con Redis
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

        // 6. Enrutador por Método HTTP
        if (req.method === 'GET') {
            getRequestHandler(req, res);

        } else if (req.method === 'POST') {
            postRequestHandler(req, res);

        } else if (req.method === 'OPTIONS') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: 408, message: 'Method Not Allowed' }));

        } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: 408, message: 'Method Not Allowed' }));
        }

    // } catch (error) {
    //     console.error('❌ Error no controlado en server.js:', error);
    //     if (!res.headersSent) {
    //       res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    //       res.end(JSON.stringify({ status: 500, message: 'Internal Server Error' }));
    //     }
    // }
    
});

