/**
 * HANDLER DE REGISTRO POR EMAIL (SIGNUP)
 */

import generateValidationToken, { checkValidationToken } from '../../notifications/notificationsTools/generateValidationToken.js';
import sendEmail from '../../notifications/sendEmail.js';
import userHandler from '../../users/userHandler.js';
import { createSession } from '../../sessions/sessionHandler.js';
import { existingRedisUserByEmail } from '../../db/redisService.js';
import { redisClient } from '../../db/openRedis.js';
import systemConfig from '../../globalData/systemConfig.js';
import verifyTokensAndSetCookie from '../../tools/verifyTokensAndSetCookie.js';
import passwordValidation from '../routerTools/passwordValidation.js';
import emailValidation from '../routerTools/emailValidation.js';
import { validatePromotion } from '../../promotions/promotionsHandler.js';

//const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function signUpEmailHandler(req, res) {
    const { email, password, name, code, userAgent, deviceId, language, promoCode } = req.body || {};

console.log({ email, password, name, code, userAgent, deviceId, language, promoCode })
    
    if (!email || !emailValidation(email)) {
        res.writeHead(415, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'error',
            code: 415,
            message: 'Dirección de correo electrónico inválida.'
        }));
    }
    const normalizedEmail = email.toLowerCase().trim();

    try {
        // 1. Comprobar existencia previa instantáneamente en Redis (O(1))
        const existingUser = await existingRedisUserByEmail(normalizedEmail);
// if (existingUser) {
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

            const lang = language || systemConfig.MAIN_LANGUAGE || 'es';
            const emailResult = await sendEmail({
                email: normalizedEmail,
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

        // VALIDAMOS QUE EL FORMATO DE LA PASSWORD ES CORRECTO
        const isValidPassword = passwordValidation(password)

        if (!isValidPassword) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 401,
                message: 'El formato del Password es incorrecto'
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
        let session_result = await createSession(req, 'SIGNUP-EMAIL');
        if(session_result.status !== "ok"){
            res.writeHead(505, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                code: 505,
                message: 'Error el crear la session'
            }));
        }

        // Configurar tokens y cookies vinculando el sessionId
        await verifyTokensAndSetCookie(req, "SIGNUP-EMAIL");

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