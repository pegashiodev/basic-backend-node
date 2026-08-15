

import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

// Parámetros de complejidad recomendados para scrypt
const KEY_LENGTH = 64; // Longitud del hash resultante
const SCRYPT_OPTIONS = {
    N: 16384, // Coste de CPU/memoria (potencia de 2)
    r: 8,     // Tamaño de bloque
    p: 1      // Paralelismo
};

/**
 * Genera un hash seguro con Salt dinámico a partir de la contraseña plana.
 * Devuelve un string en formato: "salt:hash"
 * @param {string} plainPassword 
 * @returns {Promise<string>}
 */
export const hashPassword = async (plainPassword) => {
    if (!plainPassword || typeof plainPassword !== 'string') {
        throw new Error('La contraseña debe ser un texto válido.');
    }

    // 1. Generamos un Salt aleatorio criptográficamente seguro (16 bytes)
    const salt = randomBytes(16).toString('hex');

    // 2. Calculamos el hash con scrypt
    const derivedKey = await scryptAsync(plainPassword, salt, KEY_LENGTH, SCRYPT_OPTIONS);

    // 3. Devolvemos "salt:hash" para almacenar en MongoDB
    return `${salt}:${derivedKey.toString('hex')}`;
};

/**
 * Compara una contraseña en texto plano contra el hash almacenado en base de datos ("salt:hash").
 * Utiliza comparación de tiempo constante para evitar Timing Attacks.
 * @param {string} plainPassword 
 * @param {string} storedHashString 
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (plainPassword, storedHashString) => {
    if (!plainPassword || !storedHashString || typeof storedHashString !== 'string') {
        return false;
    }

    try {
        const [salt, originalHashHex] = storedHashString.split(':');
        if (!salt || !originalHashHex) {
            return false;
        }

        const originalHashBuffer = Buffer.from(originalHashHex, 'hex');
        
        // Calculamos el hash de la contraseña entrante usando el mismo Salt
        const derivedKey = await scryptAsync(plainPassword, salt, KEY_LENGTH, SCRYPT_OPTIONS);

        // Comparación segura en tiempo constante
        if (originalHashBuffer.length !== derivedKey.length) {
            return false;
        }

        return timingSafeEqual(originalHashBuffer, derivedKey);

    } catch (error) {
        console.error('Error al verificar contraseña:', error.message);
        return false;
    }
};

// Mantener alias por compatibilidad con el resto del proyecto si hiciera falta
export const passwordEncript = hashPassword;