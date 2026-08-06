
/***
 * 
 *  ANTES DE LANZAR EL SERVIDOR HTTP, AQUI SE CACHEAN DATOS DE LAS DIFERENTES BASES DE DATOS 
 *  EN MEMORIA
 * 
 *  - LOS NOMBRE DE LAS BASES DE DATOS A CACHEAR ESTAN EN "systemConfig.js"
 * 
 *  - lAS SESIONES QUE AUN NO HAN EXPIRADO
 *  - LOS USUARIOS DE LA PLATAFORMA POR EMAIL
 *  - LOS PRODUCTOS QUE ESTAN A LA VENTA 
 *  - LAS PROMOCIONES QUE ESTAN VIGENTES
 * 
 * 
 *  PARA UN SAAS CON UNOS POCOS MILES DE USUARIOS NO ES UNA CARGA IMPORTANTE EN RAM,
 *  PERO PODEMOS REVISARLO
 * 
 *   
 */


import systemConfig from "../../globalData/systemConfig.js"
import usersByEmail from "../../globalData/usersByEmail.js"
import sessionsCached from "../../globalData/sessionsCached.js"
import blackList from "../../globalData/blackList.js"
import dbsOpened from "../../globalData/dbsOpened.js"
import verificationEndpoints from "../../globalData/verificationEndpoints.js"
import productsCached from "../../globalData/productsCached.js"
import promotionsCached from "../../globalData/promotionsCached.js"


export default async ()=>{
    console.log('Catch DB Data !!!')

    const DBS_TO_CATCH_DATA = systemConfig.DBS_TO_CATCH_DATA;
    let dbs_len = DBS_TO_CATCH_DATA.length;
    const now = Date.now()

    try{

        while(dbs_len--){
    
            const dbName = DBS_TO_CATCH_DATA[dbs_len]
            const db = dbsOpened[dbName]
    
            if(!db){
                console.log(`La DB ${dbName} NO ESTA ABIERTA`)
            
            }else{
                
                let collections, collections_names = [], collections_len = 0
    
                try{
    
                    collections = await db.collections();
                    if(collections){

                        collections_len = collections.length;
                    }
                    collections_names = []
                }catch(e){
                    console.log("Error CAcheando los datos de las DBS -> No conexion ??? ")
                    return {status: 'error'}
                    
                }
                
                if(collections_len >0){

                    while(--collections_len >= 0){
                        collections_names.push(collections[collections_len].s.namespace.collection)
                    }
                    let collections_names_len = collections_names.length
            
                    if(collections_names_len > 0){
            
                        // const myColl = db.collection(collections_names[collections_names_len])
                        const myColl = db.collection(collections_names[--collections_names_len])
            
                        const cursor = await myColl.find()
        
                        if ((await myColl.countDocuments({})) > 0) {
                            console.log(`Cacheados datos DB: ${dbName}`)
                           
                            for await (const doc of cursor) {

                                if(dbName === "sessions_2025" || dbName === "sessions_2026"){
                                // SOLO LAS ACTIVAS Y NO EXPIRADAS
                                    if(doc.status === "ACTIVE" && doc.expireTime > now){
        
                                        sessionsCached[doc.email] = doc
                                    }
                                }else if(dbName === "users_data_2025" || dbName === "users_data_2026"){
                                    usersByEmail[doc.email] = doc
        
                                }else if(dbName === "verificationEndpoints_2025" || dbName === "verificationEndpoints_2026"){
        
                                    if(doc.status === "ACTIVE" && doc.expireTime > now){
                                        verificationEndpoints[doc.tokenId] = doc
                                    }
        
                                }else if(dbName === "blacklist"){
        
                                    if(doc.status === "BLOCKED" ||  doc.status === "PAUSED"){
                                        blackList[doc._id] = doc
                                    }
                                
                                }else if(dbName === "products"){
                                    productsCached[doc.ref] = doc
                               
                                }else if(dbName === "promotions"){
                                    
                                    promotionsCached.push(doc)
                                }
                            }
                        }
                    }
                }
    
            }
        }
        // console.log(systemPromotionsCodes)
        // console.log(blackList)
        // console.log(sessionsCached)
        // console.log(usersByEmail)
        return {status: 'ok'}
    }catch(e){
        return {status: 'error'}
    }


}