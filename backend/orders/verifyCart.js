
/**
* 
*  VERIFICA QUE EL CARRITO SEA CORRECTO CON LOS DATOS DE LOS PRODUCTOS DEL BACKEND: ITEMS, PRECIOS, CANTIDADES, ...
*  
*  @param {object} order
*  es el pedido que se ha hecho en la web
* 
*/

// importamos el catalogo de productos o servicios del sitio, para validar con el pedido que llega del frontend
import productsCached from "../globalData/productsCached.js"


export default (order)=>{

    console.log("verifyCart.js!! ")
    console.log(order)

    const refs = order.cart.map((el)=>{
        let product = productsCached[el.ref]
        if(product){
            if(product.stock === 'infinite' || product.stock > 0 )
            return product
        }else{
            return null
        }
    })


    
    let products_not_available = []
    let products_available = []
    let total_coins = 0;
   

    for(let i=0; i<refs.length; i++){
        
        if(refs[i] === null){
            products_not_available.push(order.cart[i])
        }else{
            // AÑADO LOS PRODUCTOS DESDE EL SERVIDOR (PRECIOS, DATOS, CORRECTOS, ...)
            // añadimos la cantidad que ha solicitado en el frontend
        
            refs[i].quantity = order.cart[i].quantity
            products_available.push(refs[i])

            // ESTE PASO LO VAMOS A HACER EN ordersHandler.afterOrder -> 
            //total_coins += refs[i].saldoCoins;
        }
    }

    if(products_not_available.length > 0){
        return {status: "error", message: `HAY PRODUCTOS NO DISPONIBLES`, products: products_not_available}
    }
    return {status: "ok", products: products_available, total_coins: total_coins}

}