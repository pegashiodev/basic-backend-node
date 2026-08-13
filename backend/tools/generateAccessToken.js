

/**
 * 
 *  generamos el AccessToken de la Cookie del sistema
 * 
 */


import {randomUUID} from 'crypto'
import { hashToken } from './tokenGenerator.js'
import systemConfig from '../globalData/systemConfig.js';

/**
 * 
 * @param {} name  -> NOMBRE DEL USUARIO
 * @param {*} email -> EMAIL DEL USUARIO
 * @param {*} rtk -> REFRESH TOKEN 
 * @returns {Object} -> {status, atk, accessToken, expireTime}
 */
export default function(name, email, rtk){

    const atk = randomUUID();
    const now = Date.now();
    const expireTime = Date.now() + systemConfig.TOKENS_AGE.ACCESS_TOKEN

    const accessData = {atk: atk , rtk: rtk,  name: name, email: email, expireTime: expireTime}
    const accessToken = hashToken(JSON.stringify(accessData));
    
    
    return {status: 'ok', atk, accessToken, expireTime}

}