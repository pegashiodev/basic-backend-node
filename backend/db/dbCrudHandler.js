

/** PARA CREAR IDENTIFICADORES UNICOS */
import { ObjectId } from "mongodb";

/** DICCIONARIO CON LA BASES DE DATOS ABIERTAS */
import dbsOpened from '../globalData/dbsOpened.js';

import { getDb } from './openDbs.js';


/*
export default async function dbCrudHandler(params) {
    // Obtiene directamente la instancia de la base de datos solicitada
    const db = await getDb(params.dbName);
    const collection = db.collection(params.collection);

    // Realiza la operación solicitada (find, insertOne, updateOne, etc.)
    return await collection[params.operation](...params.args);
}
    */


/**
 * 
 * FIND ONE ELEMENT
 * 
 * @param {object} query -> condicion para buscar el elemento de la db
 * @param {object} params -> datos para acceder a la db: nombre, colecccion, await (si se espera por la respuesta), ...
 * EJ
 * const params = {
 *    "dbName": "nombre de la base de datos"
 *    "collection": "nombre de la coleccion"
 *    "await": "le indico si se esta esperando por el resultado, para que en el caso de que sea `false` no devuelva nada"
 *  
 * }
 * 
 * @param {object} options -> acciones a realizar sobre la respuesta: ordenas, proyeccion de elementos, ...
 * 
 * EJ
 * const options = {
      //Ordena la busqueda por orden descendente
      sort: { "imdb.rating": -1 },
      // incluye solo 2l `title`y el campo ìmdb` en el documento de respuesta
      projection: { _id: 0, title: 1, imdb: 1 },
    };
 */
const findOne = async (query, params, options = {})=>{
  
  // const db = dbsOpened[params.dbName];
  const db = await getDb(params.dbName)
  const myColl = db.collection(params.collection);

  try{

    const result = await myColl.findOne(query, options);
    return result

  }catch(error){
    console.log('ERROR findOne Doc')
    console.log(error)
    // {message: 'Error FIND ONE DOC ', from: 'mongoHandlers.findOne', params: [query, options]}
    return null;

  }

}


/**
 * 
 * FIND ALL ELEMENTS
 * 
 * @param {object} query -> condicion para buscar el elemento de la db
 * EJ
 *  const query = { runtime: { $lt: 15 } };
 *  @param {} params -> datos para acceder a la db: nombre, colecccion, await (si se espera por la respuesta), ...
 * EJ
 * const params = {
 *    "dbName": "nombre de la base de datos"
 *    "collection": "nombre de la coleccion"
 *    "await": "le indico si se esta esperando por el resultado, para que en el caso de que sea `false` no devuelva nada"
 *  
 * }
 * 
 * @param {*} options > acciones a realizar sobre la respuesta: ordenas, proyeccion de elementos, ...
 * 
 * EJ
 * const options = {
      //Ordena la busqueda por orden descendente
      sort: { "imdb.rating": -1 },
      // incluye solo 2l `title`y el campo ìmdb` en el documento de respuesta
      projection: { _id: 0, title: 1, imdb: 1 },
    };
 * 
 */
const find = async (query, params, options)=>{

  console.log(options)
  console.log(params)
  
  // const db = dbsOpened[params.dbName];
  const db = await getDb(params.dbName)

  const myColl = db.collection(params.collection);

  try{

    const cursor = myColl.find(query, options);

    /*PROBAR
    const skip = 15,
    const proyection = {}
    const sort = { length: 1, author: 1 };
    const cursor = await myColl.find(query, options).sort(sort).skip(skip).limit(25).proyection(proyection);

    */

    // Print a message if no documents were found
    // if ((await myColl.countDocuments(query)) === 0) {
    //   console.log("No documents found!");
    // }
    const numDocs = await myColl.countDocuments(query);
    // // Print returned documents
    // for await (const doc of cursor) {
    //   console.dir(doc);
    // }
    return { status: "ok", numDocs: numDocs, cursor:cursor};


  }catch(error){
    console.log('ERROR find Doc')
    console.log(error)
    return { status: "error"};

  }

}


/**
 * 
 * INSERTAR 1 ELEMENTO
 * 
 * // OBJETO A INSERTAR
 * @param {object} data -> objeto a insertar en la DB
 * 
 * // DATOS PARA ACCEDER A LA BASE DE DATOS
 * @param {} params -> datos para acceder a la db: nombre, colecccion, await (si se espera por la respuesta), ...
 * EJ
 * const params = {
 *    "dbName": "nombre de la base de datos"
 *    "collection": "nombre de la coleccion"
 *    "await": "le indico si se esta esperando por el resultado, para que en el caso de que sea `false` no devuelva nada"
 *  
 * }
 * @param {*} options -> opciones para la insercion del elemento
 * 
 * 
 */
