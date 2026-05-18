

/*
        VErifica los campos recibidos en una peticion post

*/



export default  (data)=>{

    let result = {
        status: 'ok',
        code: 200,
        message: 'ok'
    }

    // PASAR TODO A MINUSCULAS
    

    // verificar Email valido
    if(data.email){

        if(!isValidEmail(data.email)){
            result.status = 'error';
            result.code = 504;
            result.message = 'Email Invalido'
            return result;
        }
    }
    // verificar PAssword Valido (size, caracteres validos, ...)
    if(data.password){

        if(!isValidPassword(data.password)){
            result.status = 'error';
            result.code = 504;
            result.message = 'Formato de Password invalido'
            return result;
        }
    }

    // Verificar Email Repetido y enviar email
    if(isEmailReserved(data.email)){
        result.status = 'error';
        result.code = 504;
        result.message = 'Email Ya Registrado'
        return result;
    }
    if(data.name){

        if(!isValidName(data.name)){
            result.status = 'error';
            result.code = 504;
            result.message = 'Email Ya Registrado'
            return result;
        }
    }

    return result;
}

    const isValidName = (name)=>{

        /**
         * Al menos 3 caractereds
         * NO NUMEROS
         * NO SIMBOLOS
         * SOLO LETRAS
         * 
         */
        return true
    }

    const isValidEmail = (email)=>{
        // typeof email === 'string'
        // lenght
        // type of chars
        // valid Char
        // valid format ( @, ., ext, ....)
        return true;
    }

    const isValidPassword = (password)=>{
        /**
         * al menos 6 caracteres
         * 
         */
        return true;
    }

    const isEmailReserved = (email)=>{
        return false;
    }