

/**
 * HANDLER DE AUTENTICACIÓN (LOGIN DIRECTO: EMAIL + PASSWORD)
 */

import { redisClient } from '../../db/openRedis.js';
import { getDb } from '../../db/openDbs.js';
import { createSession } from '../../sessions/sessionHandler.js';
import { comparePassword } from '../routerTools/passwordEncript.js';
import systemConfig from '../../globalData/systemConfig.js';

/**
 * Procesa la solicitud de login por email y contraseña
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta
 * @returns {Promise<Object>}
 */
export default async function logInEmailHandler(req, res) {
    const { email, password } = req.body || {};

console.log(req.body)

    const headers = { 'Content-Type': 'application/json; charset=utf-8' };

    // 1. Validación de entrada
    if (!email || !password) {
        res.writeHead(400, headers);
        return res.end(JSON.stringify({
            status: 'error',
            message: 'Email y contraseña requeridos.',
            
        }));
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        // 2. Localizar puntero del usuario en Redis
        const userIndexRaw = await redisClient.get(`user:email:${cleanEmail}`);
console.log(userIndexRaw)
        if (!userIndexRaw) {
            res.writeHead(401, headers);
            return res.end(JSON.stringify({
                status: 'error',
                message: 'Credenciales inválidas.',
                
            }));
        }

        const userIndex = JSON.parse(userIndexRaw);
        const { userId, collectionMonth } = userIndex;
console.log({userIndex})

        // 3. Obtener el usuario de MongoDB
        const db = getDb(systemConfig.DBS.USERS_DATA);
        const usersCollection = db.collection(collectionMonth);

        const user = await usersCollection.findOne({"_id._id": userId });
console.log({user})
        if (!user || !user.password) {
console.log("No user o No Password")
            res.writeHead(401, headers);
            return res.end(JSON.stringify({
                status: 'error',
                message: 'Credenciales inválidas.',
                
            }));
        }

        if (user.status && user.status !== 'ACTIVE') {
            res.writeHead(403, headers);
            return res.end(JSON.stringify({
                status: 'error',
                message: 'Cuenta deshabilitada o suspendida.',
                
            }));
        }

req.user = user;

        // 4. Comparar usando el método propio de passwordEncript
        const isPasswordMatch = await comparePassword(password, user.password);

        if (!isPasswordMatch) {
            res.writeHead(401, headers);
            return res.end(JSON.stringify({
                status: 'error',
                message: 'Credenciales inválidas.',
                
            }));
        
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
            }, "LOGIN-EMAIL"
        );

// Configurar tokens y cookies vinculando el sessionId
await verifyTokensAndSetCookie(req, req.user, "LOGIN-EMAIL");

        // 7. Respuesta al cliente
if (req.cookie && Array.isArray(req.cookie)) {
    headers['Set-Cookie'] = req.cookie;
}
        res.writeHead(200, headers);
        return res.end(JSON.stringify({
            status: 'ok',
            message: 'Autenticación correcta.',
            sessionId: session._id.sessionId,
            user: {
                userId: user.userId,
                email: cleanEmail,
                name: user.name || '',
                role: user.role || 'user'
            }
            
        }));

    } catch (error) {
        console.error('❌ Error en logInEmailHandler:', error);
        
        res.writeHead(500, headers);
        return res.end(JSON.stringify({
            status: 'error',
            message: 'Error interno del servidor durante la autenticación.',
            
        }));
    }
}