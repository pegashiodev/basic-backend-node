



/***
 *  VALIDA QUE EL email, CUMPLE LAS NORMAS DE LA PLATAFORMA: NUMERO DE CARACTERS, TIPO DE CARACTERES, ...
 * 
 */

export default function emailValidation (email){

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!email){
        return false
    }

    return EMAIL_REGEX.test(email.trim())

}