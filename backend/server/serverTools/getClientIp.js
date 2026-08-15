

/**
 * Extrae la dirección IP real del cliente considerando cabeceras de Proxy inverso
 */
export default function getClientIp(req) {
    // 1. Cabecera inyectada por Cloudflare (si se usa)
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) return cfIp.trim();

    // 2. Cabecera estándar de proxy (Nginx / balanceadores)
    // Puede venir como lista separada por comas: "cliente, proxy1, proxy2"
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // 3. Fallback al socket TCP directo (Desarrollo local sin Nginx)
    const socketAddress = req.socket?.remoteAddress || req.connection?.remoteAddress;
    
    // Normalizar IPv6 loopback (::1 o ::ffff:127.0.0.1 -> 127.0.0.1)
    if (socketAddress === '::1' || socketAddress === '::ffff:127.0.0.1') {
        return '127.0.0.1';
    }

    return socketAddress || 'unknown';
}