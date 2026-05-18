


/****
 * 
 * 
 *      ACCEDES DESDE LA PAGINA DEL SUCCESS CHECKOUT -> PAY ENDPOINT -> 
 *          - RECUPERAMOS EL PAYMENT QUE ESTABA PENDING
 *          - LO ENVIAMOS A MANAGE-ORDER -> ADDoRDER, AFTER-ORDER, SEND-ORDER, ...
 * 
 */


import systemConfig from "../../globalData/systemConfig.js";
import sendStaticFile from "../../server/serverHandlers/sendStaticFile.js";
import payments from "../../payments/paymentsData.js";
import userHandler from "../../users/userHandler.js";
import usersByEmail from "../../globalData/usersByEmail.js";
import ordersHandler from "../../orders/ordersHandler.js";

process.loadEnvFile();
import Stripe from "stripe"
const stripe = Stripe(process.env.STRIPE_PRIVATE_KEY_TEST)


export default async (req, res)=>{

    console.log("success_CHECKOUT  !!")
    // Enviamos pagina al user
    res.code = 200;
    sendStaticFile(req, res)

    const retrieve = await stripe.checkout.sessions.retrieve(req.urlData.searchParams.session_id, {expand:["payment_intent.payment_method"]})
    // Nos da la informacion de como se ha hecho el pago: Tarjeta, revolut, ...

    // console.log("Tengo que dar la compra por CANCEL")
// console.log(req.urlData)
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

    // ACTUALIZAMOS CON LA CONSULTA A STRIPE DE DATOS DEL PAGO
    if(retrieve?.payment_intent?.payment_method){
        data_payment.new_value = {status: "SUCCESS", payment_method: retrieve.payment_intent.payment_method}
        data_payment.upsert = true
    }

// console.log(data_payment)
// return;

// RECUPERAMOS EL PAGO DONDE ESTAN LOS DATOS DEL PEDIDO PARA
    // ACTUALIZAMOS EL PAGO A SUCCESS E INCLUIMOS EL METODO DE PAGO
    // ACTUALIZAR DB->PEDIDOS Y DB->USER
    let payment_data;
    if(stripeId){

        payment_data = await payments.updateOne(data_payment)
    }

    console.log("*** PAYMENT DATA -> RECUPERADO DE DB !!!")
    console.log(payment_data)

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

    // ordersHandler.addOrder(data_order);



    // FALTARIA EMITIR FACTURA ???

    
    // if(result_payment.status !== 'ok'){
    //     console.log("ERROR en cancelcheckOutHandler -> INSERTANFO PAGO EN DB")
    //     // ENVIAMOS PAGINA DE ERROR DE CONEXION CON PASARELA DE PAGOS
    //     // res.data.fileName = systemConfig.PAGES.PAGE_NOT_FOUND
    //     // req.data.ext = "html";
    //     res.code = 200
    //     return sendStaticFile(req, res)
    // }

    // // console.log("Tengo que dar la compra por CANCEL")
    // res.code = 200;
    // return sendStaticFile(req, res)


}