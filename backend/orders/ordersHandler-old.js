
/**
 *  RECIBIMOS EL PEDIDO DEL CLIENTE Y SE TRAMITA. 
 * 
 *  - AÑADIMOS EL PEDIDO A LA BASE DE DATOS
 *  - LO ACTUALIZAMOS, CUANDO SE SOLICITE
 *  - LO ELIMINAMOS, CUANDO SE SOLICITE
 *  - CUANDO ESTA PAGADO, LANZAMOS EL PROCESO DE "afterPayOrder" (envio, habilitamos descarga, permitimos acceso a endpoints, ...)
 * 
 */



import systemConfig from "../globalData/systemConfig.js"
import dbCrudHandler from "../db/dbCrudHandler.js"
import usersByEmail from "../globalData/usersByEmail.js"
import userHandler from "../users/userHandler.js"

const months = ['ene', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec' ]



/**
 * 
 * @param {data} data -> datos del pedido  
 */
export const manageOrder = async (data)=>{


    const data_order = {
        _id: data._id,
        cart: data.order,
        shipping_address: data.shipping_address,
        userId: data.userId,
        date_order: data.date,
        await: true,
        billed: false,
    }

    await addOrder(data_order);

   


    // PROCESAMOS EL ENVIO O DESCARGA DEL PEDIDO
    await afterPayOrder(data)
    

}

// AÑADIMOS EL PEDIDO A LA BASE DE DATOS
const addOrder =  async (data_order)=>{

    console.log("ordersHandler -> addOrder !!")
    console.log(data_order)
    //const now = Date.now()

    // HAY QUE USAR LA FECHA ORIGINAL DEL PEDIDO !!!! 

    const params = {
        // dbName: systemConfig.DBS.ORDERS + new Date(now).getFullYear(),       // dbName = users_ + año de alta del usuario
        dbName: systemConfig.DBS.ORDERS + data_order.date.year,
        // collection: months[new Date(now).getMonth()],                          // collection = Mes de alta el usuario
        collection: data_order.date.month, 
        await: data_order.await
    }
        
    if(data.await){

        let result = await dbCrudHandler.insertOne(data, params)
        if(result.status === 'ok'){
            return result
        }else{
            return {status: "error"}
        }
    }else{
        dbCrudHandler.insertOne(data, params)
    }


}

export const updateOrder = async (data)=>{

}

export const deleteOrder = async (data)=>{

}


/**
 * 
 * 
 * 
 * @param {*} data 
 */


const afterPayOrder = async (data)=>{

     /**
     * ACTUALIZAMOS EL SALDO DEL USER: 
     */

    // DEPENDIENDO DE LA ESTRATEGIA DE CADA PRODUCTO DEL CARRITO 
    // HAY QUE DEFINIR QUE SE HACE: "addSaldoCoins", "addSaldoTrainning", "decargar PDF", enviar producto fisico, ...

    // const data_updateSaldo = {
    //     task: "ADD",
    //     key_to_change: "saldoCoins",
    //     quantity: data.saldoCoins,
    //     await: true,
    // }
    // const user = usersByEmail[data.email]

    // userHandler.updateUserSaldo(data_updateSaldo, user)





}



export default  {
    manageOrder,
    addOrder,
    updateOrder,
    deleteOrder,
    afterPayOrder,
   
}