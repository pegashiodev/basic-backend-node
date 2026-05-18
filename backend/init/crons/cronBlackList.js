

/***
 * 
 *      SE RECORRE LA BLACKLIST CACHEADA Y SE ELIMINAN LOS 
 *      BLOQUEOS DE IPS TEMPORALES [PAUSED] QUE HAYAN CADUCADO
 *      Y ALADE LAS IPS [BLOCKED] A LA DB
 * 
 * 
 * 
 */

import blackList from "../../globalData/blackList.js"
import dbCrudHandler from "../../db/dbCrudHandler.js";
import systemConfig from "../../globalData/systemConfig.js";


export default function(){



    console.log("CRON_BLACKLIST")

    const now = Date.now();
    const ips = Object.keys(blackList)
    let ips_len = ips.length;
    let ips_to_db = []
    while(ips_len--){

        if(blackList[ips[ips_len]].status === "BLOCKED"){
            // Preparamos Datos para writeBulk
            const obj = {
                updateOne:{
                    filter: {_id:blackList[ips[ips_len]]._id},
                    update: {$set: blackList[ips[ips_len]]},
                    upsert: true
                }
            }
            ips_to_db.push(obj)

        // SI HA SIDO PAUSADO menos de 3 VECES Y HA PASADO EL TIEMPO DEL BLOQUEO
        // LO RETIRAMOS DE LA LISTA
        }else if(blackList[ips[ips_len]].status === "PAUSED"){
            if(blackList[ips[ips_len]].times_paused < 2 && blackList[ips[ips_len]].expireTime < now ){
                delete blackList[ips[ips_len]]         
            }
        }
    }

    const params = {
        dbName: systemConfig.DBS.BLACKLIST,
        collection: "ips",
        await: false
    }

    // console.log(params)
    // console.log(ips_to_db)
    if(ips_to_db.length > 0){

        dbCrudHandler.writeBulk(ips_to_db, params)
    }
   

}