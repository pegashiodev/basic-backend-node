
/**
 *  ALMACENAMOS LOS DATOS DE LOS PAGOS EN LA BASE DE DATOSS
 *  PRIMERO SE ALMACENAN CON ESTADO "PENDING"
 * 
 *  DESPUES SI EL PAGO SE HA EFECTUADO SE ACTUALIZA SU ESCADO A "SUCCESS" 
 */

import dbCrudHandler from "../db/dbCrudHandler.js";
import systemConfig from "../globalData/systemConfig.js";

// LAS BASES DE DATOS DE ESTA CONTABILIDAD TIENEN EN SU NOMBRE EL AÑO EN CURSO
// LA COLECCION DE ESA BASE DE DATOS TIENE EN SU NOMBRE EL MES EN CURSO

const months = ['ene', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec' ]
const [week_day, month, day, year, time] = new Date().toString().split(' ')

// EJ: [ 'Sun', 'Jun','29', '2025','20:09:25', 'GMT+0200','(hora',    'de','verano',   'de','Europa',   'central)'  ]

const [hour, min, sec] = time.split(":")

/*
* @params {
*      stripeId,
*      status: "PENDING", "SUCCESS" ...
*      user: {},
*      cart: {},
*  } data
* 
*/
export const insertOne = async (data)=>{
    console.log("Payment -> insertOne")
    // console.log(data)
    const params = {
        dbName: systemConfig.DBS.PAYMENTS + year,
        collection: month.toLowerCase(),
        await: true
    }

    // EN EL _ID INCLUYO VARIOS CAMPOS PARA NO CREAR MAS INDICES EN LA DB. 
    const data_db = {
        ...data, 
        date:  {year: year, month: month, day: day, hour: hour, min: min, sec: sec}, 
        _id: {
            _id: data.stripeId,
            date: {year: year, month: month, day: day, hour: hour, min: min, sec: sec},
            method: "STRIPE-CARD",
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
    let filter = null;

    if(data.task === "UPDATE_STATUS_PAYMENT"){

        if(data.paymentMethod === "STRIPE-CARD"){
            filter = {"_id._id": data.stripeId}

        }else if(data.paymentMethod === "STRIPE-BIZUM"){
            filter = {"_id._id": data.bizumId}

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
        
        filter = {"_id._id": data.stripeId}
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



