

import { createServer } from 'node:http';
import getClientIp from './serverTools/getClientIp.js';
import proxy from './serverHandlers/proxy.js';
import getRequestHandler from './serverHandlers/getRequestHandler.js';
import postRequestHandler from './serverHandlers/postRequestHandler.js';
import systemConfig from '../globalData/systemConfig.js';
import { systemRequestsHandler } from './serverHandlers/systemRequestHandler.js';
import getUrlData from './serverTools/getUrlData.js';
import sendStaticFile from './serverHandlers/sendStaticFile.js';

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
        // console.log(req.urlData)
        console.log(`\n\n NUEVA PETICION ${req.method} ************************************`)
        console.log(`URL: ${req.urlData.url}`)
        
        
        // EN getUrlData se marca en el objeto Request si la peticion es incorrecta
        if(req.its_bad_get_request){
            if(req.method === "GET"){
                console.log("ITS BAD REQUEST")
                res.code = 404;
                return sendStaticFile(req, res)
            }else{
                res.writeHead(411, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 411,
                    message: "ITS BAD REQUEST ",
                    location
                }));
            }
        }

        // COMPROBAMOS SI LA RUTA COMPLETA ESTA EN NUESTRO SITEMAP
        // 1. Tu diccionario de rutas canónicas mapping a su archivo físico
        const sitemapRoutes = {
            '/': 'index.html',
            '/index': "index.html",
            '/index.html': "index.html",

            '/acceso-plataforma': 'acceso-plataforma.html',
            '/acceso-plataforma.html': 'acceso-plataforma.html',

           
            '/blog': 'blog.html',
            '/blog.html': 'blog.html',
            
            '/blog/el-origen-de-la-ia': 'el-origen-de-la-ia.html',
            '/blog/el-origen-de-la-ia.html': 'el-origen-de-la-ia.html',

            
            '/bots': 'bots.html',
            '/bots.html': 'bots.html',
            '/bots/bot1': 'bot1.html',
            '/bots/bot1.html': 'bot1.html',


            '/mis-bots': 'mis-bots.html',
            '/mis-bots.html': 'mis-bots.html',

            '/user': "user.html",
            "/user.html": "user.html",

            '/404-es': '404-es.html',
            '/404-es.html': '404-es.html',
            '/500-es': '500-es.html',
            '/500-es.html': '500-es.html',
            '/505-es': '505-es.html',
            '/505-es.html': '505-es.html',

            
            '/shopping-cart': 'shoping-cart.html',
            '/shopping-cart.html': 'shoping-cart.html',
            '/cancel-checkout': 'cancel-checkout.html',
            '/cancel-checkout.html': 'cancel-checkout.html',
            '/success-checkout': 'success-checkout.html',
            '/success-checkout.html': 'success-checkout.html',

            '/login-email': 'acceso-plataforma.html',
            '/login-email.html': 'acceso-plataforma.html',
            '/signup-email': 'acceso-plataforma.html',
            '/signup-email.html': 'acceso-plataforma.html',

            '/session-is-required': 'session-is-required.html',
            '/session-is-required.html': 'session-is-required.html',

            '/renove-password': 'renove-password.html',
            '/renove-password.html': 'renove-password.html',
            '/renove-password-expired': 'renove-password-expired.html',
            '/renove-password-expired.html': 'renove-password-expired.html',
            '/forgot-password': 'renove-password.html',
            '/forgot-password.html': 'renove-password.html',

            '/refresh-bridge': "refresh-bridge.html",
            '/refresh-bridge.html': "refresh-bridge.html",
            '/logout': "logout.html",
            '/logout.html': "logout.html",
            
            '/get-main-menu': "get-main-menu.html",
            '/get-main-menu.html': "get-main-menu.html",
            '/srtipe-webhook': "srtipe-webhook.html", 
            '/stripe-webhook.html': "srtipe-webhook.html",

            '/checkout': 'checkout.html',
            '/checkout.html': 'checkout.html'

        };
        const canonicalPath = req.urlData.canonicalPath
        // SOLO REVISAMOS LOS ENDPINTS SIN EXTENSION O SON EXTENSION HTML
        if(req.urlData.ext === "html" || req.urlData.ext === ""){
            if(!sitemapRoutes[canonicalPath]){
                console.log(`la URL: ${req.urlData.url} No esta en el SiteMap`)
                res.code = 404;
                return sendStaticFile(req, res)
            }
        }

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

