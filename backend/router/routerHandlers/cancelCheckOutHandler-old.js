
/**
 * 
 * ATENDEMOS UN "CANCEL CHECKOUT"
 * OBTENEMOS DE LA URL DEL CANCEL-CHECKOUT EL STRIPEID QUE LE FUE ASIGNADO A LA OPERACION
 * 
 */



import sendStaticFile from "../../server/serverHandlers/sendStaticFile.js";
import paymentsDataStorage from "../../payments/paymentsDataStorage.js";


/**
 * 
 * @param {object} Objeto Request de NodeJS
 * @param {object} Objeto Response de NodeJS
 * 
 */
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
        // paymentMethod: "STRIPE-CARD",
        stripeId: stripeId,
        update: "status",
        new_value: {status: "CANCELED"},
        upsert: false
        
    }
    if(stripeId){

        paymentsDataStorage.updateOne(data_payment)
    
    // el "stripeId" esta si o si en la url
    }else{

        console.log("OJO ->  ERROR en cancelCheckOutHandler.js: NO hay stripeId en la URL ?? ")
    }

}