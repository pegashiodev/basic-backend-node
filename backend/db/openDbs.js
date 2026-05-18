

import {MongoClient} from 'mongodb'
import dbsOpened from "../globalData/dbsOpened.js"
process.loadEnvFile()


export default  function (dbNames){
    console.log('Open DBS !!!')



    if(!dbNames){

        return {result: 'error', message:'DBNames es NULL'}

    }
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri)


    // Es el nombre de una Base de Datos para abrirla
    if(typeof dbNames === 'string'){

        try {
            const db = client.db(dbNames);
            // console.log(database)
            dbsOpened[dbNames] = db
            return { status: 'ok'}

        } catch(err) {
            console.log(err)
            return {status: 'error', message: `Error en openDbs ->  abriendo la Db ${dbNames}`}
        }

    }
    // es una Array de nombre de bases de datos
    // Promnise.All
    if(Array.isArray(dbNames)){

        dbNames.forEach((item)=>{
           
            try {
                const db = client.db(item);
                // console.log(database)
                dbsOpened[item] = db
                return { status: 'ok'}
    
            } catch(err) {
                console.log(err)
                return {status: 'error', message: `Error en openDbs ->  abriendo la Db ${item}`}
            }

        })
        

    }else{
        return {status: 'error', message: 'En openDbs -> Formato de DbNames INCORRECTO'}
    }

}


