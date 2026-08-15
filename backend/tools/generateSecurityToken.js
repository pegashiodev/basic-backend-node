

import { randomUUID } from 'node:crypto';
import { hashToken } from './tokenGenerator.js';
import systemConfig from '../globalData/systemConfig.js';

export default function generateSecurityToken(name, email, stamp) {
    const stkId = randomUUID();
    const expireTime = Date.now() + systemConfig.TOKENS_AGE.SECURITY_TOKEN;

    const accessData = {
        stk: stkId,
        name: name,
        email: email,
        stamp: stamp || Date.now(),
        expireTime: expireTime
    };

    const securityToken = hashToken(accessData);
    return { status: 'ok', stk: stkId, securityToken, expireTime };
}