
/**
 * 
 *          CONTIENE LAS URL DE ESTE MASTER
 *          - SE OBTIENE DE LA BASE DE DATOS DE LOS MASTERS
 * 
 *          - ESTADO DEL MASTER: [ACTIVO / PAUSED / ENDED /...]
 *          - LAS DE ACCESO FREE
 *          - LAS DE ACCESO RESTRINGIDO A USUARIOS DEL MASTER
 *          
 *          - SON ENDPOINTS, NO SUBDOMINIO.
 *          - SE VERIFICAN AL RECIBIR LA PETICION 
 * 
 */



export default {

    // "master_head_endpoint": {
    //     head_endpoint: "master_head_endpoint",
    //     masterId; masterId, 
    //     status: "ACTIVE",
    //     free_endpoits: [],
    //     restricted_endpoints: []

    // }

    "lolo-123":{
        head_enpoint: "lolo-123",
        masterId: "123-456",
        status: "ACTIVE",
        free_endpoints: ["/", "info", "info.html"], // PAGINA DE PERFIL / CONTENIDOS ... 
        restricted_endpoints: ["clases", "clases.html", "curso-1", "curso-1.html"] // NOMBRE DE LOS CURSO, / RECURSO, ...
    }


}