

/**
 * HANDLER PARA AUTENTICACIÓN GOOGLE OAUTH 2.0 (POST /api/auth/google)
 */

import { OAuth2Client } from 'google-auth-library';
import crypto from 'node:crypto';
import userHandler from '../../users/userHandler.js';
import sessionHandler from '../../sessions/sessionHandler.js';
import { verifyTokensAndSetCookie } from '../../tools/verifyTokensAndSetCookie.js';
import { getDb } from '../../db/openDbs.js';
import redisClient from '../../db/openRedis.js';
import systemConfig from '../../globalData/systemConfig.js';
process.loadEnvFile();


// Inicializar cliente con el Client ID configurado en variables de entorno o systemConfig
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function googleAuthHandler(req, res) {
    const { id_google_token } = req.body || {};

    // 1. Validación básica de entrada
    if (!id_google_token) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 400,
            message: 'id_token de Google no proporcionado.'
        }));
    }

    // COMPROBAMOS EL CODIGO DE LA PROMO SI EXISTE Y EL SISTEMA LOS ADMITE
    if(promoCode && promoCode.trim().length > 2){

        if(promoCode && !systemConfig.HAS_PROMO_CODES_SIGNUP){
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 466,
                message: 'La plataforma no admite PROMO CODES'
            }));
        }
        
        // VERIFICAMOS EL CODIGO DE LA PROMO RECIBIDO
        const result_promoCode = await validatePromotion(req, "SIGNUP")
        if(result_promoCode.status !== "ok"){
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: result_promoCode.status,
                code: result_promoCode.code,
                message: result_promoCode.message
            }));
        }

    }

    try {
        // 2. Verificar la firma del JWT con Google
        const ticket = await client.verifyIdToken({
            idToken: id_google_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 401,
                message: 'Token de Google inválido o sin correo asociado.'
            }));
        }

        body.email = payload.email.trim().toLowerCase();
        body.googleSubId = payload.sub; // Identificador único de usuario en Google
        body.name = payload.name || payload.given_name || 'Usuario';
        body.picture = payload.picture || '';

        // 3. Buscar si el usuario ya existe en nuestro sistema
        let user = await userHandler.getUserByEmail(normalizedEmail);

        // 4. Si el usuario NO existe, lo registramos automáticamente (Signup)
        if (!user) {

            // Crear usuario mediante userHandler (Mongo + Redis Pointer)
            req.body.ip = req.ip;
            const userResult = await userHandler.addUser(req.body);
            if (userResult.status !== 'ok') {
                res.writeHead(userResult.code || 500, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify(userResult));
            }

            // Crear sesión y generar cookies Set-Cookie
            req.user = userResult.user;
            req.user.ip = req.ip;
            let session_result = await createSession(req, 'SIGNUP-GOOGLE');
            if(session_result.status !== "ok"){
                res.writeHead(505, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 505,
                    message: 'Error el crear la session'
                }));
            }
    
            // Configurar tokens y cookies vinculando el sessionId
            await verifyTokensAndSetCookie(req, "SIGNUP-GOOGLE");
    
            const headers = { 'Content-Type': 'application/json; charset=utf-8' };
            if (req.cookie && Array.isArray(req.cookie)) {
                headers['Set-Cookie'] = req.cookie;
            }
    
            // recuperamos la direccion desde la que llego al login si exite
            let location = systemConfig.PAGES.URL_AFTER_SIGNUP
            if(req.urlData.searchParams?.redirect){
                location = req.urlData.searchParams.redirect
            }
    
            res.writeHead(200, headers);
            return res.end(JSON.stringify({
                status: 'ok',
                code: 200,
                step: 'COMPLETED',
                message: 'Registro completado con éxito.',
                data: {
                    name: userResult.user.name,
                    email: userResult.user.email,
                    role: userResult.user.role
                },
                location
            }));
           
        }

        // 5. Comprobar si la cuenta está bloqueada o suspendida
        if (user.status && user.status !== 'ACTIVE') {
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 403,
                message: 'Cuenta deshabilitada o suspendida.'
            }));
        }

        // 6. Asignar usuario a la petición y generar la sesión
        req.user = user;
        if (!req.body) req.body = {};
        req.body.deviceId = req.body.deviceId || '';
        req.body.userAgent = req.headers['user-agent'] || '';

        // Crea sesión activa (en Redis y MongoDB)
        await sessionHandler.addSession(req, 'LOGIN-GOOGLE');

        // Genera access token y refresh token vinculados a la sesión
        await verifyTokensAndSetCookie(req, req.user, 'LOGIN-GOOGLE');

        // 7. Preparar cabeceras con las cookies generadas
        const headers = { 'Content-Type': 'application/json; charset=utf-8' };
        if (req.cookie && Array.isArray(req.cookie)) {
            headers['Set-Cookie'] = req.cookie;
        }

        // 8. Respuesta de éxito al cliente
        res.writeHead(200, headers);
        return res.end(JSON.stringify({
            status: 'ok',
            code: 200,
            message: 'Autenticación con Google completada con éxito.',
            location: systemConfig.PAGES.URL_AFTER_LOGIN,
            data: {
                //userId: user.userId,
                name: userResult.user.name,
                email: userResult.user.email,
                role: userResult.user.role
            }
        }));

    } catch (error) {
        console.error('❌ Error en googleAuthHandler:', error);
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 401,
            message: 'Fallo al verificar el token con Google.'
        }));
    }
}