const insertOne = async (data, params, options = {})=>{

  console.log({params})
  const {dbName, collection} = params;

  const db = await getDb(dbName)
  // const db = dbsOpened[dbName];

  /** SI NO TIENE _ID LO CREAMOS */
  if(!data._id){
    data._id = new ObjectId().toHexString();
  }

  if(!db){
    console.log(`La DB ${dbName} NO ESTA ABIERTA`)
    
    if(params.await){
      return {
        status:'error'
        , message: `DB ${dbName} NO ABIERTA`
        , from : 'mongoHandlers.insertOne'
        , params: {data}
        }
    }else{
      // GUARDAR EN PENDINGTASKS
      // NOTIFICAR ??? 
      console.log(`La DB ${dbName} NO ESTA ABIERTA`)
    }
    
  }

  const myColl = db.collection(collection);

  try {
   
    if(params.await){

      const result = await myColl.insertOne(data);
    
      // console.log('One doc Inserted on MongoDB!! CON EL ID _id: ${result.insertedId}`')
      return {status: "ok"}
      
    }else{
      myColl.insertOne(data);
    }
    
    //console.log(`A document was inserted with the _id: ${result.insertedId}`);
  } catch(error){

       console.log('ERROR insertando ONE Doc')
       console.log(error)

       if(params.await){

         return {
              status:'error'
              , message: err.errorResponse
              , from : 'mongoHandlers.insertOne'
              , params: {data}
              }
       }
  }
}

/**
 * INSERT MANY DOCS IN  DE SAME COLLECTION
 * 
 * @param {object} data [array ] docs a insertar
 * EJ
 * const docs = [
      { name: "cake", healthy: false },
      { name: "lettuce", healthy: true },
      { name: "donut", healthy: false }
    ];
 * @param {object} params // dbName, collectionName, await, ...
 * @param {object} options 
 * // Prevent additional documents from being inserted if one fails
    const options = { ordered: true };
 */
const insertMany = async (data, params, options={})=>{

  const {dbName, collection} = params;
  const db = await getDb(dbName)
  // const db = dbsOpened[dbName];
  const myColl = db.collection(collection);


  try {
    
    const result = await myColl.insertMany(data, options);
    console.log(`MANY DOCS Inserted on MongoDB!! -> ${result.insertedCount} DOCUMENTOS INSERTADOS`)
    return result;
  
  } catch(error) {
    console.log('ERROR insertando Many Doc')
    console.log(error)
    return {status: "error"}

  }
}


/**
 * 
 * DELETE ONE DOCUMENT
 * 
 * @param {object} params -> datos para acceder a la db: nombre, colecccion, await (si se espera por la respuesta), ...
 * 
 * @param {object} query -> query para localizar el elemento a eliminar
 * 
 */
const deleteOne = async (params, query)=>{

  const {dbName, collection} = params;
  // const db = dbsOpened[dbName];
  const db = await getDb(dbName)
  const myColl = db.collection(collection);

  try{
    const result = await myColl.deleteOne(query);
    
    //console.log(`Documentos borrados: ${result.deletedCount}`);
    return result

  }catch(error){
    console.log(`ERROR Deleting One  Doc: ID DEL DOCUMENTO:  ${query._id}`)
    console.log(error)

  }

}


/**
 * 
 * DELETE MANY DOCS 
 * 
 * 
 * @param {object} params -> datos para acceder a la db: nombre, colecccion, await (si se espera por la respuesta), ...
 * @param {object} query -> query para localizar el elemento a eliminar
 * 
 */
  const deleteMany = async (params, query)=>{

    // const dbName = params.dbName;
    // const coll = params.collection;

    const {dbName, collection} = params;
    // const db = dbsOpened[dbName];
    const db = await getDb(dbName)
    const myColl = db.collection(collection);
  
    try{
      const result = await myColl.deleteMany(query);
      // console.log(result.deletedCount);
      return result
  
    }catch(error){
      console.log('ERROR Deleting Many Doc')
      console.log(error)
         // {message: 'Error borrando One doc', from: 'mongoHandlers.deleteOne', params: [params, query]}
  
    }
  
  }


/**
 * 
 * ACTUALIZAR 1 DOCUMENTO
 * 
 * @param {_id: 2323, ...} filter // para la busqueda del doc
 * EJ
 * { name: "Deli Llama" };
 * @param {object} updateData // datos a actualizar
 * EJ
 * {$inc: { "entries.$.y": 33 }}
 * { $unset: { "calls.$[].duration": "" }},
 * { $set: { name: "Deli Llama", address: "3 Nassau St" }};
 * @param {upsert: true, dbName: "nombre_de_la_db", collection: "nombre de la collecion", await: "true"}  
 * 
 * upsert -> Si no exite ese documento, se crea.
 * await -> indica si se esta esperando o no una respuesta del resultado del updateOne
 */
  const updateOne = async (filter, updateData, params)=>{

    // console.log({filter})
    // console.log({params})
    // console.log({updateData})

    // const db = dbsOpened[params.dbName];
    const db = await getDb(params.dbName)
    const myColl = db.collection(params.collection);
    let options = {upsert: false}
    if(params.upsert){
      options.upsert = params.upsert
    }
    
    try{

    

      const result = await myColl.updateOne(filter, updateData, options);
      // console.log(' DATA ACTUALIZADO EN DB')
      return {status: "ok"}
     


    }catch(error){
      console.log('ERROR Update One Doc')
      console.log(error)
     
      // Si era una llamada await, devolvemos el error
      if(params.await){
        return {
          status: 'error',
          message: error.errorResponse

        }
      }

    }

  }




