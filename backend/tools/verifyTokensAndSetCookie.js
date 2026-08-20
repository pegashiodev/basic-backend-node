/**
 * VERIFICA Y REFRESCA TOKENS CON ESTADO EN REDIS VINCULADOS POR SESSION_ID
 */

import { getSession } from "../sessions/sessionHandler.js";
import { redisClient } from "../db/openRedis.js";
import generateAccessToken from "./generateAccessToken.js";
import generateRefreshToken from "./generateRefreshToken.js";
import generateSecurityToken from "./generateSecurityToken.js";
import systemConfig from "../globalData/systemConfig.js";

export default async function verifyTokensAndSetCookie(req, from) {
    let accessData, refreshData;
    let changeOnlyAtk = false;
    req.set_new_cookie = false;
    req.session_expired = false;
    req.get_rtk = false;
    const now = Date.now();

    const user = req.user
    const userEmail = user?.email || req.our_cookie?.atk_decoded?.email;
    const userName = user?.name || req.our_cookie?.atk_decoded?.name;
    const sessionId = req.currentSessionId || req.our_cookie?.atk_decoded?.sessionId || req.our_cookie?.rtk_decoded?.sessionId;

    // 1. NUEVA SESIÓN (Login o Signup)
    if (from === "SIGNUP-EMAIL" || from === "LOGIN-EMAIL") {
        req.set_new_cookie = true;
        refreshData = generateRefreshToken(userName, userEmail, sessionId);
        req.refreshData = refreshData;

        accessData = generateAccessToken(userName, userEmail, sessionId);
        req.accessData = accessData;

    // 2. ACCESO AL PANEL DE ADMINISTRACIÓN
    } else if (from === "ACCESS_REMOTE_PANNEL") {
        const pannelAccessData = generateSecurityToken(userName, userEmail, Date.now());
        req.pannelAccessData = pannelAccessData;
        req.set_new_cookie = true;

    // 3. VERIFICACIÓN Y RENOVACIÓN DE TOKENS EXISTENTES
    } else {
        if (!sessionId) return;

        const session = await getSession(sessionId);
        if (session) {

            // 3.1 COMPROBAMOS SI LA SESSION HA EXPIRADO
            if(now > session.expiresAt ){
                req.session_expired = true
                return
            }

            const atk = req.our_cookie?.atk_decoded || null;
            const rtk = req.our_cookie?.rtk_decoded || null;

            const atkExpiry = req.our_cookie?.atk_decoded?.expireTime || 0;
            const rtkExpiry = req.our_cookie?.rtk_decoded?.expireTime || 0;

            // 3.2 SOLO RECIBIMOS EL ACCESS-TOKEN -> COMPROBAMOS SI ESTA EXPIRADO
            if(atk && !rtk){
                // SI ATK EXPIRADO -> MARCAMOS "req" para solicitar el elvio del refress-token
                if (atkExpiry < now) {
                    req.get_rtk = true;
                    return; 
                }
            
            // 3.3 SE HA RECIBIDO ACCESS-TOKEN Y REFRES-TOKEN -> ALGUNO ESTA CADUCADO
            }else if(atk && rtk){

                // 3.4 PRIMERO COMPRUEBO QUE CONTIENEN EL MISMO "sessionId"
                if(atk.sessionId !== rtk.sessionId){
                    // TOKENS NO RELACIONADOS O MANIPULADOS. MARCAMOS COMO QUE NO HAY SESSION Y ENVIAMOS AL LOGIN

                    // Eliminar directamente ambas claves de Redis
                    const keysToDelete = [];
                    if (atk.sessionId) keysToDelete.push(`session:${atk.sessionId}`);
                    if (rtk.sessionId) keysToDelete.push(`session:${rtk.sessionId}`);

                    if (keysToDelete.length > 0) {
                        await redisClient.del(keysToDelete); // redisClient.del acepta un array o múltiples claves
                    }
                    req.session_expired = true
                    return;
                
                // 3.5 COMPROBAMOS SI ATK ESTA EXPIRADO
                }else if(atkExpiry){
                    // RENOVAMOS ATK
                    req.set_new_cookie = true;
                    accessData = generateAccessToken(userName, userEmail, sessionId);
                    req.accessData = accessData;

                    session.atk = accessData.atk;
                    const ttl = await redisClient.ttl(`session:${sessionId}`);
                    if (ttl > 0) {
                        await redisClient.set(`session:${sessionId}`, JSON.stringify(session), { EX: ttl });
                    }

                    // 3.6 COMPROBAMOS SI RTK ESTA EXPIRARO
                    if(rtkExpiry){
                        // RENOVAMOS RTK
                        req.set_new_cookie = true;
                        refreshData = generateRefreshToken(userName, userEmail, sessionId);
                        req.refreshData = refreshData;

                        accessData = generateAccessToken(userName, userEmail, sessionId);
                        req.accessData = accessData;

                        // Actualizar identificadores en la sesión de Redis
                        session.rtk = refreshData.rtk;
                        const ttl = await redisClient.ttl(`session:${sessionId}`);
                        if (ttl > 0) {
                            await redisClient.set(`session:${sessionId}`, JSON.stringify(session), { EX: ttl });
                        }

                    // 3.7SI RTK NO EXPIRADO, MARCAMOS PARA CAMBIAR UNICAMENTE ATK
                    }else{
                        changeOnlyAtk = true;
                    }
                }

            // NO HAY NINGUNO DE NUESTROS TOKENS ??
            }else{
                req.session_expired = true
                return
            }
           
        
        // NO HAY SESSION -> MARCAMOS EN "req" para que enviar al usuario al login
        }else{
            req.session_expired = true
            return
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
                //`deviceId=${devId}; ${cookie_deviceId_params}`
            ];
        }
    }
}