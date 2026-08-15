

import dbsOpened from './backend/globalData/dbsOpened.js';
import systemConfig from './backend/globalData/systemConfig.js';
import initControler from './backend/init/initControler.js';

import os from "node:os"
import cluster from "node:cluster"
let numCpus = os.cpus().length;


const PORT = process.env.MODE === "DEV" ?   process.env.PORT_DEV : process.env.PORT_PROD 
const HOST = process.env.MODE === "DEV" ?   process.env.HOST_DEV : process.env.HOST_PROD 



// ABRIR DBS

// 1. ABRIR DBS
const dbsResult = await initControler.openDbs(systemConfig.DBS_TO_OPEN);

if (dbsResult.status !== 'ok') {
    console.error(`Fallo crítico al iniciar bases de datos: ${dbsResult.message}`);
    process.exit(1); // Detiene el proceso si no hay base de datos
}

console.log('Bases de datos abiertas:', Object.keys(dbsOpened));


// CACHEO STATICOS
if(systemConfig.CATCH_STATIC_FILES){
    initControler.catchStaticsFiles()
    initControler.catchHtmlFiles();
}
// CACHEO DATOS DB
let result_catch_dbs;
if(systemConfig.CATCH_DB_DATA){

    result_catch_dbs = await initControler.catchDbData()
}

// crons

initControler.systemCrons()

import server from './backend/server/server.js'
if(result_catch_dbs.status === 'ok'){


    // LEVANTAR EL SERVIDOR WEB en un unico Nucleo de CPU
    server.listen(PORT, HOST, () => {
        console.log(`Server Process: ${process.pid} running at http://${HOST}:${PORT}/`);
    });


}else{
    console.log("ERROR EN EL CACHEO DE LAS DBS")
    // ENVIAR NOTIFICACION ??? 
}





