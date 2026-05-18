

import {randomUUID} from 'crypto'
import { hashToken } from '../tools/tokenGenerator.js'
import systemConfig from '../globalData/systemConfig.js';


export default function(name, email, rtk){

    const atk = randomUUID();
    const now = Date.now();
    const expireTime = Date.now() + systemConfig.TOKENS_AGE.ACCESS_TOKEN

    const accessData = {atk: atk , rtk: rtk,  name: name, email: email, expireTime: expireTime}
    const accessToken = hashToken(JSON.stringify(accessData));
    
    
    return {status: 'ok', atk, accessToken, expireTime}

}