import generateValidationToken from '../../notifications/notificationsTools/generateValidationToken.js';
import sendEmail from '../../notifications/sendEmail.js';
import { redisClient } from '../../db/openRedis.js';
import systemConfig from '../../globalData/systemConfig.js';

export default async function sendEmailVerificationHandler(req, res) {
    const { email } = req.body || {};

    if (!email) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ status: 'error', message: 'Email requerido' }));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Control de enfriamiento / Cooldown (Anti-Spam)
    if (redisClient && redisClient.isOpen) {
        const cooldownKey = `cooldown:email:${normalizedEmail}`;
        const inCooldown = await redisClient.get(cooldownKey);
        if (inCooldown) {
            const ttl = await redisClient.ttl(cooldownKey);
            res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                status: 'error',
                message: `Espera ${ttl} segundos antes de pedir otro código.`
            }));
        }
        await redisClient.set(cooldownKey, '1', { EX: 60 });
    }

    // 2. Generar código en Redis
    const code = await generateValidationToken(normalizedEmail);

    // 3. Enviar correo usando tu módulo AWS existente
    await sendEmail({
        email: normalizedEmail,
        code: code,
        type: 'VERIFICATION_CODE'
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
        status: 'ok',
        message: 'Código de verificación enviado'
    }));
}