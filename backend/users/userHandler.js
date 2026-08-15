/**
 * 
 *  manejador de los datos del usuario para:
 *      - crear usuario
 *      - actualizar el saldo del usuario
 *      - eliminar usuario
 *      - buscar usuario
 *      - actualizar otros Datos del usuario: (status, password, contacto, ... )
 * 
 */


import systemConfig from "../globalData/systemConfig.js";
import userSchema from "./userSchema.js";
import dbCrudHandler from "../db/dbCrudHandler.js";
import usersByEmail from "../globalData/usersByEmail.js";

// USAMOS EL MES DE ALTA DEL USUARIO PARA ESTABLECER LA "COLLECTION" DE LA BASE DE DATOS
const months = ['ene', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec' ]


/**
 * 
 * @param {object} body -> con los datos del usuario
 * @returns 
 */
export const addUser = async (body)=>{

    // DBname + Collection
    // idUser
    // id2
    // date
    // Guardar en DB
    // Guardar en Cache
    // 

    const stamp = Date.now();

    const user = userSchema(body);

    const params = {
        dbName: systemConfig.DBS.USERS_DATA + user.since_year,   // dbName = users_ + año de alta del usuario
        collection: months[user.since_month],                                    // collection = Mes de alta el usuario
        // collection: user.since_day_week + user.since_day_number,                    // collection = dia semana + dia mes numero

        await: true
    }
    

    let result = await dbCrudHandler.insertOne(user, params)
    
    console.log("!!!! Result de ADDUSER IN DB************")
    console.log(result);

    if(result.status === 'ok'){
        result.user = user;
    }
    usersByEmail[user.email] = user;
    
    return result;
    

}


/**
 * 
 * @param {object} data -> con los datos a modificar
 * @param {*} user -> usuario al que hay que actualizar datos
 * @returns 
 */
export const updateUserSaldo = async (data, user)=>{
    console.log("** UPDATE USER SALDO ")
    //console.log(data)

    const params = {
        // dbName = users_ + año de alta del usuario
        dbName: systemConfig.DBS.USERS_DATA + user.since_year,     
        // collection = dia semana + dia mes numero             
        collection: months[user.since_month],     
        await: data.await,                        
    }

    const filter = {_id: user.userId}
    
    const obj = {}
    obj[data.key_to_change] = data.quantity
    
    let update_data;

    // SUMAMOS SALDO O RESTAMOS SALDO SEGUN SEA EL TIPO DE OPERACION
    // EN EL SAAS EL USUARIO PUEDE RECIBIR SALDO DE PUBLICIDAD, DE LA EMPRESA, PROMOCIONES, ...
    if(data.task === "ADD"){
        obj[data.key_to_change] = data.quantity
        update_data = {$inc: obj}
   
    }else{
        obj[data.key_to_change] = - data.quantity
        update_data = {$inc: obj}

    }

    if(data.await){

        let result_update = await dbCrudHandler.updateOne(filter, update_data, params);
        
        console.log("!!!! Result de UPDATE USER DATA IN DB************")
        console.log(result_update);
        
        if(data.task === "ADD"){
            usersByEmail[user.email].saldoCoins += data.quantity
        }else{
            usersByEmail[user.email].saldoCoins -= data.quantity
        }
        return result_update;
    
    }else{
        
        dbCrudHandler.updateOne(filter, update_data, params);
        if(data.task === "ADD"){
            usersByEmail[user.email].saldoCoins += data.quantity
        }else{
            usersByEmail[user.email].saldoCoins -= data.quantity

        }
    }



}


export const updateUser = async (data, user)=>{

    console.log("** UPDATE USER DATA ")
    console.log(data)

    const params = {
        dbName: systemConfig.DBS.USERS_DATA + user.since_year,          // dbName = users_ + año de alta del usuario
        collection: months[user.since_month],                           // collection = MES 
        await: data.await,                        
    }
        

    if(data.task === 'UPDATE_USER_STATUS'){

        const filter = {_id: user.userId}
       
        const update_data = {
          
            $set: {"status": data.new_value}

        }
        
        if(data.await){

            let result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            
            console.log("!!!! Result de UPDATE USER DATA IN DB************")
            console.log(result_update);
            usersByEmail[user.email].status = data.new_value
            
            return result_update;
        
        }else{
            
            dbCrudHandler.updateOne(filter, update_data, params);
            usersByEmail[user.email].status = data.new_value
        }


    }else if(data.task === 'UPDATE_USER_DEVICES'){
        // AÑADIMOS EL NUEVO DEVICE AL ARRAY DEL USER
        const filter = {_id: user.userId}
        const update_data = {$push: {userDevices: data.new_value}}
       
        if(data.await){

            let result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            
            console.log("!!!! Result de UPDATE USER DATA IN DB************")
            console.log(result_update);
            return result_update;
        
        }else{
            
            dbCrudHandler.updateOne(filter, update_data, params);
            
        }
        // ACTUALIZAMOS EN LOS CACHEADOS
        usersByEmail[user.email].userDevices.push(data.new_value);
        
    }else if(data.task === 'UPDATE_PASSWORD'){
        const filter = {_id: user.userId}

        const update_data = {
            $set: {password: data.new_value}
        }
        if(data.await){

            let result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            
            console.log("!!!! Result de UPDATE USER DATA IN DB************")
            console.log(result_update);
            // ACTUALIZAMOS EN LOS CACHEADOS
            usersByEmail[user.email].password = data.new_value;
            return result_update;
        
        }else{
            
            dbCrudHandler.updateOne(filter, update_data, params);
            // ACTUALIZAMOS EN LOS CACHEADOS
            usersByEmail[user.email].password = data.new_value;
            
        }
        

    }else if(data.task === "UPDATE_PASSWORD_AND_STATUS"){
        const filter = {_id: user.userId}

        const update_data = {
            $set: {password: data.new_value, status: "ACTIVE"}
        }
        if(data.await){

            let result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            
            console.log("!!!! Result de UPDATE USER DATA IN DB************")
            console.log(result_update);
            // ACTUALIZAMOS EN LOS CACHEADOS
            usersByEmail[user.email].password = data.new_value;
            usersByEmail[user.email].status = "ACTIVE"            
            return result_update;
        
        }else{
            
            dbCrudHandler.updateOne(filter, update_data, params);
            // ACTUALIZAMOS EN LOS CACHEADOS
            usersByEmail[user.email].password = data.new_value;
            usersByEmail[user.email].status = "ACTIVE"            
        }
    }



    return {status: 'ok', data: '', message: ''}

}

export const findUser = (user)=>{
    return {status: 'ok', data: '', message: ''}

}

export const deleteUser = (user)=>{
    return {status: 'ok', data: '', message: ''}

}

export default  {
    addUser,
    updateUser,
    deleteUser,
    findUser,
    updateUserSaldo,
}

