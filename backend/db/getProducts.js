import dbCrudHandler from "./dbCrudHandler.js"




export default async function(req, params){

    console.log("getProducts !!!")


    /*PROBAR
    const skip = 15,
    const proyection = {}
    const sort = { length: 1, author: 1 };
    const cursor = await myColl.find(query, options).sort(sort).skip(skip).limit(25).proyection(proyection);

    */

    // const params = {
    //     dbName: systemConfig.DBS.PRODUCTS,
    //     collection: "all"
    // }

    const options = {
        skip: params.skip || 0,
        limit: 20,
    }
    const query = {}

    try{

        const products = await dbCrudHandler.find(query, params, options)
        return {status: "ok", products: products}

    }catch(error){
        console.log(error)
        return {status: "error"}


    }

}