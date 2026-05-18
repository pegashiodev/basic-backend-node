import sendStaticFile from "../server/serverHandlers/sendStaticFile.js"
import cancelCheckOutHandler from "./routerHandlers/cancelCheckOutHandler.js"
import successCheckOutHandler from "./routerHandlers/successCheckOutHandler.js"



const endpoints_handlers = {
    
    // CHECKOUT ENTRA POR POST
    // 'checkout': "",
    // 'checkout.html': "",
  
    'success-checkout': successCheckOutHandler,
    'success-checkout.html': successCheckOutHandler,
    "cancel-checkout": cancelCheckOutHandler,
    "cancel-checkout.html": cancelCheckOutHandler,
    
    // "finalizar-pedido": "",
    // "finalizar-pedido.html": "",
    // "pedido-realizado": "",
    // "pedido-realizado.html": "",
    // "cancelar-checkout": "",
    // "cancelar-checkout.html": "",
    
}



export default (req, res)=>{

    console.log("ROUTER_PAY_ENDPOINTS  -->> GET !!")

    console.log(req.urlData)
    // AQUI NO HAY COOKIE PORQUE VIENE DE STRIPE

    if(req.urlData.endpoint === "success-checkout" || req.urlData.endpoint === "success-checkout.html"){

        console.log("Tengo que dar la compra por SUCCESS")
        endpoints_handlers[req.urlData.endpoint](req, res);

        
        // res.code = 200;
        // return sendStaticFile(req, res)
    
    
    }else if(req.urlData.endpoint === "cancel-checkout" || req.urlData.endpoint === "cancel-checkout.html"){
        
        endpoints_handlers[req.urlData.endpoint](req, res);

        // console.log("Tengo que dar la compra por CANCEL")
        // res.code = 200;

        // return sendStaticFile(req, res)

    }else{
        res.code = 404;
        return sendStaticFile(res, req)
    }


    // DEBE DE HABER COOKIE VALIDA SOLO PARA EL CHECKOUT O FINALIZAR-PEDIDO !!!!!




}