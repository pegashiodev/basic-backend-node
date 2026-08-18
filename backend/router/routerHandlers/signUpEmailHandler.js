/**
 * HANDLER DE REGISTRO POR EMAIL (SIGNUP)
 */

import generateValidationToken, { checkValidationToken } from '../../notifications/notificationsTools/generateValidationToken.js';
import sendEmail from '../../notifications/sendEmail.js';
import userHandler from '../../users/userHandler.js';
import { createSession } from '../../sessions/sessionHandler.js';
import { getUserPointer } from '../../db/userIndexService.js';
import { redisClient } from '../../db/openRedis.js';
import systemConfig from '../../globalData/systemConfig.js';
import verifyTokensAndSetCookie from '../../tools/verifyTokensAndSetCookie.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function signUpEmailHandler(req, res) {
    const { email, password, name, code, userAgent, deviceId, language } = req.body || {};

console.log({ email, password, name, code, userAgent, deviceId, language })
    
    if (!email || !EMAIL_REGEX.test(email.trim())) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 400,
            message: 'Dirección de correo electrónico inválida.'
        }));
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        // 1. Comprobar existencia previa instantáneamente en Redis (O(1))
        const existingPointer = await getUserPointer(normalizedEmail);
// if (existingPointer) {
//     res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
//     return res.end(JSON.stringify({
//         status: 'error',
//         code: 409,
//         message: 'El correo electrónico ya se encuentra registrado.'
//     }));
// }

        // =====================================================================
        // FASE 1: NO SE ENVIÓ CÓDIGO -> GENERAR Y ENVIAR CÓDIGO POR EMAIL
        // =====================================================================
        if (!code) {
            if (redisClient && redisClient.isOpen) {
                const cooldownKey = `cooldown:email:${normalizedEmail}`;
                const inCooldown = await redisClient.get(cooldownKey);
                if (inCooldown) {
                    const ttl = await redisClient.ttl(cooldownKey);
                    res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({
                        status: 'error',
                        code: 429,
                        message: `Por favor espera ${ttl} segundos antes de solicitar otro código.`
                    }));
                }
                await redisClient.set(cooldownKey, '1', { EX: 60 });
            }

            const validationCode = await generateValidationToken(normalizedEmail);
            const lang = language || systemConfig.MAIN_LANGUAGE || 'es';
            const emailResult = await sendEmail({
                email: normalizedEmail,
                code: validationCode,
                type: 'VERIFICATION_CODE',
                language: lang
            });

            if (emailResult && emailResult.status === 'error') {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    status: 'error',
                    code: 500,
                    message: 'No se pudo enviar el correo de verificación.'
                }));
            }
console.log({validationCode})
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'ok',
                code: 200,
                step: 'CODE_SENT',
                message: 'Código de verificación enviado al correo.'
            }));
        }

        // =====================================================================
        // FASE 2: SE RECIBIÓ EL CÓDIGO -> VALIDAR, CREAR USUARIO Y CREAR SESIÓN
        // =====================================================================
        if (!password || typeof password !== 'string' || password.length < 6) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 400,
                message: 'La contraseña debe tener al menos 6 caracteres.'
            }));
        }

        // Validar y destruir el código en Redis
        const isValidCode = await checkValidationToken(normalizedEmail, code);
        if (!isValidCode) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 401,
                message: 'El código de verificación es incorrecto o ha expirado.'
            }));
        }

        // Crear usuario mediante userHandler (Mongo + Redis Pointer)
        const userResult = await userHandler.addUser(req.body);
        if (userResult.status !== 'ok') {
            res.writeHead(userResult.code || 500, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify(userResult));
        }

        // Crear sesión y generar cookies Set-Cookie
        req.user = userResult.user;
        req.user.ip = req.ip;
        let session_result = await createSession(req.user, 'SIGNUP-EMAIL');
        if(session_result.status !== "ok"){
            res.writeHead(505, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 505,
                message: 'Error el crear la session'
            }));
        }

        // Configurar tokens y cookies vinculando el sessionId
        await verifyTokensAndSetCookie(req, req.user, "SIGNUP-EMAIL");

        const headers = { 'Content-Type': 'application/json; charset=utf-8' };
        if (req.cookie && Array.isArray(req.cookie)) {
            headers['Set-Cookie'] = req.cookie;
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
            }
        }));

    } catch (error) {
        console.error('❌ Error en signUpEmailHandler:', error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 500,
            message: 'Error interno en el servidor.'
        }));
    }
}