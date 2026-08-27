



export default {
    c200: {code:200, message: "Todo ha salido OK", action: "tDO OK"},



    c300: {},




    c400: {},
    c401: {code: 401, messageFrontend: "SESION EXPIRADA", messageReal: "SESSION EXPIRADA", accion: "ENVIAMOS A SESSION-IS-REQUIRED: SOLO FORM DE LOGIN"},
    c405: {code: 405, messageFrontend: "INVALID TOKENS", messageReal: "COOKIE ES INCORRECTA", accion: "ENVIAMOS A ACCESS-PLATFORM"}, 
    c406: {code: 406, messageFrontend: "", messageReal: "",  accion: ""}, 
    c410: {code: 410, messageFrontend: "", messageReal: "", accion: ""},
    c411: {code: 411, messageFrontend: "BAD REQUEST", messageReal: "LA URL SOLICITADA NO ESTA EN EL SITEMAP", accion: "CERRAMOS LA CONEXION"},

    c412: {code: 412, messageFrontend: "", messageReal: "", accion: ""},
    c415: {code: 415, messageFrontend: "", messageReal: "", accion: ""},
    c418: {code: 418, messageFrontend: "", messageReal: "", accion: ""},
    c420: {code: 420, messageFrontend: "", messageReal: "", accion: ""},

    // CARRITO Y CHECKOUT
    c430: {code: 430, messageFrontend: "CARRITO INVALIDO", messageReal: "UN ELEMENTO DEL CARRITO NO TIENE ID", accion: "NUEVO CARRITO"},
    c431: {code: 431, messageFrontend: "PRODUCTO NO DISPONIBLE", messageReal: "HAY AL MENOS UN PRODUCTO DEL CARRITO NO DISPONIBLE", accion: ""},
    c432: {code: 432, messageFrontend: "CARRITO INVALIDO", messageReal: "EL FORMARTO DEL CARRITO O FARMATO DE ITEMS NO VALIDO", accion: ""},
    c420: {code: 420, messageFrontend: "", messageReal: "", accion: ""},

    // REFRESH-TOKEN
    c444: {code: 444, messageFrontend: "SEND REFRESH TOKEN", messageReal: "ATK CADUCADO -> SOLICITAMOS RTK", accion: "SOLICITAMOS EL ENVIO DEL RTK POR ATK CADUCADO"},
    
    //
    c401: {code: , messageFrontend: "", messageReal: "", accion: ""},
    c401: {code: , messageFrontend: "", messageReal: "", accion: ""},
    c401: {code: , messageFrontend: "", messageReal: "", accion: ""},
    c401: {code: , messageFrontend: "", messageReal: "", accion: ""},
    



    // CARRITO Y CHECKOUT
    c530: {code: 530 , messageFrontend: "NO SE HA PODIDO INICIAR EL PROCESO DE PAGO", messageReal: "ERROR AL CREAR LA SESSION CON STRIPE", accion: ""},



    c500: {code: , messageFrontend: "", messageReal: "", accion: ""},
    c500: {code: , messageFrontend: "", messageReal: "", accion: ""},
    c500: {code: , messageFrontend: "", messageReal: "", accion: ""},
    
}