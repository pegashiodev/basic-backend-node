

import { randomUUID } from 'node:crypto';
import { hashToken } from './tokenGenerator.js';
import systemConfig from '../globalData/systemConfig.js';

export default function generateRefreshToken(name, email, sessionId) {
    const rtkId = randomUUID();
    const expireTime = Date.now() + systemConfig.TOKENS_AGE.REFRESH_TOKEN;

    const refreshData = {
        rtk: rtkId,
        sessionId: sessionId,
        name: name,
        email: email,
        expireTime: expireTime
    };

    const refreshToken = hashToken(refreshData);
    return { status: 'ok', rtk: rtkId, sessionId, refreshToken, expireTime };
}