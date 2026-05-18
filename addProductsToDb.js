
import products from "./backend/globalData/products.js"
import dbCrudHandler from "./backend/db/dbCrudHandler.js"
import {MongoClient} from 'mongodb'


const addProductsToDb =  async ()=>{
    
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri)
    const db = client.db("products");
    const myColl = db.collection("clegal");

    const options = {
    }

    try {

        const result = await myColl.insertMany(products, options);
        console.log('PRODUCTS INSERTADOS EN DB')
        console.log(result)
    
    } catch(e) {
        console.log('ERROR insertando Doc')
        console.log(e.code)

    }
    
}

addProductsToDb();