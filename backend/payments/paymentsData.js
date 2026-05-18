

import dbCrudHandler from "../db/dbCrudHandler.js";
import systemConfig from "../globalData/systemConfig.js";


const months = ['ene', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec' ]

const [week_day, month, day, year, time] = new Date().toString().split(' ')
// [ 'Sun', 'Jun','29', '2025','20:09:25', 'GMT+0200','(hora',    'de','verano',   'de','Europa',   'central)'  ]
const [hour, min, sec] = time.split(":")

/**
 *  data = {
 *      stripeId,
 *      status: "PENDING",  ...
 *      user: {},
 *      cart: {},
 * }
 * 
 */
export const insertOne = async (data)=>{
    console.log("Payment -> insertOne")
    // console.log(data)
    const params = {
        dbName: systemConfig.DBS.PAYMENTS + year,
        collection: months[month],
        await: true
    }
    const data_db = {
        ...data, 
        date:  {day: day, hour: hour, min: min, sec: sec}, 
        _id: {
            _id: data.stripeId,
            date: {day: day, hour: hour, min: min, sec: sec},
            method: "STRIPE",
            userId: data.userId,
            email: data.email,
        }
    }
    let result = await dbCrudHandler.insertOne(data_db, params)

    console.log("!!!! Result de ADD PAYMENT  IN DB************")
    // console.log(result);

    if(result.status === 'ok'){
        return result
    }
    return {status: "error"}
    
}


export const updateOne = async (data)=>{
    console.log("Payment-> updateOne")

    if(data.task === "UPDATE_STATUS_PAYMENT"){
        if(data.paymentMethod === "STRIPE"){

            const filter = {"_id._id": data.stripeId}
        }else if(paymentMethod === "BIZUM"){
            const filter = {"_id._id": data.bizumId}

        }
        const data_db = {$set: data.new_value}
       
        const params = {
            dbName: systemConfig.DBS.PAYMENTS + year,
            collection: months[month],
            await: true,
            upsert: data.upsert,
        }
        let result = await dbCrudHandler.updateOne(filter, data_db, params)


        if(result.status === 'ok'){
            return result
        }
        return {status: "error"}


    }else if(data.task === "UPDATE_STATUS_PAYMENT_AND_RETURN_DOCUMENT"){
        
        const filter = {_id: data.stripeId}
        const data_db = {$set: data.new_value}
       
        const params = {
            dbName: systemConfig.DBS.PAYMENTS + year,
            collection: months[month],
            await: data.await,
            upsert: false,
            returnDocument: true
        }

        if(data.await){

            let result = await dbCrudHandler.findOneAndUpdate(filter, data_db, params)
console.log(result)

            if(result.status === 'ok'){
                return result
            }
            return {status: "error"}
        }else{
            dbCrudHandler.findOneAndUpdate(filter, data_db, params)
            return;
        }

    }
}



export default {
    insertOne,
    updateOne,
}



