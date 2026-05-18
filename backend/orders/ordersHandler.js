



import systemConfig from "../globalData/systemConfig.js"
import dbCrudHandler from "../db/dbCrudHandler.js"
import usersByEmail from "../globalData/usersByEmail.js"
import userHandler from "../users/userHandler.js"

const months = ['ene', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec' ]


export const manageOrder = async (data)=>{


    const data_order = {
        _id: data._id,
        cart: data.order,
        shipping_address: data.shipping_address,
        userId: data.userId,
        date_order: ata.date,
        billed: false,
    }

    addOrder(data_order);

    const data_user = {
        user: usersByEmail[data.email],
        task: "ADD",
        key_to_change: "saldoCoins",
        quantity: data.saldoCoins,
        await: false,
    }

    userHandler.updateUserSaldo(data_user)
    

}


export const addOrder =  async (data)=>{

    console.log("ordersHandler -> addOrder !!")
    console.log(data)
    const now = Date.now()

    const params = {
        dbName: systemConfig.DBS.ORDERS + new Date(now).getFullYear(),       // dbName = users_ + año de alta del usuario
        collection: months[new Date(now).getMonth()],                          // collection = Mes de alta el usuario
        await: data.await
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

export const afterOrder = async (data)=>{

}



export default  {
    manageOrder,
    addOrder,
    updateOrder,
    deleteOrder,
    afterOrder,
   
}