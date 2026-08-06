/**
 *  AÑADE UN NIEVO DEVIDE AL USUARIO DESDE EL QUE SE HA LOGUEADO EN LA PLATAFORMA
 * 
 * ¡OJO -> REVISAR ESTO!!!
 * 
 */


import userHandler from "../users/userHandler.js";
import { randomUUID } from "node:crypto"



/**
 * @param{Object} -> Obleto Request de NodeJs
 * @returns{object} -> session
 */
export default function (req){

    console.log('** Login desde NUEVO DISPOSITIVO')
    // console.log(req.user.userDevices)  

    // ALMACENAMOS EL NUEVO DEVICE
    let new_device = {
        userAgent: req.body.userAgent,
        deviceId: randomUUID()
    }
    req.body.deviceId = new_device.deviceId;
   
    if(req.user){             // REVISAR ESTO -> NO hay user cuando  en DEV siempre trabajo con el mismo ususario y reinicio el servidor

        req.user.userDevices.push(new_device)
        
        // ALMACENAMOS CAMBIOS EN USER
        let data = {
            task: 'UPDATE_USER_DEVICES',
            new_value: new_device,
            await: false
        }
        userHandler.updateUser(data, user);
    
        // SEND EMAIL !!! (ALERTA DE INICIO DE SESSION DESDE OTRO DISPOSITIVO)
    }

}