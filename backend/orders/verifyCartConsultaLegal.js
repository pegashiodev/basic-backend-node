
/**
 * 
 *  VERIFICA QUE EL CARRITO SEA CORRECTO: ITEMS, PRECIOS, CANTIDADES, ...
 * 
 * 
 */

import productsCached from "../globalData/productsCached.js"


export default (order)=>{

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
            total_coins += refs[i].saldoCoins;
            products_available.push(refs[i])
        }
    }

    if(products_not_available.length > 0){
        return {status: "error", message: `PRODUCTOS NO DISPONIBLES`, products: products_not_available}
    }
    return {status: "ok", products: products_available, total_coins: total_coins}

}