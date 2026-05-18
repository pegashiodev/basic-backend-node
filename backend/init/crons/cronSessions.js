

/***
 * 
 *      RECORRE LAS SESSIONES DE LOS USUARIOS 
 *      A UNA HORA CONCRETO Y SI ESTAN 
 *      EXPIRADAS CON UN MARGEN [ ? 2 DIAS]
 *      LAS ELIMINA 
 * 
 * 
 */

import sessionsCached from "../../globalData/sessionsCached.js"
import systemConfig from "../../globalData/systemConfig.js";
import dbCrudHandler from "../../db/dbCrudHandler.js";

const months = ['ene', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec' ]


export default function(){

    console.log("CRON_SESSIONS")

    // LA TAREA LA MARCAMOS EN EL SYSYTEMCONFIG CADA 60 MINUTOS
    // HACEMOS DE 4-5 A.M
    // const hour = new Date().getHours()
    // if(hour <4 || hour >5){
    //     return;
    // }

    const [week_day, month, day, year, time] = new Date().toString().split(' ')
    const now = Date.now();

    const sessions = Object.keys(sessionsCached)
    let len = sessions.length

    
    const this_month = month.toLowerCase()
    const index = months.indexOf(this_month) - 1
    let last_month;
    let last_year;
    let parsed_year = parseInt(year)

    if(index < 0){
        last_month = "dec";
        last_year = --parsed_year
    }else{
        last_month = months[index]

    }
    // REPARTIMOS PORQUE LAS COLLECTIONS DE LA DB SON LOS MESES,
    // Y ESA INFO ESTA EN LA SESSION : session.date.month
    let data_this_month = []
    let data_last_month = []
    let params_1, params_2;

    while(len--){

        if(sessionsCached[sessions[len]].expireTime < now){

            sessionsCached[sessions[len]].status = "ENDED"
            const obj = {
                updateOne: {
                    filter: {
                        _id: sessionsCached[sessions[len]]._id
                    },
                    update: {
                        $set: sessionsCached[sessions[len]]
                    },
                    upsert: true
                }
            }

            // PUEDE COINCIDIR QUE SEAN DE ESTE MES O DEL ANTERIOR
            if(sessionsCached[sessions[len]].date.month === this_month){
                data_this_month.push(obj)
            }else{
                data_last_month.push(obj)
            }
        }
        delete sessionsCached[sessions[len]];
    }
   
    if(data_last_month.length > 0){

        if(last_month === "dec"){
                params_1 = {
                dbName: systemConfig.DBS.SESSIONS + last_year,
                collection: last_month,
                await: false
            }
        }else{
                params_1 = {
                dbName: systemConfig.DBS.SESSIONS + year,
                collection: last_month,
                await: false
            }
        }
        dbCrudHandler.writeBulk(data_last_month, params_1)

    }
    
    if(data_this_month.length > 0){

        params_2 = {
        dbName: systemConfig.DBS.SESSIONS + year,
        collection: this_month,
        await: false
        }
        dbCrudHandler.writeBulk(data_this_month, params_2)
        
    }
    
    // console.log(params_1)
    // console.log({data_last_month})
    
    
    // console.log(params_2)
    // console.log({data_this_month})

    /***
     *      FORMATO DEL UPDATE-BULKWRITE
     * 
     *  
     * const updateOperations = [{
                updateOne: {
                    filter: {
                        title: "Interstellar"
                    },
                    update: {
                        $set: {
                            title: "Interstellar Updated",
                            genre: "Sci-Fi Adventure"
                        }
                    },
                    upsert: true
                }
            }, {
                updateMany: {
                    filter: {
                        rated: "PG-13"
                    },
                    update: {
                        $set: {
                            rated: "PG-13 Updated",
                            genre: "Updated Genre"
                        }
                    }
                }
            }];
            const updateResult = await movies.bulkWrite(updateOperations);
            console.log(`Modified documents: ${updateResult.modifiedCount}`);

     * 
     * 
     */


}