

/**
 * HANDLER DE AUTENTICACIÓN (LOGIN DIRECTO: EMAIL + PASSWORD)
 */

import userHandler from '../../users/userHandler.js';
import { createSession } from '../../sessions/sessionHandler.js';
import { comparePassword } from '../routerTools/passwordEncript.js'
import verifyTokensAndSetCookie from "../../tools/verifyTokensAndSetCookie.js"
import systemConfig from '../../globalData/systemConfig.js';
import emailValidation from '../routerTools/emailValidation.js';

export default async function logInEmailHandler(req, res) {
    const { email, password, deviceId, userAgent } = req.body || {};

    // 1. Validación básica del payload
    if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 400,
            message: 'Email y contraseña requeridos.'
        }));
    }
    // COMPROBAMOS EL FORMATO DEL EMAIL
    if (!emailValidation(email)) {
        res.writeHead(415, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 415,
            message: 'Formato del email incorrecto'
        }));
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        // 2. Obtener usuario usando el puntero en Redis (user:idx:<email>) -> MongoDB
        const user = await userHandler.getUserByEmail(cleanEmail);
// console.log(user)
        if (!user || !user.password) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 401,
                message: 'Credenciales inválidas.'
            }));
        }

        // 3. Comprobar estado de la cuenta
        if (user.status && user.status !== 'ACTIVE') {
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 403,
                message: 'Cuenta deshabilitada o suspendida.'
            }));
        }

        // 4. Comparar hash de contraseña
        const isPasswordMatch = await comparePassword(password, user.password);

        if (!isPasswordMatch) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 401,
                message: 'Credenciales inválidas.'
            }));
        }

        // 5. Preparar datos de sesión e inyectar en req
        req.user = user;
        if (!req.body) req.body = {};
        req.body.deviceId = deviceId || '';
        req.body.userAgent = userAgent || req.headers['user-agent'] || '';

        // 6. Crear la sesión activa (persiste en Redis y MongoDB)
        await createSession(req, 'LOGIN');

        // 7. Generar tokens vinculados al sessionId y poblar req.cookie con las cabeceras Set-Cookie
        await verifyTokensAndSetCookie(req, 'LOGIN-EMAIL');

        // 8. Construir cabeceras HTTP y adjuntar Set-Cookie
        const headers = { 'Content-Type': 'application/json; charset=utf-8' };
        if (req.cookie && Array.isArray(req.cookie)) {
            headers['Set-Cookie'] = req.cookie;
        }

        // 9. Enviar respuesta exitosa al cliente

        // recuperamos la direccion desde la que llego al login si exite
        let location = systemConfig.PAGES.URL_AFTER_LOGIN
        if(req.urlData.searchParams?.redirect){
            location = `${systemConfig.PAGES.URL_AFTER_LOGIN}/?${req.urlData.searchParams.redirect}`
        }
        res.writeHead(200, headers);
        return res.end(JSON.stringify({
            status: 'ok',
            code: 200,
            message: 'Autenticación correcta.',
            data: {
                userId: user.userId || (user._id && user._id._id) || user._id,
                email: user.email || (user._id && user._id.email),
                name: user.name || '',
                role: user.role || 'USER',
            }, 
            location
        }));

    } catch (error) {
        console.error('❌ Error en logInEmailHandler:', error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 500,
            message: 'Error interno del servidor durante la autenticación.'
        }));
    }
}