/**
 * 
 * ACTUALIZAR MANY DOCUMENTOS
 * 
 * @param {_id: 2323} filter // para la busqueda del doc
 * EJ
 * { name: "Deli Llama" };
 * @param {} updateData // datos a actualizar
 * EJ
 * {$inc: { "entries.$.y": 33 }}
 * { $unset: { "calls.$[].duration": "" }},
 * { $set: { name: "Deli Llama", address: "3 Nassau St" }};
 * @param {upsert: true, dbName: "nombre_de_la_db", collection: "nombre de la collecion", await: "true"}  
 * 
 * upsert -> Si no exite ese documento, se crea.
 * await -> indica si se esta esperando o no una respuesta del resultado del updateOne
 */
const updateMany = async (filter, updateData, params)=>{

  // const db = dbsOpened[params.dbName];
  const db = await getDb(params.dbName)
  const myColl = db.collection(params.collection);
  let options = {upsert: false}

  if(params.upsert){
    options.upsert = params.upsert
  }
  // console.log(filter)
  // console.log(params)
  // console.log(options)
  
  try{

    const result = await myColl.updateMany(filter, updateData, options);
    // console.log(' DATA ACTUALIZADO EN DB')
    return {ststaus: "ok"}
    
  }catch(error){
    console.log('ERROR Updating Many Doc')
    console.log(error)
    return {status: "error"}
  }
}

/**
 * REMPLAZAR DOCUMENTO
 * 
 * @param {object} filter -> para localizar el documento en la db
 * @param {object} replaceDoc -> documento que susutituye al que se localizo
 * @returns 
 */

const replaceOne = async (filter, replaceDoc)=>{
  
  // const db = dbsOpened[params.dbName];
  const db = await getDb(params.dbName)
  const myColl = db.collection(params.collection);

  try{
    const result = await myColl.replaceOne(filter, replaceDoc);
    // console.log('DOCUMENTO REEMPLAZADO !!')
    // console.log(result)
    return result;


  }catch(error){
    console.log('ERROR replace Doc')
    console.log(error)

  }

}


/**
 * 
 * BUSCAR Y ACTUALIZAR 1 DOCUMENTO
 * 
 * @param {_id: 2323} filter // para la busqueda del doc
 * EJ
 * { name: "Deli Llama" };
 * @param {object} updateData // datos a actualizar
 * EJ
 * {$inc: { "entries.$.y": 33 }}
 * { $unset: { "calls.$[].duration": "" }},
 * { $set: { name: "Deli Llama", address: "3 Nassau St" }};
 * @param {*upsert: true, dbName: "nombre_de_la_db", collection: "nombre de la collecion", await: "true"} options 
 */
const findOneAndUpdate = async (filter, updateData, params)=>{
  
  // console.log({filter})
  // console.log({params})
  // console.log({updateData})

  // const db = dbsOpened[params.dbName];
  const db = await getDb(params.dbName)
  const myColl = db.collection(params.collection);
  let options = {upsert: false}
  if(params.upsert){
    options.upsert = params.upsert
  }
  if(params.returnDocument){
    options.returnDocument = params.returnDocument
  }

  try{

    if(params.await){

      const result = await myColl.findOneAndUpdate(filter, updateData, options);
      // console.log(' DATA ACTUALIZADO Y RETORNADO EN DB')
      // console.log(result)
      return {status: "ok"}
    
    }else{

      myColl.findOneAndUpdate(filter, updateData, options);
    }

  }catch(error){
    console.log('ERROR actualizando Doc')
    console.log(error)

    // Si era una llamada await, devolvemos el error
    if(params.await){
      return {status: 'error', message: err.errorResponse}
    }

  }
}

/**
 * 
 * MULTIPLES INSERCIONES EN DB
 * 
 * @param {object} data 
 * @param {object} params 
 */
const writeBulk = async (data, params)=>{

  // console.log(params)
  // const db = dbsOpened[params.dbName];
  const db = await getDb(params.dbName)
  const myColl = db.collection(params.collection);

  const result = await myColl.bulkWrite(data)
  // console.log(result)
}


export default {

    insertOne, 
    insertMany, 
    deleteOne,
    deleteMany,
    updateOne,
    replaceOne, 
    find,
    findOne,
    findOneAndUpdate,
    updateMany,
    writeBulk,
    
} 