


/****
 * 
 * 
 *      ACCEDES DESDE LA PAGINA DEL SUCCESS CHECKOUT -> PAY ENDPOINT -> 
 *          - RECUPERAMOS EL PAYMENT QUE ESTABA PENDING
 *          - LO ENVIAMOS A MANAGE-ORDER -> ADDoRDER, AFTER-ORDER, SEND-ORDER, ...
 * 
 */


import sendStaticFile from "../../server/serverHandlers/sendStaticFile.js";
import paymentsDataStorage from "../../payments/paymentsDataStorage.js";
import ordersHandler from "../../orders/ordersHandler.js";

process.loadEnvFile();
import Stripe from "stripe"
const stripe = Stripe(process.env.STRIPE_PRIVATE_KEY_TEST)


/**
 * 
 * @param {object} Objeto Request de NodeJS
 * @param {object} Objeto Response de NodeJS
 * 
 */
export default async (req, res)=>{

    console.log("success_CHECKOUT  !!")
    // Enviamos pagina DE SUCCESS AL USUARIO Y SEGUIMOS CON LA TRAMITACION DEL PEDIDO
    res.code = 200;
    sendStaticFile(req, res)
    
    // console.log(req.urlData)

    // OBTENEMOS LOS DATOS DE LA TRANSACCION DE LA URL 
    const retrieve = await stripe.checkout.sessions.retrieve(req.urlData.searchParams.session_id, {expand:["payment_intent.payment_method"]})
    // Nos da la informacion de como se ha hecho el pago: Tarjeta, revolut, ...

    // HABIAMOS ALMACENADO EN LA URL EL "session:id" de STRIPE
    const stripeId = req.urlData.searchParams.session_id

    // ACTUALIZAMOS LA COMPRA A "SUCCESS"
    const data_payment = {
        task: "UPDATE_STATUS_PAYMENT_AND_RETURN_DOCUMENT",
        stripeId: stripeId,
        new_value: {status: "SUCCESS"},
        await: true,
        // ESTO SE COLOCA EN EL UPDATE
        // upsert: false,
        // returnDocument: true,
        
    }

    // ACTUALIZAMOS LOS DATOS DEL PEDIDO EN NUESTRA BASE DE DATOS  
    // CON LA CONSULTA A STRIPE DE DATOS DEL PAGO
    if(retrieve?.payment_intent?.payment_method){
        data_payment.new_value = {status: "SUCCESS", payment_method: retrieve.payment_intent.payment_method}
        
    }else{
         data_payment.new_value = {status: "SUCCESS"}

    }

// console.log(data_payment)
// return;



    let payment_order;
    // "stripeId" es el filtro para encontrar el documento
    if(stripeId){

        payment_order = await paymentsDataStorage.updateOne(data_payment)
    }


    // SI HAY ERROR NO TENEMOS ACCESO AL PEDIDO -> 
    if(payment_order.status === "error"){

// OJO -> QUE HACEMOS SI NO HEMOS PODIDO ACCEDER
// ENVIAMOS A UNA LISTA DE TAREAS DE DB NO ACABADAS Y URGENTES ??? 
   
   
   
    // TODO OK -> TRAMITAMOS EL PEDIDO
    }else{

        console.log("*** PAYMENT DATA -> RECUPERADO DE DB !!!")
        console.log(payment_data)
    
        // CREAMOS EL PEDIDO PARA SU ALMACENAMIENTO Y TRAMITACION
        const data_order = {
            _id: payment_data._id,
            cart: payment_data.order,
            shipping_address: payment_data.shipping_address,
            userId: payment_data.userId,
            email: payment_data.email,
            saldoCoins: payment_data.saldoCoins,
            date_order: payment_data.date,
            billed: false,
        }
        ordersHandler.manageOrder(data_order)
    }


}