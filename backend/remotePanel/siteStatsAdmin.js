

import dbCrudHandler from "../db/dbCrudHandler.js";
import systemConfig from "../globalData/systemConfig.js";



/*
    data.options: {
    
        periodo-fijo: 1 day / 1 week / 1 month
        periodo-vble: dia inicio y dia de final dentro del mismo mes

    
    }



*/



export default async function(data, res){
    // RECIBIMOS UNA FECHA EN FORMATO -> DAY-MONTH-YEAR [04-09-2024]

    console.log("getSiteStatsHandler !!")
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dec"]
   
    let arr = new Date().toString().split(' ')
    console.log(arr)
    const week_day = arr[0].toLowerCase();
    const month = arr[1].toLowerCase();
    const year = arr[3]
    const number_day = arr[2]
    const time = arr[4]
    arr = time.split(":")
    const hour = arr[0]


    // la condicion la colocamos asi -> DEPENDIENDO DE data.options
    // query = {"_id.month: "lo-que-sea", "_id.day": "lo-que-sea", "_id.hour":"lo-que-sea"}
    let query = {_id:{}}

    if(data.options.period === "lastHour"){
        query._id.month = month
        query._id.day = number_day
        query._id.hour = hour

    }else if(data.options.period === "lastDay"){
        query._id.month = month
        query._id.day = number_day
        query._id.hour = {$gt:0}

    // un dia en concreto    
    }else if(data.options.period === "oneDay"){
        query._id.month = month
        query._id.day = options.day
        query._id.hour = {$gt:0}

    // ultimo mes
    }else if(data.options.period === "lastMonth"){
        query._id.month = month
        query._id.day = {$gt:0}
        query._id.hour = {$gt:0}
    
    }else if(data.options.period === "oneMonth"){
        query._id.month = options.month
        query._id.day = {$gt:0}
        query._id.hour = {$gt:0}

    // Como la db es por año -> Obtenemos todo el contenido de la db.
    }else if(data.options.period === "lastYear"){
        query = {}

    }else{

        console.log("Periodo de tiempo NO DEFINIDO -> ERROR")
        return {status: "error", message: "Periodo de tiempo NO DEFINIDO -> ERROR"}
    }

    // const query = {_id:{month: months[month-1], day: day, hour: {$gt:0}} }
    const params = {dbName: systemConfig.DBS.SITE_STATS + year, collection: month}
    // options -> limit, skip, cursor, projection, ...
    const options = {}

    console.log({query})

    const result = await dbCrudHandler.find(query, params, options)


    if(result.status !== "ok"){
        const response_data = {
            status: "error",
            message: "Error Consultando Stats"
        }
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response_data))
    }

    console.log(`Numero de documentos encontrados: ${result.numDocs}`)
    

    res.end();
    
    // Print returned documents
    // for await (const doc of result.cursor) {
    //     console.dir(doc);
    // }

    // devolvemos los datos o el erros
    // const response_data = {
    //     status: result.status,
    //     data: result.data
    // }




}