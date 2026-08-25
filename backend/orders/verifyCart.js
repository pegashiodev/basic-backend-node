
/**
* 
*  VERIFICA QUE EL CARRITO SEA CORRECTO CON LOS DATOS DE LOS PRODUCTOS DEL BACKEND: ITEMS, PRECIOS, CANTIDADES, ...
*  
*  @param {object} order
*  es el pedido que se ha hecho en la web
* 
*/

// importamos el catalogo de productos o servicios del sitio, para validar con el pedido que llega del frontend
import { getDb } from "../db/openDbs.js"
import systemConfig from "../globalData/systemConfig.js"


export default async (order)=>{

    console.log("verifyCart.js!! ")
    console.log({order})

    let dbProducts;

    // OBTENEMOS LA BASE DE DATOS PARA ACTUALIZAR EL CONTENIDO DE LA PROMOCION
    try{
        dbProducts = await getDb(systemConfig.DBS.PRODUCTS)
    }catch(e){
        console.log("ERROR al Obtener getDb() DESDE VerifyCArt.js")
        return {status: "error", code: 565, message: "ERROR AL ACCEDER A LA BASE DE DATOS DE LOS PRODUCTOS"}
    }
    const productsCollection = dbProducts.collection("podcastmatic");
    const allProducts = await productsCollection.find()


    const refs = order.cart.map((el)=>{
        let product = allProducts[el.ref]
        if(product){
            if(product.stock === 'infinite' || product.stock > 0 )
            return product
        }else{
            return null
        }
    })

    let products_not_available = []
    let products_available = []
   

    for(let i=0; i<refs.length; i++){
        
        if(refs[i] === null){
            products_not_available.push(order.cart[i])
        }else{
            // AÑADO LOS PRODUCTOS DESDE EL SERVIDOR (PRECIOS, DATOS, CORRECTOS, ...)
            // añadimos la cantidad que ha solicitado en el frontend
        
            refs[i].quantity = order.cart[i].quantity
            products_available.push(refs[i])

        }
    }

    if(products_not_available.length > 0){
        return {status: "error", code: 570 , message: `HAY PRODUCTOS NO DISPONIBLES`, products: products_not_available}
    }
    return {status: "ok", code: 200, message: "PRODUCTOS DISPONIBLES", products: products_available}

}