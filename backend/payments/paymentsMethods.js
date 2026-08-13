
/***
 * 
 *  AQUI SE REALIZAN LAS LLAMADAS A LAS DISTINTAS API DE PROVEEDORES DE PAGO
 *  PARA REALIZAR EL QUE CORRESPONDA EN CADA CASO
 * 
 * @param {} cart , con los datos de la compra
 * @param method, un string con el meto de pago seleccionado en la web (STRIPE-CARD, STRIPE-BIZUM)
 * 
 * 
 */


import Stripe from "stripe"

process.loadEnvFile();
const stripe = Stripe(process.env.STRIPE_PRIVATE_KEY_TEST)

export default async (cart, method)=>{

    if(method === "STRIPE-CARD"){
        let result_payment = await stripePaymentCard(cart)
        return result_payment;

    }else if(method === "STRIPE-BIZUM"){

    }

}

async function stripePaymentCard(cart){

    const line_items_stripe = getLineItemsStripe(cart)

    let stripe_sesion;
    try{
        stripe_sesion = await stripe.checkout.sessions.create({
            line_items : line_items_stripe,
            mode: "payment",
            success_url: `${process.env.BASE_URL}/success-checkout.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel-checkout.html?session_id={CHECKOUT_SESSION_ID}`,
    
        })

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
        return {status: "error"}

    }
    // console.log(session)
    stripe_sesion.status = "ok"
    return stripe_sesion;

   
    // creamos la lista de items para la peticion a STRIPE
    function getLineItemsStripe(products){
        // line_items: [
        //   {
        //     price_data:{
        //         currency: "eur",
        //         product_data: {
        //             name: "Recarga 500"
        //         }, 
        //         unit_amount: 5 * 100,       // Precio unitario en centimos

        //     },
        //     quantity: 1
        // }
        // ]

        const line_items = []

        for(let i=0; i<products.length; i++){
            console.log(products[i])

            let product = {
                price_data: {
                    currency: products[i].currency,
                    product_data: {
                        name: products[i].title,
                    },
                    unit_amount: products[i].unit_amount,
                },
                quantity: products[i].quantity
            }   
            line_items.push(product)
        }
        return line_items

    }

}