

/**
 * routeGuard.js - Normalizador de rutas e interceptor de navegación restringida
 */
import { authFetch } from './authFetch.js';

// Lista de rutas restringidas del sistema (sin prefijo de idioma)
const RESTRICTED_ROUTES = new Set([
    '/user',
    '/mis-bots'
]);

// Idiomas válidos configurados en el proyecto
const SUPPORTED_LANGS = new Set(['es', 'en', 'fr', 'de', 'pt']);

/**
 * Extrae el código de idioma (si existe) y la ruta normalizada
 * Ejemplos:
 * "/es/mis-bots" -> { lang: "es", canonicalPath: "/mis-bots" }
 * "/mis-bots"    -> { lang: null, canonicalPath: "/mis-bots" }
 */
export function parseRoute(pathname) {
    const segments = pathname.split('/').filter(Boolean); // Elimina strings vacíos

    if (segments.length > 0 && segments[0].length === 2 && (SUPPORTED_LANGS.has(segments[0].toLowerCase()))) {
        const lang = segments[0];
        const canonicalPath = '/' + segments.slice(1).join('/');
        return { lang, canonicalPath: canonicalPath === '' ? '/' : canonicalPath };
    }

    return { lang: null, canonicalPath: pathname.startsWith('/') ? pathname : `/${pathname}` };
}

/**
 * Comprueba si una URL pertenece a las rutas restringidas
 */
export function isRestrictedRoute(pathname) {
    const { canonicalPath } = parseRoute(pathname);
    return RESTRICTED_ROUTES.has(canonicalPath);
}

/**
 * Inicializador global del detector de navegación restringida
 */
export function initRouteGuard() {
    document.addEventListener('click', async (event) => {
        const link = event.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        // Ignorar enlaces externos, anclas o vacíos
        if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
            return;
        }

        const url = new URL(link.href, window.location.origin);

        if (isRestrictedRoute(url.pathname)) {
            event.preventDefault(); // Evitamos recarga brusca del navegador

            const { canonicalPath } = parseRoute(url.pathname);
            
            // Validamos/cargamos los datos contra el endpoint de la API con authFetch
            const apiEndpoint = `/api${canonicalPath}`;
            try {
                const response = await authFetch(apiEndpoint, { method: 'GET' });
                
                if (response.ok) {
                    // Si todo está correcto y tenemos sesión válida, navegamos a la vista
                    window.history.pushState({}, '', link.href);
                    
                    // Disparar evento personalizado para que la vista cargue los datos
                    window.dispatchEvent(new CustomEvent('page-navigated', { 
                        detail: { 
                            path: url.pathname, 
                            canonicalPath, 
                            data: await response.json() 
                        } 
                    }));
                }
            } catch (err) {
                console.error('Error al verificar ruta protegida:', err);
            }
        }
    });
}