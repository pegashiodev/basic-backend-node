

import { randomUUID } from 'node:crypto';
import { hashToken } from './tokenGenerator.js';
import systemConfig from '../globalData/systemConfig.js';

export default function generateRefreshToken(name, email) {
    const rtkId = randomUUID();
    const expireTime = Date.now() + systemConfig.TOKENS_AGE.REFRESH_TOKEN;

    const refreshData = {
        rtk: rtkId,
        name: name,
        email: email,
        expireTime: expireTime
    };

    const refreshToken = hashToken(refreshData);
    return { status: 'ok', rtk: rtkId, refreshToken, expireTime };
}