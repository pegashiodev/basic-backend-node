
import userHandler from "../users/userHandler.js";
import { randomUUID } from "node:crypto"



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
            user: req.user,
            new_value: new_device,
            await: false
        }
        userHandler.updateUser(data);
    
        // SEND EMAIL !!! (ALERTA DE INICIO DE SESSION DESDE OTRO DISPOSITIVO)
    }

}