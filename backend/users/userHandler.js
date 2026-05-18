
import systemConfig from "../globalData/systemConfig.js";
import userSchema from "./userSchema.js";
import dbCrudHandler from "../db/dbCrudHandler.js";
import usersByEmail from "../globalData/usersByEmail.js";

const months = ['ene', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec' ]

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
        // collection: months[user.since_month],                                    // collection = Mes de alta el usuario
        collection: user.since_day_week + user.since_day_number,                    // collection = dia semana + dia mes numero

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

export const updateUserSaldo = async (data)=>{
    console.log("** UPDATE USER SALDO ")
    console.log(data)

    const params = {
        dbName: systemConfig.DBS.USERS_DATA + data.user.since_year,                  // dbName = users_ + año de alta del usuario
        collection: data.user.since_day_week + data.user.since_day_number,     // collection = dia semana + dia mes numero

        await: data.await,                        
    }
    const filter = {_id: data.user.userId}
    
    const obj = {}
    obj[data.key_to_change] = data.quantity
    
    let update_data;

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
            usersByEmail[data.user.email].saldoCoins += data.quantity
        }else{
            usersByEmail[data.user.email].saldoCoins -= data.quantity
        }
        return result_update;
    
    }else{
        
        dbCrudHandler.updateOne(filter, update_data, params);
        if(data.task === "ADD"){
            usersByEmail[data.user.email].saldoCoins += data.quantity
        }else{
            usersByEmail[data.user.email].saldoCoins -= data.quantity

        }
    }



}

export const updateUser = async (data)=>{

    console.log("** UPDATE USER DATA ")
    console.log(data)

    const params = {
        dbName: systemConfig.DBS.USERS_DATA + data.user.since_year,       // dbName = users_ + año de alta del usuario
        // collection: data.user.since_month ,     // collection = Mes de alta el usuario
        collection: data.user.since_day_week + data.user.since_day_number  ,     // collection = dia semana + dia mes numero

        await: data.await,                        
    }
        

    if(data.task === 'UPDATE_USER_STATUS'){

        const filter = {_id: data.user.userId}
       
        const update_data = {
          
            $set: {"status": data.new_value}

        }
        
        if(data.await){

            let result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            
            console.log("!!!! Result de UPDATE USER DATA IN DB************")
            console.log(result_update);
            usersByEmail[data.user.email].status = data.new_value
            
            return result_update;
        
        }else{
            
            dbCrudHandler.updateOne(filter, update_data, params);
            usersByEmail[data.user.email].status = data.new_value
        }


    }else if(data.task === 'UPDATE_EMAIL_ID'){

        const filter = {_id: data.user.userId}

        const update_data = {
            $set: {"id_verify_email": data.new_value.id_verify_email, "id_verify_expireTime": data.new_value.id_verify_expireTime}
        }

        if(data.await){

            let result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            
            console.log("!!!! Result de UPDATE USER DATA IN DB************")
            console.log(result_update);
            return result_update;
        
        }else{
            
            dbCrudHandler.updateOne(filter, update_data, params);
            
        }
        // ACTUALIZAMOS EN LOS CACHEADOS
        usersByEmail[data.user.email].status = 'EMAIL_NOT_VERIFIED',
        usersByEmail[data.user.email].id_verify_email = data.new_value.id_verify_email
        usersByEmail[data.user.email].id_verify_expireTime = data.new_value.id_verify_expireTime
        

    }else if(data.task === 'UPDATE_USER_DEVICES'){
        // AÑADIMOS EL NUEVO DEVICE AL ARRAY DEL USER
        const filter = {_id: data.user.userId}
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
        usersByEmail[data.user.email].userDevices.push(data.new_value);
        
    }else if(data.task === 'UPDATE_PASSWORD'){
        const filter = {_id: data.user.userId}

        const update_data = {
            $set: {password: data.new_value}
        }
        if(data.await){

            let result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            
            console.log("!!!! Result de UPDATE USER DATA IN DB************")
            console.log(result_update);
            // ACTUALIZAMOS EN LOS CACHEADOS
            usersByEmail[data.user.email].password = data.new_value;
            return result_update;
        
        }else{
            
            dbCrudHandler.updateOne(filter, update_data, params);
            // ACTUALIZAMOS EN LOS CACHEADOS
            usersByEmail[data.user.email].password = data.new_value;
            
        }
        

    }else if(data.task === "UPDATE_PASSWORD_AND_STATUS"){
        const filter = {_id: data.user.userId}

        const update_data = {
            $set: {password: data.new_value, status: "ACTIVE"}
        }
        if(data.await){

            let result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            
            console.log("!!!! Result de UPDATE USER DATA IN DB************")
            console.log(result_update);
            // ACTUALIZAMOS EN LOS CACHEADOS
            usersByEmail[data.user.email].password = data.new_value;
            usersByEmail[data.user.email].status = "ACTIVE"            
            return result_update;
        
        }else{
            
            dbCrudHandler.updateOne(filter, update_data, params);
            // ACTUALIZAMOS EN LOS CACHEADOS
            usersByEmail[data.user.email].password = data.new_value;
            usersByEmail[data.user.email].status = "ACTIVE"            
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

