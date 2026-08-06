
/**
 * ENTREGAMOS ITEMS HTML AL FRONTEND YA RENDERIZADOS
 * DESDE AQUI SE LLAMA AL GET CORRESPONDIENTE (getProducts, getExamples, ...)
 * UNA VEZ OBTENIDOS LOS DATOS, SE RENDERIZAN Y SE ENVIAN AL FRONTEND
 * 
 * LOS ITEMS PUEDEN SER: CARDS, PRODUCTS, EJEMPLOS, ... 
 * 
 */


import renderHtml from "../dinamic-views/renderHtml.js";
import getProducts from "../db/getProducts.js";
import getMyBots from "../db/getMyBots.js"
import getClExamples from "../db/getClExamples.js";
import getBots from "../db/getBots.js";
import getMyQuestions from "../db/getMyQuestions.js";



/**
 * 
 * @param {object} Objeto Request de NodeJS 
 * @param {object} Objeto Response de NodeJS
 */

export default async function(req, res){

    console.log("En getHtmlItems!!")
    console.log(req.body)
    console.log(req.user)

    const params = req.body.params;     // pointer, filter, limit, skip, task = que_Items_quiere, 
    
    if(!options.task){
        res.writeHead(404, {});
        res.end();
    }

    if(options.task === 'products'){
        
        try{

            const data = await getProducts(req, params);
            const items = await renderHtml(data, "products")

            const response_data = {
                status: "ok",
                data: items.html,
                styles: items.styles,
                js: items.js
            }
            sendResponse("ok", response_data)

        }catch(error){
            console.log(error)
            const response_data = {
                status: "ok",
                message: "Error en la consulta de la DB",
            }
            sendResponse("error", response_data)
        }


    }else if(options.task === "examples"){
        try{

            const data = await getClExamples(req, options);
            const items = await renderHtml(data, "examples")

            const response_data = {
                status: "ok",
                data: items.html,
                styles: items.styles,
                js: items.js
            }
            sendResponse("ok", response_data)

        }catch(error){
            console.log(error)
            const response_data = {
                status: "ok",
                message: "Error en la consulta de la DB",
            }
            sendResponse("error", response_data)
        }


    }else if(options.task === "my-questions"){
        try{

            const data = await getMyQuestions(req, options);
            const items = await renderHtml(data, "my-questions")

            const response_data = {
                status: "ok",
                data: items.html,
                styles: items.styles,
                js: items.js
            }
            sendResponse("ok", response_data)

        }catch(error){
            console.log(error)
            const response_data = {
                status: "ok",
                message: "Error en la consulta de la DB",
            }
            sendResponse("error", response_data)
        }


    }else if(options.task === "bots"){

        try{

            const data = await getBots(req, options);
            const items = await renderHtml(data, "bots")

            const response_data = {
                status: "ok",
                data: items.html,
                styles: items.styles,
                js: items.js
            }
            sendResponse("ok", response_data)

        }catch(error){
            console.log(error)
            const response_data = {
                status: "ok",
                message: "Error en la consulta de la DB",
            }
            sendResponse("error", response_data)
        }



    }else if(options.task === "my-bots"){
        try{

            const data = await getMyBots(req, options);
            const items = await renderHtml(data, "my-bots")

            const response_data = {
                status: "ok",
                data: items.html,
                styles: items.styles,
                js: items.js
            }
            sendResponse("ok", response_data)

        }catch(error){
            console.log(error)
            const response_data = {
                status: "ok",
                message: "Error en la consulta de la DB",
            }
            sendResponse("error", response_data)
        }

    }else{

        res.writeHead(400, 
            {   'Content-Type': 'application/json', 
                'Cache-Control': 'no-cache',
            });
        res.end();
    }



    function sendResponse(status, response_data){


        if(status === "ok"){

            res.writeHead(200, 
                {   'Content-Type': 'application/json', 
                    'Cache-Control': 'no-cache',
                });
                        
            res.end(JSON.stringify(response_data));
            return;   

        }else{

            res.writeHead(500, 
            {   'Content-Type': 'application/json', 
                'Cache-Control': 'no-cache',
            });
            res.end(JSON.stringify(response_data));
            return; 

        }

    }

}