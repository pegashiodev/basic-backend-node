
import cookieParser from '../routerHelpers/cookieParser.js'


export default (cookie)=>{

    let result = {
        status: 'error',
        code: 200,
        headers: {},        
    }

    if(typeof(cookie)!== 'string'){
        console.log('ValidateCookie -> Formato de cookie incorrecto')
           
        result.code = 200;
        result.headers = {
            'Content-Type': 'text/html',
            'Set-Cookie': ''
        }
        
        result.fileName = '404.html'
        return result;
   }

   result.cookieParsed = cookieParser(cookie);  

   if(!result.cookieParsed){
       console.log('ValidateCookie -> No hay lista de datos en la cookie ??')
       result.code = 200;
        result.headers = {
            'Content-Type': 'text/html',
            'Set-Cookie': ''
        }
    
        result.fileName = '404.html'
        return result;
   }

//    result.existsSession = false;
   let accessToken = result.cookieParsed.accessToken;

   if(!accessToken){
        console.log('No accessToken en la cookie ??')
        //  RETORNAMOS 404 
        result.code = 200;
        result.headers = {
            'Content-Type': 'text/html',
            'Set-Cookie': ''
        }

        result.fileName = '404.html'
        return result;
    }

   //console.log(accessToken)
   
   try{
       result.accessTokenDecoded = JSON.parse(decodeSessionToken(accessToken));
       console.log(result.accessTokenDecoded)

   }catch(err){

       console.log('ERROR en PARSE decodeSeeeionToke');
        //  RETORNAMOS 404 
        result.code = 200;
        result.headers = {
            'Content-Type': 'text/html',
            'Set-Cookie': ''
        }

        result.fileName = '404.html'
        return result;
   }


   // SI LA COOKIE ESTA CORRUPTA o FALTAN DATOS???  
   if(!result.accessTokenDecoded.email){
        console.log('ERROR -> NO HAY EMAIL EN EL tOKEN -> REENVIAMOS A PAGINA DE ACCESO A LA PLATAFORMA');
        //  RETORNAMOS 404 
        result.code = 200;
        result.headers = {
            'Content-Type': 'text/html',
            'Set-Cookie': ''
        }

        result.fileName = '404.html'
        return result;
   }

   result.status = 'ok';
   return result;



}