

/**
 * HANDLER DE AUTENTICACIÓN (LOGIN DIRECTO: EMAIL + PASSWORD)
 */

import { redisClient } from '../../db/openRedis.js';
import { getDb } from '../../db/openDbs.js';
import { createSession } from '../../sessions/sessionHandler.js';
import { comparePassword } from '../routerTools/passwordEncript.js';

/**
 * Procesa la solicitud de login por email y contraseña
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} reply - Objeto de respuesta
 * @returns {Promise<Object>}
 */
export default async function logInEmailHandler(req, reply) {
    const { email, password } = req.body || {};

    // 1. Validación de entrada
    if (!email || !password) {
        return reply.code(400).send({
            status: 'error',
            message: 'Email y contraseña requeridos.'
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        // 2. Localizar puntero del usuario en Redis
        const userIndexRaw = await redisClient.get(`user:email:${cleanEmail}`);

        if (!userIndexRaw) {
            return reply.code(401).send({
                status: 'error',
                message: 'Credenciales inválidas.'
            });
        }

        const userIndex = JSON.parse(userIndexRaw);
        const { userId, collectionMonth } = userIndex;

        // 3. Obtener el usuario de MongoDB
        const db = getDb('users_data');
        const usersCollection = db.collection(collectionMonth);

        const user = await usersCollection.findOne({ userId });

        if (!user || !user.password) {
            return reply.code(401).send({
                status: 'error',
                message: 'Credenciales inválidas.'
            });
        }

        if (user.status && user.status !== 'active') {
            return reply.code(403).send({
                status: 'error',
                message: 'Cuenta deshabilitada o suspendida.'
            });
        }

        // 4. Comparar usando el método propio de passwordEncript
        const isPasswordMatch = await comparePassword(password, user.password);

        if (!isPasswordMatch) {
            return reply.code(401).send({
                status: 'error',
                message: 'Credenciales inválidas.'
            });
        }

        // 5. Metadatos de la sesión
        const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // 6. Crear la sesión (guarda en Redis + persiste en MongoDB)
        const session = await createSession({
            userId: user.userId,
            email: cleanEmail,
            role: user.role || 'user',
            ip: clientIp,
            userAgent: userAgent
        });

        // 7. Respuesta al cliente
        return reply.code(200).send({
            status: 'ok',
            message: 'Autenticación correcta.',
            sessionId: session.customId.sessionId,
            user: {
                userId: user.userId,
                email: cleanEmail,
                name: user.name || '',
                role: user.role || 'user'
            }
        });

    } catch (error) {
        console.error('❌ Error en logInEmailHandler:', error);
        return reply.code(500).send({
            status: 'error',
            message: 'Error interno del servidor durante la autenticación.'
        });
    }
}