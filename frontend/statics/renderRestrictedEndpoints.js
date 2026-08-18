

//<script>


import { initRouteGuard, isRestrictedRoute, parseRoute } from './routeGuard.js';
import { authFetch } from './apiClient.js';

// 1. Inicializar escuchadores de clicks y popstate
initRouteGuard();

// 2. Control de F5 / Carga Inicial Directa
async function handleInitialLoad() {
    const currentPath = window.location.pathname;

    if (isRestrictedRoute(currentPath)) {
        const { canonicalPath } = parseRoute(currentPath);
        
        // Petición inicial con authFetch (se autorefrescará si el token venció)
        const response = await authFetch(`/api${canonicalPath}`, { method: 'GET' });

        if (response.ok) {
            const data = await response.json();
            // Disparar evento para pintar la vista correspondiente
            window.dispatchEvent(new CustomEvent('page-navigated', { 
                detail: { path: currentPath, canonicalPath, data } 
            }));
        }
    }
}

// Ejecutar al cargar la página tras F5
window.addEventListener('DOMContentLoaded', handleInitialLoad);


// Escuchar cuando el usuario pulsa "Atrás" o "Adelante"
window.addEventListener('popstate', async () => {
    const currentPath = window.location.pathname;
    
    // 1. Si vuelve a una ruta restringida (ej. /user o /mis-bots)
    if (isRestrictedRoute(currentPath)) {
        const { canonicalPath } = parseRoute(currentPath);
        //const response = await authFetch(`/api${canonicalPath}`, { method: 'GET' });
        const response = await authFetch(`${canonicalPath}`, { method: 'GET' });

        
        if (response.ok) {
            // Disparar evento personalizado para que la vista cargue los datos
            window.dispatchEvent(new CustomEvent('page-navigated', { 
                detail: { 
                    path: currentPath,
                    canonicalPath, 
                    data: await response.json() 
                } 
            }));
            
            
        }
    } else {
        // 2. Si vuelve a la Home u otra página pública
        renderHome();
    }
});


// Escuchar cuando el usuario accede a una ruta protegida con éxito
window.addEventListener('page-navigated', (e) => {
    const { canonicalPath, data } = e.detail;
    console.log('✅ Navegación autorizada a:', canonicalPath, 'Datos:', data);
    
    // Aquí renderizas tu componente o actualizas el DOM correspondiente
    if (canonicalPath === '/mis-bots') {
        // renderMisBots(data);
    } else if (canonicalPath === '/user') {
        // renderUserProfile(data);
    }
});

//</script>
