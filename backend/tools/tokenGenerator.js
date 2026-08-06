
/**
 *  CREA LOS TOKENS DE LAS COOKIES
 * 
 */


import crypto  from 'node:crypto'
process.loadEnvFile();
const secret_key = process.env.SESION_TOKEN_SECRET_KEY;

/**
 * 
 * @param {String} plainText -> TExto con el objeto que tiene los datos del token: email, expireTime, ... 
 * @returns 
 */
export const hashToken = (plainText) => {

  if(!plainText || typeof(plainText)!=='string'|| plainText === undefined){
    console.log('ERROr en sessionTokenGenerator -> Formato de entrada INCORRECTO')
    return null
  }
  try {
    // Dejamos que iv sea random para que no los genere iguales con la misma entrada de datos
    //const iv = Buffer.from("8f33f368445eeaaab9c12359f64e886e", 'hex')
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(secret_key).digest('base64').substring(0, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plainText);
    encrypted = Buffer.concat([encrypted, cipher.final()])
    
    //return iv.toString('hex') + ':' + encrypted.toString('hex');
    let result = iv.toString('hex') + ':' + encrypted.toString('hex');
    
    // MODIFICAMOS EL RESULTADO -> GiRAMOS EL RESULTADO
    let arr = result.split('')
    arr[32] = arr[23]
    return arr.reverse().join('')
    
  } catch (error) {
    console.log('ERROr en sessionTokenGenerator -> EN EL TRY-CATCH')
    console.log(error);
    return null;
  }
}


/**
 * 
 * @param {String} encryptedText -> recibimos el token encriptado de la cookie para obtener la cadena de texto con los datos 
 * @returns 
 */
export const decodeToken = (encryptedText) => {
    try {
        // Desacemos lo que hicimos despues de que se encriptase
        let arr = encryptedText.split('').reverse();
        arr[32] = ':'
        encryptedText = arr.join('')

        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedData = Buffer.from(textParts.join(':'), 'hex');
        const key = crypto.createHash('sha256').update(secret_key).digest('base64').substring(0, 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        const decrypted = decipher.update(encryptedData);
        const decryptedText = Buffer.concat([decrypted, decipher.final()]);
        return decryptedText.toString();
    } catch (error) {
        console.log(error)
        return null
    }
}



