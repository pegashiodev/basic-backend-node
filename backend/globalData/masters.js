

/*****
 * 
 *      DICCIONARIO DONDE ESTAN LOS "MASTER",  QUE CREAN CONTENIDO EN SUBDOMINIOS
 *      DENTRO DE LA PLATAFORMA, ...
 *      TIENE SUS RESTRICTED_ENDPOINTS, ETC...
 * 
 *      TAMBIEN ESTAN EN DB
 *          DBNAME: MASTERS
 *      
 *      nombres validos:
 *          - caracteres [a-z] en minusculas
 *          - numeros [0-9]
 *          - guion medio [-] -> NO VALIDO AL PRINCIPIO NI AL FINAL
 *          - MAXIMA LONGITUD DE 63 CARACTERES
 * 
 */




export default {

    "master_subdomain": {
        masterId: "",               // nombre valido y unico para que pueda servir de subdominio
        subdomain: "",
        nick: "",
        name: "",
        type: "",
        status: "ACTIVE", 
        email: "",
        folder_restricted: "",                                  // CARPETA DE LOS CONTENIDOS RESTRICTED
        folder_default: "",                                     // CARPETA POR DEFECTO DE CONTENIDOS
        restricted_endpoints: ["clases", "endpoint-2", "etc"], 
        subscriptors_total: 0,                                  // total

    }


}
