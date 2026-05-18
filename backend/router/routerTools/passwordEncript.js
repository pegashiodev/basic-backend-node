


import {createHash, createCipheriv, createDecipheriv} from 'node:crypto'
process.loadEnvFile();
const secret_key = process.env.PASSWORD_ENCRIPT_SECRET_KEY;
// const text = "Hello World"


export const passwordEncript = (plainText) => {
  try {
    // con secret_key e iv fijos siempre ofrece misma salida para misma entrada
    // que es lo que necesitamos para las passwords y compararlas con cada login del usuario

    const iv = Buffer.from("8f33f368445eeaaab9c12359f64e886e", 'hex')
    //const iv = crypto.randomBytes(16);
    const key = createHash('sha256').update(secret_key).digest('base64').substring(0, 32);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plainText);
    encrypted = Buffer.concat([encrypted, cipher.final()])
    
    let result = iv.toString('hex') + ':' + encrypted.toString('hex');
    
    // MODEIFICAMOS EL RESULTADO
    let arr = result.split('')
    arr[32] = arr[23]
    return arr.reverse().join('')
    
    //return iv.toString('hex') + ':' + encrypted.toString('hex');

  } catch (error) {
    console.log(error);
    return null;
  }
}



export const passwordDecrypt = (encryptedText) => {
    try {

        let arr = encryptedText.split('').reverse();
        arr[32] = ':'
        encryptedText = arr.join('')

        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedData = Buffer.from(textParts.join(':'), 'hex');
        const key = createHash('sha256').update(secret_key).digest('base64').substring(0, 32);
        const decipher = createDecipheriv('aes-256-cbc', key, iv);
        
        const decrypted = decipher.update(encryptedData);
        const decryptedText = Buffer.concat([decrypted, decipher.final()]);
        return decryptedText.toString();
    } catch (error) {
        console.log(error)
    }
}

export const comparePassword = (password)=>{
    return true;
}



