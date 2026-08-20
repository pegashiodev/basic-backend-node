


/**
 * ENVÍA LOS ARCHIVOS ESTÁTICOS DEL SITIO CON PROTECCIÓN ANTI-PATH-TRAVERSAL
 */

import { createReadStream, access, constants } from 'node:fs';
import path from 'node:path';
import systemConfig from "../../globalData/systemConfig.js";
import staticsFilesCached from "../../globalData/staticsFilesCached.js";
import siteStats from '../../router/routerTools/siteStats.js';
import getStaticFolder from "../serverTools/getStaticFolder.js";
import languages from '../../globalData/languages.js';

export default function sendStaticFile(req, res) {
    if (!res.headers) {
        res.headers = {};
    }

    // 1. SI ES UNA REDIRECCIÓN TERMINAMOS DIRECTAMENTE
    if (res.code === 301 || res.code === 302) {
        res.writeHead(res.code, res.headers);
        return res.end();
    }

    // 2. GESTIÓN DE CÓDIGOS DE ERROR (404 / 500)
    const currentLang = req.urlData?.language || systemConfig.MAIN_LANGUAGE;

    if (res.code === 404) {
        req.urlData.fileName = `${systemConfig.PAGES.PAGE_NOT_FOUND}-${currentLang}`;
        req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS;
    } else if (res.code === 500) {
        req.urlData.fileName = `${systemConfig.PAGES.REQUEST_INVALID}-${currentLang}`;
        req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS;
    }

    // 3. DETERMINAR CARPETA DEL ESTÁTICO SI NO VIENE ASIGNADA
    if (!req.static_folder) {
        getStaticFolder(req, res);
    }

    res.headers['Cache-Control'] = systemConfig.TOKENS_AGE.CATCH_STATICS_FILES_TIME;

    // 4. SERVICIO DESDE MEMORIA CACHÉ (Si está en memoria)
    // HTML
    if (req.urlData.ext === systemConfig.EXTENSION_STATIC_VIEWS) {
        res.headers["Content-Type"] = "text/html; charset=utf-8";
        req.urlData.fileName = req.urlData.fileName.replace(/^\//, ''); // Limpiar barra inicial

        const langData = languages[currentLang];
        if (langData?.HTML_FILES_CACHED?.[req.urlData.fileName]) {
            const statusCode = res.code || 200;
            res.writeHead(statusCode, res.headers);
            res.write(langData.HTML_FILES_CACHED[req.urlData.fileName]);
            res.end();
            if (statusCode === 200) siteStats(req);
            return;
        }

    // OTROS ESTÁTICOS (JS, CSS, Imágenes...)
    } else if (staticsFilesCached[req.urlData.fileName]) {
        res.writeHead(res.code || 200, res.headers);
        res.write(staticsFilesCached[req.urlData.fileName]);
        res.end();
        return;
    }

    // 5. SERVICIO DESDE DISCO CON PROTECCIÓN ANTI-PATH TRAVERSAL
    const basePublicDir = path.resolve(process.cwd(), 'frontend');
    const safeTargetRelative = path.join(req.static_folder || '', req.urlData.fileName || '');
    const resolvedPath = path.resolve(basePublicDir, safeTargetRelative);
console.log({safeTargetRelative})
console.log({resolvedPath})
    // COMPROBACIÓN DE SEGURIDAD:
    // resolvedPath DEBE comenzar obligatoriamente por la carpeta base /frontend
    if (!resolvedPath.startsWith(basePublicDir)) {
        console.warn(`🚨 Intento de Path Traversal bloqueado desde IP ${req.ip}: ${req.urlData.fileName}`);
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('403 Forbidden: Acceso no permitido.');
    }

    // 6. COMPROBAR EXISTENCIA Y TRANSMITIR STREAM
    access(resolvedPath, constants.F_OK, (err) => {
        if (err) {
            // Si el archivo no existe en disco -> 404
            console.log(`❌ Archivo no encontrado en disco: ${resolvedPath}`);
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });

            const notFoundKey = `404-${currentLang}.html`;
            const notFoundHtml = languages[currentLang]?.HTML_FILES_CACHED?.[notFoundKey] || '<h1>404 - Página no encontrada</h1>';
            
            res.write(notFoundHtml);
            return res.end();
        }

        if (req.urlData.ext === systemConfig.EXTENSION_STATIC_VIEWS && (!res.code || res.code === 200)) {
            siteStats(req);
        }

        res.writeHead(res.code || 200, res.headers);

        // Envío por stream con control de errores
        const readStream = createReadStream(resolvedPath);
        
        readStream.on('error', (streamErr) => {
            console.error('Error transmitiendo archivo estático:', streamErr.message);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            }
            res.end();
        });

        readStream.pipe(res); // pipe gestiona la contrapresión (backpressure) de forma óptima
    });
}