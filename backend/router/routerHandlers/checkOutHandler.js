

/***
 * 
 * ATENDEMOS LA PETICION DE CHECKOUT DESDE EL FRONTED
 * - VALIDAMOS QUE EL CARRO DE COMPRA ES CORRECTO
 * - SOLICITAMOS EL PAGO
 * - ALMACENAMOS LOS DATOS DE LA COMPRA CON ESTADO "PENDING"
 * - ALMACENAMOS PARA ESTADISTICAS DEL SITIO 
 */

import systemConfig from "../../globalData/systemConfig.js";
import paymentsDataStorage from "../../payments/paymentsDataStorage.js";
import paymentsMethods from "../../payments/paymentsMethods.js";
import errorsCodes from "../../tools/errorsCodes.js"
import siteStats from "../routerTools/siteStats.js";
import verifyCart from "../../orders/verifyCart.js";



/**
 * 
 * @param {object} Objeto Request de NodeJS
 * @param {object} Objeto Response de NodeJS
 * 
 */
export default async (req, res)=>{

    console.log("CHECK_OUT_HANDLER --> POST !!")

// ¡¡¡¡¡ IMPORTANTE
// LA COOKIE Y SESSION YA SE HAN VERIFICADO EN postRequestHandler
// HA DE LLEGAR CON searchParams.from que he es la url del carrito, por si no hay session para poder reenviarlo despues de loguearse.

    
    // console.log(req.body.order)
    let order = req.body.order;
    let payment_result;
    let paymentMethod = req.body.order.paymentMethod.toUpperCase()

    // VERIFICAMOS EL CARRO DE LA COMPRA ES CORRECTO CON LOS DATOS DEL SERVIDOR
    let cart_verified = verifyCart(order)

    if(cart_verified.status !== 'ok'){
        const response_data = {
            status: systemConfig.STATUS.ERROR_FETCH,
            code: errorsCodes.c560.code,
            message: "ERROR EN EL CHECKOUT",            
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }

// INICIAMOS EL PROCESO DE PAGO

    if( paymentMethod === "STRIPE-CARD"){
       
        // OBTENEMOS LA SESSION DE STRIPE -> SE COMPLETA EL PAGO DESDE SUSSCESS-CHECKOUT O CANCEL-CHECKOUT
        try{
           
            payment_result = await paymentsMethods(cart_verified.products, "STRIPE-CARD")
       
       
        }catch(e){
            console.log("ERROR en checkOutHandler -> en el try-catch")
            console.log(e)
            // OCURRIO UN PROBLEMA
            // ENVIAMOS PAGINA DE ERROR DE CONEXION CON PASARELA DE PAGOS
            const response_data = {
                status: systemConfig.STATUS.ERROR_FETCH,
                location: systemConfig.PAGES.CONNECTION_ERROR_PAYMENT_PROVIDER,
                code: errorsCodes.c452.code,
                message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response_data))
            return;
    
        }
   
        
    }else if(paymentMethod === "STRIPE-BIZUM"){
        console.log("PAGO POR BIZUM");

        payment_result = {}
   
   
    }else{
        const response_data = {
            status: "error",
            code: errorsCodes.c565.code,
            message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }

    if(payment_result.status !== "ok"){
        console.log("ERROR en checkOutHandler -> HACIENDO PAGO EN STRIPE")

        const response_data = {
            status: systemConfig.STATUS.ERROR_FETCH,
            location: systemConfig.PAGES.CONNECTION_ERROR_PAYMENT_PROVIDER,
            code: errorsCodes.c566.code,
            message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;

    }
    let data_payment = null;

// ALMACENAMOS EL PAGO COMO "PENDING"
    if(paymentMethod === "STRIPE-CARD"){

        data_payment = {
            stripeId: payment_result.id,
            status: "PENDING",
            userId: req.user.userId,
            name: req.user.name,
            email: req.user.email,
            order: cart_verified.products,
            saldoCoins: cart_verified.total_coins,
            shipping_address: req.body.order.shipping_address
        }


    }else if(paymentMethod === "STRIPE-BIZUM"){
        console.log("PAGO POR BIZUM");

        data_payment = {
            bizumId: payment_result.id,
            status: "PENDING",
            userId: req.user.userId,
            name: req.user.name,
            email: req.user.email,
            order: cart_verified.products,
            saldoCoins: cart_verified.total_coins,
            shipping_address: req.body.order.shipping_address
        }


    }

// GUARDAMOS EL PAGO A LA ESPERA DE SABER SI ES SUCCESS OR CANCEL
    
    const result_insert_payment_db = await paymentsDataStorage.insertOne(data_payment)
        
    if(result_insert_payment_db.status !== 'ok'){
        console.log("ERROR en checkOutHandler -> INSERTANFO PAGO EN DB")
        // ENVIAMOS PAGINA DE ERROR DE CONEXION CON PASARELA DE PAGOS
    
        const response_data = {
            status: systemConfig.STATUS.ERROR_FETCH,
            location: systemConfig.PAGES.CONNECTION_ERROR_PAYMENT_PROVIDER,
            code: errorsCodes.c567.code,
            message: "ERROR EN EL CHECKOUT",            //errorCodes.c531.message,
        }

// OJO -> hay que notificar de este pago no Guardado en DB
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response_data))
        return;
    }
    // AÑADIMOS A ESTADISTICAS
    siteStats(req)

    // TENGO un stripe_session_id donde guardo los datos de la Compra. -> con un status = "PENDING"
    // si se confirma paso el status = "SUCCESS"
    // si se cancela paso el status = "CANCEL"
    const response_data = {
        status: 'ok',
        location: payment_result.url,
        code: 200
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(response_data))

}


