

/**
 * 
 *  generamos el SecurityToken de la Cookie del sistema para acceder al panel de control
 * 
 */


import {randomUUID} from 'crypto'
import { hashToken } from './tokenGenerator.js'
import systemConfig from '../globalData/systemConfig.js';

/**
 * 
 * @param {String} name  -> NOMBRE DEL USUARIO
 * @param {String} email -> EMAIL DEL USUARIO
 * @param {String} stamp -> 
 * @returns {Object} -> {status, stk, securityToken, expireTime}
 */


export default function(name, email, stamp){

    const stk = randomUUID();
    const now = Date.now();
    const expireTime = Date.now() + systemConfig.TOKENS_AGE.SECURITY_TOKEN

    const accessData = {stk: stk , name: name, email: email, expireTime: expireTime, stamp:stamp}
    const securityToken = hashToken(JSON.stringify(accessData));
    
    
    return {status: 'ok', stk, securityToken, expireTime}

}