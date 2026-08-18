

/**
 * authFetch.js - Envoltorio de fetch nativo con intercepción de 401 y refresco silencioso
 */

let isRefreshing = false;
let refreshSubscribers = [];

// Notifica a las peticiones encoladas tras renovar el token
function onRefreshed(success) {
    refreshSubscribers.forEach(callback => callback(success));
    refreshSubscribers = [];
}

// Suscribe peticiones pendientes mientras se procesa un refresco en curso
function subscribeTokenRefresh(callback) {
    refreshSubscribers.push(callback);
}

/**
 * Función principal para hacer llamadas seguras al backend
 */
export async function authFetch(url, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };

    const config = {
        ...options,
        credentials: 'include', // Imprescindible para enviar/recibir cookies HttpOnly
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    let response = await fetch(url, config);

    // Si el accessToken expiró (401 Unauthorized)
    if (response.status === 401) {
        if (!isRefreshing) {
            isRefreshing = true;

            try {
                // Endpoint exclusivo de refresco (coincide con el Path de la cookie del refreshToken)
                const refreshResponse = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (refreshResponse.ok) {
                    isRefreshing = false;
                    onRefreshed(true);
                    // Reintentar la petición original
                    return fetch(url, config);
                } else {
                    // El refreshToken también expiró o la sesión fue destruida
                    isRefreshing = false;
                    onRefreshed(false);
                    handleSessionExpired();
                    return response;
                }
            } catch (err) {
                isRefreshing = false;
                onRefreshed(false);
                handleSessionExpired();
                return response;
            }
        }

        // Si ya había un refresco en curso, esperamos a que termine
        return new Promise((resolve) => {
            subscribeTokenRefresh((success) => {
                if (success) {
                    resolve(fetch(url, config));
                } else {
                    resolve(response);
                }
            });
        });
    }

    return response;
}

function handleSessionExpired() {
    console.warn('⚠️ Sesión caducada o inválida. Redirigiendo a login...');
    // Redirigir según idioma actual si es necesario
    const currentLang = window.location.pathname.split('/')[1]?.length === 2 
        ? `/${window.location.pathname.split('/')[1]}` 
        : '';
    window.location.href = `${currentLang}/login`;
}