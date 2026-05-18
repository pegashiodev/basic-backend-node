
import sessionsCached from '../globalData/sessionsCached.js'
import systemConfig from '../globalData/systemConfig.js'
import dbCrudHandler from '../db/dbCrudHandler.js'
import sessionSchema from "./sessionSchema.js"
import cookieGenerator from '../tools/cookieGenerator.js'
import addNewUserDevice from "../tools/addNewUserDevice.js"
import verifyTokensAndSetCookie from "../tools/verifyTokensAndSetCookie.js";



const months = ['ene', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec' ]

export const addSession = async (req, from)=>{

    if(!req.user){
        return {status: 'ERROR'}
    }

    if(from != 'SIGNUP'){
        // COMPROBAMOS EL DEVIDE DE CONEXION

        if(req.has_our_cookie){

            // COMPROBAMOS DEVICE-ID Y USER-AGENT

            let new_device = {}
        
            // HAY QUE COMPROBAR QUE ES UN USER-AGENT YA ALMACENADO

            let match = req.user.userDevices.some((el)=>{
                
                return  (el.userAgent === req.body.userAgent && el.deviceId === req.body.deviceId)
        
            })
            
            if(!match){
                
                addNewUserDevice(req)
    
            }else{
                console.log('Mismo DEVICE')
            }
        }else{
            // SOLO COMPROBAMOS EL USER-AGENT
            let match = req.user.userDevices.some((el)=>{
                if(el.userAgent === req.body.userAgent){
                    req.body.deviceId = el.deviceId;
                }
                return  (el.userAgent === req.body.userAgent)
            })

            if(!match){
                addNewUserDevice(req)
            }
        }
    }

    console.log('*********** NUEVA SESSION')

    verifyTokensAndSetCookie(req, req.user, "ADD_SESSION")

    let  session_data = sessionSchema(req);
    let session = session_data.session;
   
    cookieGenerator(req)

    // ALMACENAMOS SESSION EN DB
    // Y EN CACHE    
    const params = {
        dbName:  systemConfig.DBS.SESSIONS + session.date.year,
        collection: session.date.month,
        await: true
    }

    const result = await dbCrudHandler.insertOne(session, params);

    if(result.status === 'ok'){
        
        result.atk =  req.accessData.accessToken;
        result.rtk = req.refreshData.refreshToken;
        result.userDevices = req.user.userDevices;
        
        // CACHEAMOS LA SESSION
        sessionsCached[req.user.email] = session;

    }
    return result;

}

export const updateSession = async (data)=>{

    const [week_day, month, day, year, time] = new Date().toString().split(' ')
    const now = Date.now();    
    const params = {
        dbName: systemConfig.DBS.SESSIONS + year,        // dbName = users_ + año en curso
        collection: month,                             // collection = Mes en curso
        await: data.await
    }
    
    if(data.task === 'SESSION_ENDED'){
        console.log("** UPDATE SESSION-ENDED EN SESSIONS")
        console.log({data})
        const filter = {_id: data.new_value._id}
        //delete data.new_value._id
        const update_data =  {$set: data.new_value}
        let result_update
        if(data.await){

            result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            return result_update;
        
        }else{
            dbCrudHandler.updateOne(filter, update_data, params);
            
        }
        // Eliminamos la session de las cacheadas
        delete sessionsCached[data.email]

    }else if(data.task === 'UPDATE_SESSION_NAVIGATION'){

        console.log("** UPDATE SESSION-NAVIGATION EN SESSIONS")
        console.log({data})
        const email = data.session.email
        if(!sessionsCached[email]){
            return;

        }
        sessionsCached[email].navigate.push(data.urlData.endpoint)
        
        // SE GUARDARA EN DB CUANDO FINALICE LA SESSION O CUANDO PASE EL RECOLECTOR
        return;

    }else if(data.task === 'UPDATE_SESSION_STATUS'){

        console.log("** UPDATE SESSION STATUS EN SESSIONS")
        console.log({data})

        const filter = {_id: data.sessionId}
        const update_data = {
            $set: {"status": data.new_value}
        }
        let result_update;

        if(data.await){

            result_update = await dbCrudHandler.updateOne(filter, update_data, params);
            return result_update;
        
        }else{
            dbCrudHandler.updateOne(filter, update_data, params);
            
        }

        if(sessionsCached[data.user.email]){

            sessionsCached[data.user.email].status = data.new_value
        }
        if(data.await){
            return result_update
        }
        
    }else if(data.task = "UPDATE_EMAIL_ID"){

        console.log("** UPDATE EMAIL ID EN SESSIONS")
        console.log({data})

        const filter = {_id: data.sessionId}
        const update_data = { $set: data.new_value}
        
        let result_update = {}

        if(data.await){

            result_update = await dbCrudHandler.updateOne(filter, update_data, params);
        
        }else{
            dbCrudHandler.updateOne(filter, update_data, params);
            
        }

        if(sessionsCached[data.user.email]){
            sessionsCached[data.user.email].id_verify_email = data.user.id_verify_email;
            sessionsCached[data.user.email].id_verify_expireTime = data.user.id_verify_expireTime;
        }
        if(data.await){
            return result_update;
        }

    }else if(data.task === ""){
        
    }



}


export const deleteSesion = (user) =>{
    return {status: 'ok', data: '', message: ''}

}




export default{
    addSession,
    updateSession,
    deleteSesion
}