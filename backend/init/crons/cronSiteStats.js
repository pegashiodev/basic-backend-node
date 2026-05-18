
/****
 *      
 *      - Hace una instatanea de siteStatsCatched 
 *      - La almacena en DB
 *      - deja siteStatsCatched Limpia = {} 
 * 
 *      - FORMATO: siteStatsCatched
 * 
 *          {
 *              hour_[hora-1]:{
 *                  endpoints{
 *                      "index": [ip1, ip2, ...],
 *                      "url-2": [ip1, ip2, ...],
 *                      ...
 *                  }
 *              },
 * 
 *              hour_[hora-2]: {
 *              
 *              },
 *              ....
 * 
 *          }
 * 
 *      - FORMATO EN LA DB
 * 
 *      - Colelction:  mes
 *      - doc: 
 *          HAY UN DOC POR CADA HORA DEL DIA Y POR CADA DIA
 *          {
 *              _id: [dia-en-numero] + "_" + hour_[hora-n],
 *              day: [dia],
 *              hour: hour_[hora-n],
 *              endpoints: {
 *                  "url-1": [ip1, ip2, ...],
 *                  "url-2": [ip1, ip2, ...] ,
 *                  ...
 *              }
 * 
 *          }
 * 
 */

import dbCrudHandler from "../../db/dbCrudHandler.js";
import siteStatsCatched from "../../globalData/siteStatsCatched.js"
import systemConfig from "../../globalData/systemConfig.js"


export default ()=>{

    console.log("CRON SiteStats")
    // // Hacemos la tarea a una hora en concreto: DE MADRUGADA
    // LA TAREA LA MARCAMOS EN EL SYSYTEMCONFIG CADA 60 MINUTOS
    // HACEMOS DE 3-4 A.M.
    // const hour = new Date().getHours()
    // if(hour <3 || hour >4){
    //     return;
    // }

    const [week_day, month, day, year, time] = new Date().toString().split(' ');

    const params = {
        dbName: systemConfig.DBS.SITE_STATS + year,
        collection: month.toLowerCase(),
        upsert: true,
        await: false
    }

    const hours = Object.keys(siteStatsCatched)
    let len_hours = hours.length;
// console.log({hours})

    while(len_hours--){
// console.log(hours[len_hours])

        // Obtenemos el listados de endpoints visitados
        const urls = Object.keys(siteStatsCatched[hours[len_hours]].endpoints)
        let endpoints_len = urls.length

        for(let i=0; i<endpoints_len; i++){

            const filter = {
            //    "_id": month.toLowerCase() + day + "_" + hours[len_hours]
            //    "_id": month.toLowerCase() + "_" + day + "_" + hours[len_hours].split("_")[1]
               "_id": {month:  month.toLowerCase(), day: parseInt(day), hour: parseInt(hours[len_hours].split("_")[1])}
            }
            let key = "endpoints." + urls[i]
            //Obtenemos el array de ips que ha visitado ese endpoint
            const arr_ips = siteStatsCatched[hours[len_hours]].endpoints[urls[i]]
           
            const update_data = {
                $set:{year: year, month: month.toLowerCase(), day: parseInt(day), hour: parseInt(hours[len_hours].split("_")[1])},
                $push:{["endpoints." + urls[i]]: {$each:arr_ips}}
            }
            
            dbCrudHandler.updateOne(filter, update_data, params)
        }
        // limpiamos 
        delete siteStatsCatched[hours[len_hours]]

    }
    // console.log({siteStatsCatched})
    // console.log(" CRON_SITE_STATS")
}