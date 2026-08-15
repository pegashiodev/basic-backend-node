/**
 * Manejador de las Sessiones de los usuarios
 * - Crea Sesiones
 * - Acutliza Sesiones
 * - Elimina Sesiones
 * 
 */



import sessionsCached from '../globalData/sessionsCached.js'
import systemConfig from '../globalData/systemConfig.js'
import dbCrudHandler from '../db/dbCrudHandler.js'
import sessionSchema from "./sessionSchema.js"
import addNewUserDevice from "../tools/addNewUserDevice.js"
import verifyTokensAndSetCookie from "../tools/verifyTokensAndSetCookie.js";


/**
 * CREAR UNA SESSION PARA EL USUARIO
 * 
 * @param {Object} req  -> Objeto Request de Node
 * @param {String} from -> String que  nos indica desde donde se llama esta funcion
 * @returns {Object}
 */
export const addSession = async (req, from)=>{

    if(!req.user){
        return {status: 'error'}
    }

    // COMPROBAMOS EL DEVICE DE CONEXION
    if(from != 'SIGNUP'){

        // SI TIENE NUESTRA COOKIE, COMPROBAMOS DEVICE-ID Y USER-AGENT
        if(req.has_our_cookie){
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

    // HAY QUE ESTABLECER LA COOKIE ANTES DE CREAR LA SESION PORQUE LOS DATOS DE LA COOKIE SE GUARDAN EN EL OBJETO "req"
    verifyTokensAndSetCookie(req, req.user, "ADD_SESSION")

    // CREAMOS LAS SESSION COBRE EL ESQUEMA 
    let  session_data = sessionSchema(req);
    let session = session_data.session;

    // ALMACENAMOS SESSION EN DB Y EN MEMORIA
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


/**
 * ACTUALIZAR LA SESSION DEL USUARIO
 * 
 * @param {Object} data 
 * @returns {Object}
 */
export const updateSession = async (data)=>{

    const [week_day, month, day, year, time] = new Date().toString().split(' ')
    const now = Date.now();    
    const params = {
        dbName: systemConfig.DBS.SESSIONS + year,       // dbName = sessions_ + año en curso
        collection: month,                              // collection = Mes en curso
        await: data.await
    }
    
    // ACTUALIZAR LA SESSION A "ENDED"
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

    // ATUALIZAR EL STATUS DE LA SESSION
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