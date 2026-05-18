
import systemConfig from "../../globalData/systemConfig.js";
import sendStaticFile from "../../server/serverHandlers/sendStaticFile.js";
import paymentsData from "../../payments/paymentsData.js";


export default async (req, res)=>{

    console.log("CANCEL_CHECKOUT  !!")
    // Enviamos pagina al user
    res.code = 200;
    sendStaticFile(req, res)
    
    // console.log("Tengo que dar la compra por CANCEL")
    console.log(req.urlData)
    const stripeId = req.urlData.searchParams.session_id

    // ACTUALIZAMOS LA COMPRA A "CANCEL"
    const data_payment = {
        task: "UPDATE_STATUS_PAYMENT",
        paymentMethod: "STRIPE",
        stripeId: stripeId,
        update: "status",
        new_value: {status: "CANCELED"},
        upsert: false
        
    }
    if(stripeId){

        paymentsData.updateOne(data_payment)
    }

    
    // if(result_payment.status !== 'ok'){
    //     console.log("ERROR en cancelcheckOutHandler -> INSERTANFO PAGO EN DB")
    //     // ENVIAMOS PAGINA DE ERROR DE CONEXION CON PASARELA DE PAGOS
    //     // req.urlData.fileName = systemConfig.PAGES.PAGE_NOT_FOUND
    //     // req.urlData.ext = "html";
    //     res.code = 200
    //     return sendStaticFile(req, res)
    // }

    // // console.log("Tengo que dar la compra por CANCEL")
    // res.code = 200;
    // return sendStaticFile(req, res)


}