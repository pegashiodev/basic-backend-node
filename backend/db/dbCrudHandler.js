
import { ObjectId } from "mongodb";

import dbsOpened from '../globalData/dbsOpened.js';


/**
 * 
 * @param {} query 
 * @param {*} options 
 * 
 * EJ
 * const options = {
      // Sort matched documents in descending order by rating
      sort: { "imdb.rating": -1 },
      // Include only the `title` and `imdb` fields in the returned document
      projection: { _id: 0, title: 1, imdb: 1 },
    };
 */


const findOne = async (query, params, options = {})=>{
  

  const db = dbsOpened[params.dbName];

  const myColl = db.collection(params.collection);


  try{

    const result = await myColl.findOne(query, options);
    // console.log('Find Doc OK !!')
    // console.log(result);
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
 * @param {} query 
 * EJ
 *  const query = { runtime: { $lt: 15 } };
 * @param {*} options 
 * EJ
 * const options = {
      // Sort matched documents in descending order by rating
      sort: { "imdb.rating": -1 },
      // Include only the `title` and `imdb` fields in the returned document
      projection: { _id: 0, title: 1, imdb: 1 },
    };
 * @returns 
 */


const find = async (query, params, options)=>{

  console.log(options)
  console.log(params)
  const dbName = params.dbName;
  const coll = params.collection;
  const db = dbsOpened[dbName];

  const myColl = db.collection(coll);

  try{

      /**
       * 
       *  // Query for movies that have a runtime less than 15 minutes
          const query = { runtime: { $lt: 15 } };
          const options = {
            // Sort returned documents in ascending order by title (A->Z)
            sort: { title: 1 },
            // Include only the `title` and `imdb` fields in each returned document
            projection: { _id: 0, title: 1, imdb: 1 },
          };
       */



    // Execute query 
    // ***** no await ????
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

    // {message: 'Error FIND ONE DOC ', from: 'mongoHandlers.findOne', params: [query, options]}

  }

}


/*
  doc: documento a insertar
  params: datos para insertar: { dbname, collection, ...}
  options: 

*/


const insertOne = async (data, params, options = {})=>{

  console.log({params})
  const {dbName, collection} = params;

  // const dbName = params.dbName
  // const collection = params.collection
  const db = dbsOpened[dbName];

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
    
      // console.log('One doc Inserted on MongoDB!!')
      return {status: "ok"}
      
    }else{
      myColl.insertOne(data);
    }
    
    // Print the ID of the inserted document
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
 * @param {*} data [array ] docs a insertar
 * const docs = [
      { name: "cake", healthy: false },
      { name: "lettuce", healthy: true },
      { name: "donut", healthy: false }
    ];
 * @param {*} params // dbName, collection, ...
 * @param {*} options 
 * // Prevent additional documents from being inserted if one fails
    const options = { ordered: true };
 */

const insertMany = async (data, params, options={})=>{

  // const dbName = params.dbName;
  // const coll = params.collection;
  const {dbName, collection} = params;

  const db = dbsOpened[dbName];
  const myColl = db.collection(collection);


  try {

    
    // Execute insert operation
    const result = await myColl.insertMany(data, options);
    // console.log('MANY DOCS Inserted on MongoDB!!')
    // console.log(`${result.insertedCount} documents were inserted`);
    return result;

    /**
     *  let ids = insertManyresult.insertedIds;
        console.log(`${insertManyresult.insertedCount} documents were inserted.`);
        for (let id of Object.values(ids)) {
          console.log(`Inserted a document with id ${id}`);
        }
     */
  
  } catch(error) {
    console.log('ERROR insertando Many Doc')
    console.log(error)
    return {status: "error"}

  }
}


/**
 * 
 * @param {dbName, collection, ...} params 
 * @param {*query to delete document} query 
 * 
 * EJ.
 * {_id: '010102ddf},
 * { pageViews: {
   * $gt: 10,
  *$lt: 32768
  *}}
 */

const deleteOne = async (params, query)=>{

  // const dbName = params.dbName;
  // const coll = params.collection;
  const {dbName, collection} = params;
  const db = dbsOpened[dbName];
  const myColl = db.collection(collection);

  try{
    const result = await myColl.deleteOne(query);
    
    // console.log(result.deletedCount);
    return result

  }catch(error){
    console.log('ERROR Deleting One  Doc')
    console.log(error)
       // {message: 'Error borrando One doc', from: 'mongoHandlers.deleteOne', params: [params, query]}

  }

}


/**
 * 
 * @param {dbName, collection, ...} params 
 * @param {*query to delete document} query 
 * 
 * EJ.
 * {_id: '010102ddf},
 * { pageViews: {
  *  $gt: 10,
   * $lt: 32768
  *}}
*
 */

  const deleteMany = async (params, query)=>{

    // const dbName = params.dbName;
    // const coll = params.collection;

    const {dbName, collection} = params;
    const db = dbsOpened[dbName];
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
 * @param {_id: 2323} filter // para la busqueda del doc
 * EJ
 * { name: "Deli Llama" };
 * @param {*} updateData // datos a actualizar
 * EJ
 * {$inc: { "entries.$.y": 33 }}
 * { $unset: { "calls.$[].duration": "" }},
 * { $set: { name: "Deli Llama", address: "3 Nassau St" }};
 * @param {*upsert: true} options 
 */

  const updateOne = async (filter, update_data, params)=>{

    // console.log({filter})
    // console.log({params})
    // console.log({update_data})

    const db = dbsOpened[params.dbName];
    const myColl = db.collection(params.collection);
    let options = {upsert: false}
    if(params.upsert){
      options.upsert = params.upsert
    }
    
    try{

      if(params.await){

        const result = await myColl.updateOne(filter, update_data, options);
        // console.log(' DATA ACTUALIZADO EN DB')
        return {status: "ok"}
     
      }else{
        myColl.updateOne(filter, update_data, options);
      }


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

  
const updateMany = async (filter, update_data, params)=>{

  const db = dbsOpened[params.dbName];
  const myColl = db.collection(params.collection);
  let options = {upsert: false}

  if(params.upsert){
    options.upsert = params.upsert
  }
  // console.log(filter)
  // console.log(params)
  // console.log(options)
  
  try{

    const result = await myColl.updateMany(filter, update_data, options);
    // console.log(' DATA ACTUALIZADO EN DB')
    return {ststaus: "ok"}
    
  }catch(error){
    console.log('ERROR Updating Many Doc')
    console.log(error)
    return {status: "error"}
  }
}


  const replaceOne = async (filter, replaceDoc)=>{
    
    const db = dbsOpened[params.dbName];
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
 * @param {_id: 2323} filter // para la busqueda del doc
 * EJ
 * { name: "Deli Llama" };
 * @param {*} updateData // datos a actualizar
 * EJ
 * {$inc: { "entries.$.y": 33 }}
 * { $unset: { "calls.$[].duration": "" }},
 * { $set: { name: "Deli Llama", address: "3 Nassau St" }};
 * @param {*upsert: true} options 
 */

const findOneAndUpdate = async (filter, update_data, params)=>{
  
  // console.log({filter})
  // console.log({params})
  // console.log({update_data})

  const db = dbsOpened[params.dbName];
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

      const result = await myColl.findOneAndUpdate(filter, update_data, options);
      // console.log(' DATA ACTUALIZADO Y RETORNADO EN DB')
      // console.log(result)
      return {status: "ok"}
    
    }else{

      myColl.findOneAndUpdate(filter, update_data, options);
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

const writeBulk = async (data, params)=>{

  // console.log(params)
  const db = dbsOpened[params.dbName];
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