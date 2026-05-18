
import products from "../globalData/productsCached.js"
import { product_template, new_product_template } from "../dinamic-views/products-templates-remote-panel.js"


export default (data, res)=>{

    console.log("productsAdmin")

    const response = {}
    

    if(data.task === "showProducts"){
        console.log("Solicitan SHOW_PRODUCTS")

        response.type = "SHOW_PRODUCTS"
        response.data = products;
        response.html = product_template.html;
        response.style = product_template.style;
        response.script = product_template.script;
        response.params = product_template.params
        response.status = "ok"

        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))

    }else if(data.task === "saveProduct"){
        console.log("SAVE Product")
        console.log(data)
        
        const response = {
            status: "ok",
            message: "Product Saved"
        }
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))


    }else if(data.task === "addNewProduct"){
        console.log("Solicitan ADD_PROMOTION")

        response.type = "ADD_PRODUCT"
        response.html = new_product_template.html;
        response.style = new_product_template.style;
        response.script = new_product_template.script;
        response.params = new_product_template.params
        response.status = "ok"
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))


    }else{

        const response = {
            status: "error",
            message: "Error en ProductsAdmin -> NO valid Task"
        }
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))
    }





}