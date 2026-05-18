


import {randomUUID} from 'crypto'
import { hashToken } from '../tools/tokenGenerator.js';
import systemConfig from '../globalData/systemConfig.js';



export default function(name, email){

    const atk = randomUUID();
    const now = Date.now();
    const expireTime = Date.now() + systemConfig.TOKENS_AGE.REFRESH_TOKEN
    
    const rtk = randomUUID();
    const refreshData = {rtk: rtk, email: email, expireTime: expireTime }
    const refreshToken = hashToken(JSON.stringify(refreshData))

    return {status: 'ok',  rtk, refreshToken, expireTime}
    


}