

//<script>

import { initRouteGuard } from './routeGuard.js';

initRouteGuard();

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
