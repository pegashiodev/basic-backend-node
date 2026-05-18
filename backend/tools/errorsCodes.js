


/**
 *      CODIGOS DE ERRORES DE LA APLICACION
 * 
 * 
 * 
 * 
 */


export default {

    c200:   {code:200, message: "TODO CORRECTO"},
    c201:   {code:201, message: "TAREA CREADA"},                    // TAREA INDICADA REALIZADA CON EXITO
    c205:   {code:205, message: "RESET CONTENT"},                   // HAY QUE VOLVER A CARGAR LA PAGINA
    c225:   {code:225, message: "PASSWORD ACTUALIZADO CON EXITO"},
    c250:   {code:250, message: "ERROR EN EL ENVÍO DEL EMAIL"},     // le ponemos un 200 para no entrar en el Catch del fetch

    c400:   {code:400, message: "BAD REQUEST"},
    c402:   {code:402, message: "PAYMEN REQUIRED"},
    c403:   {code:403, message: "FORBIDEN"},                    // NO TIENE AUTORIZACCION PARA ESE RECURSO
    c404:   {code:404, message: "UPSS!! URL NO ENCONTRADA"},
    c405:   {code:405, message: "METODO USADO NO PERMITIDO"},
    c405:   {code:408, message: "REQUEST TIMEOUT"},             // TIEMPO DE ESPERA DEL SERVIDOR EXCEDIDO
    c409:   {code:409, message: "CONFLICT"},                    // SE PRODUJO UN CONFLICTO CON EL RECURSO SOLICITADO
    c411:   {code:411, message: "LENGTH-REQUIRED"},             // NO SE ENVIO LA CABECERA CONTENT-LENGTH QUE ES REQUERIDA
    c423:   {code:423, message: "LOCKED"},                      // EL RECURSO SOLICITADO ESTA BLOQUEADO
    c429:   {code:429, message: "TO MANY REQUESTS"},            // DEMASIADAS REQUEST EN UN PERIIODO DETERMINADO


    c435:   {code:435, message: "EMAIL INCORRECTO"},
    c436:   {code:436, message: "NO EXISTE USUARIO EN ESE EMAIL"},
    c440:   {code:440, message: "LOS DATOS DEL BODY NO SE HAN PODIDO RECIBIR CORRECTAMENTE"},
    c445:   {code:445, message: "FORMATO DE BODY NO ESPERADO: [JSON, IMG, AUDIO, FILE,...]"},
    c450:   {code:450, message: "NO HEADERS[CONTENT-TYPE] EN LA PETICION"},
    c451:   {code:451, message: "ERROR AL PARSEAR LA COOKIE"},
    c452:   {code:452, message: "NO HAY COOKIE EN LA PETICION"},
    c453:   {code:453, message: "COOKIE INCOMPLETA"},
    c455:   {code:455, message: "EL MASTER NO ESTA ACTIVO"},
    c460:   {code:460, message: "INVALID ENDPOINT"},
    c465:   {code:465, message: "VALIDATION TOKEN EXPIRED"},
    c466:   {code:466, message: "VALIDATION TOKEN INVALID"},
    c467:   {code:467, message: "NO HAY NINGUN TOKEN EN LA COOKIE: ATK, RTK, DEVIDEID"},
    c468:   {code:468, message: "VALIDATION TOKEN CADUCADO O BORRADO -> REHACER EL SIGNUP"},
    c470:   {code:470, message: "EMAIL YA REGISTRADO"},
    c471:   {code:471, message: "EMAIL NO VERIFICADO"},
    c472:   {code:472, message: "INVALID EMAIL REMOTE PANNEL"},
    c473:   {code:473, message: "INVALID ACCESS KEY REMOTE PANNEL"},
    c475:   {code:475, message: "PASSWORD INCORRECTO"},
    c480:   {code:480, message: "USUARIO BLOQUEADO"},
    c481:   {code:481, message: "USUARIO HACKEADO"},
    c485:   {code:485, message: "NO ACCESS KEY OR INVALID"},
    c486:   {code:486, message: "INVALID SUBDOMAIN REQUEST"},



    c500:   {code:500, message: "INTERNAL SERVER ERROR"},       // SE PRODUJO UN ERROR EN EL SERVIDOR
    c509:   {code:509, message: "BANDWIDTH LIMIT EXCEEDED"},    // LLEGADO AL LIMITE DE ANCHO DE BANDA Y NO SE PUEDEN ATENDER MAS PETICIONES

    c525:   {code:525, message: "NO HAY USER CON ESE EMAIL"},
    c530:   {code:530, message: "ERROR Actualizando datos en UserDB"},
    c531:   {code:531, message: "ERROR HASHEANDO EL  PASSWORD"},
    c532:   {code:532, message: "ERROR VALIDADANDO LOS DATOS DEL FORMULARIO"},
    c533:   {code:533, message: "ERROR CREANDO EL URL_TOKEN"},
    c535:   {code:535, message: "ERROR EN EL ENVÍO DEL EMAIL"},
    c540:   {code:540, message: "VALOR DE 2FA INCORRECTO"},
    c541:   {code:541, message: "ERROR CON EL 2FA"},
    c550:   {code:550, message: "ERROR CREANDO USUARIO EN BD"},
    c551:   {code:551, message: "ERROR CREANDO SESSION EN DB"},
    c560:   {code:560, message: "HAY PRODUCTOS DEL CARRITO NO DISPONIBLES EN ESTE MOMENTO"},
    c561:   {code:561, message: "Promotional Code Not Available"},
    c562:   {code:562, message: "Promotional Code Expired"},
    c563:   {code:564, message: "Promotional Code Consumed"},
    c565:   {code:565, message: "Metodo de Pago NO disponible"},
    c566:   {code:566, message: "Error con la conexion o pago en Stripe"},
    c566:   {code:567, message: "Error Insertandp el pago en DB"},




}