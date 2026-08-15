
import { randomUUID } from 'node:crypto';
import { hashToken } from './tokenGenerator.js';
import systemConfig from '../globalData/systemConfig.js';

export default function generateAccessToken(name, email) {
    const atkId = randomUUID();
    const expireTime = Date.now() + systemConfig.TOKENS_AGE.ACCESS_TOKEN;

    const accessData = {
        atk: atkId,
        name: name,
        email: email,
        expireTime: expireTime
    };

    const accessToken = hashToken(accessData);
    return { status: 'ok', atk: atkId, accessToken, expireTime };
}