
// /server/serverTools/systemRequests.js

/**
 * Maneja peticiones automáticas de DevTools, exploradores y metadatos estándar.
 * @param {import('node:http').IncomingMessage} req 
 * @param {import('node:http').ServerResponse} res 
 * @returns {boolean} true si la petición fue resuelta aquí, false si debe continuar.
 */
export function systemRequestsHandler(req, res) {
    const rawUrl = req.url || '/';
    const cleanUrl = rawUrl.split('?')[0].toLowerCase();
  
    // 1. Chrome DevTools / extensiones de depuración
    if (cleanUrl === '/.well-known/appspecific/com.chrome.devtools.json') {
      res.writeHead(404, { 
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({ status: 404, message: 'DevTools metadata not configured' }));
      return true;
    }
  
    // 2. Cualquier otra petición automática a /.well-known/ no implementada
    if (cleanUrl.startsWith('/.well-known/')) {
      res.writeHead(404, { 
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({ status: 404, message: 'Resource not found' }));
      return true;
    }
  
    // 3. Iconos y metadatos táctiles automáticos del navegador
    if (cleanUrl === '/apple-touch-icon.png' || cleanUrl === '/apple-touch-icon-precomposed.png') {
      res.writeHead(204); // No Content
      res.end();
      return true;
    }
  
    return false;
  }