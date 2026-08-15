


/**
 * VERIFICA Y REFRESCA TOKENS CON ESTADO EN REDIS
 */

import { getSession } from "../sessions/sessionHandler.js";
import { redisClient } from "../db/openRedis.js";
import generateAccessToken from "./generateAccessToken.js";
import generateRefreshToken from "./generateRefreshToken.js";
import generateSecurityToken from "./generateSecurityToken.js";
import systemConfig from "../globalData/systemConfig.js";

export default async function verifyTokensAndSetCookie(req, user, from) {
    let accessData, refreshData;
    let changeOnlyAtk = false;
    req.set_new_cookie = false;
    const now = Date.now();

    const userEmail = user?.email || req.our_cookie?.atk_decoded?.email;
    const userName = user?.name || req.our_cookie?.atk_decoded?.name;

    // 1. NUEVA SESIÓN (Login o Signup)
    if (from === "ADD_SESSION") {
        req.set_new_cookie = true;
        refreshData = generateRefreshToken(userName, userEmail);
        req.refreshData = refreshData;

        accessData = generateAccessToken(userName, userEmail);
        req.accessData = accessData;

    // 2. ACCESO AL PANEL DE ADMINISTRACIÓN
    } else if (from === "ACCESS_REMOTE_PANNEL") {
        const pannelAccessData = generateSecurityToken(userName, userEmail, Date.now());
        req.pannelAccessData = pannelAccessData;
        req.set_new_cookie = true;

    // 3. VERIFICACIÓN Y RENOVACIÓN DE TOKENS EXISTENTES
    } else {
        const session = await getSession(userEmail);

        if (session) {
            const atkExpiry = req.our_cookie?.atk_decoded?.expireTime || 0;
            const rtkExpiry = req.our_cookie?.rtk_decoded?.expireTime || 0;

            // Si RTK ha expirado -> Renovamos RTK y ATK
            if (rtkExpiry < now) {
                req.set_new_cookie = true;
                refreshData = generateRefreshToken(userName, userEmail);
                req.refreshData = refreshData;

                accessData = generateAccessToken(userName, userEmail);
                req.accessData = accessData;

                // Actualizar identificadores en la sesión de Redis
                session.rtk = refreshData.rtk;
                session.atk = accessData.atk;
                const ttl = await redisClient.ttl(`session:${userEmail}`);
                if (ttl > 0) {
                    await redisClient.set(`session:${userEmail}`, JSON.stringify(session), { EX: ttl });
                }

            // Si solo el ATK ha expirado (RTK sigue vivo) -> Renovamos solo ATK
            } else if (atkExpiry < now) {
                req.set_new_cookie = true;
                accessData = generateAccessToken(userName, userEmail);
                req.accessData = accessData;

                session.atk = accessData.atk;
                const ttl = await redisClient.ttl(`session:${userEmail}`);
                if (ttl > 0) {
                    await redisClient.set(`session:${userEmail}`, JSON.stringify(session), { EX: ttl });
                }

                changeOnlyAtk = true;
            }
        }
    }

    // 4. GENERAR LOS STRINGS DE 'Set-Cookie'
    if (req.set_new_cookie) {
        const isDev = process.env.MODE === 'DEV';
        const cookie_rtk_params = isDev ? systemConfig.COOKIE.PARAMS_RTK_SIGNIN_DEV : systemConfig.COOKIE.PARAMS_RTK_SIGNIN_PROD;
        const cookie_atk_params = isDev ? systemConfig.COOKIE.PARAMS_ATK_SIGNIN_DEV : systemConfig.COOKIE.PARAMS_ATK_SIGNIN_PROD;
        const cookie_stk_params = isDev ? systemConfig.COOKIE.PARAMS_RTK_SIGNIN_DEV : systemConfig.COOKIE.PARAMS_ATK_SIGNIN_PROD;
        const cookie_deviceId_params = isDev ? systemConfig.COOKIE.PARAMS_DEVIDE_ID_DEV : systemConfig.COOKIE.PARAMS_DEVIDE_ID_PROD;

        if (from === "ACCESS_REMOTE_PANNEL") {
            req.cookie = [`stk=${req.pannelAccessData.securityToken}; ${cookie_stk_params}`];
        } else if (changeOnlyAtk) {
            req.cookie = [`atk=${req.accessData.accessToken}; ${cookie_atk_params}`];
        } else {
            const devId = req.body?.deviceId || req.our_cookie?.deviceId || '';
            req.cookie = [
                `atk=${req.accessData.accessToken}; ${cookie_atk_params}`,
                `rtk=${req.refreshData.refreshToken}; ${cookie_rtk_params}`,
                `deviceId=${devId}; ${cookie_deviceId_params}`
            ];
        }
    }
}