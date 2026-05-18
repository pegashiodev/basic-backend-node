



import {randomUUID} from 'crypto'
import { hashToken } from '../tools/tokenGenerator.js'
import systemConfig from '../globalData/systemConfig.js';


export default function(name, email, stamp){

    const stk = randomUUID();
    const now = Date.now();
    const expireTime = Date.now() + systemConfig.TOKENS_AGE.SECURITY_TOKEN

    const accessData = {stk: stk , name: name, email: email, expireTime: expireTime, stamp:stamp}
    const securityToken = hashToken(JSON.stringify(accessData));
    
    
    return {status: 'ok', stk, securityToken, expireTime}

}