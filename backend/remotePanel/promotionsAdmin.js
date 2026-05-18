

/**
 * 
 *      ADMINISTRA LAS PROMOCIONES DEL SISTEMA
 * 
 * 
 */

import promotions from "../globalData/promotionsCached.js"
import {promotion_template, new_promotion_template}  from "../dinamic-views/promotions-templates-remote-panel.js"





export default (data, res)=>{

    console.log("En promotionsAdmin")
    const response = {}


    if(data.task === "showPromos"){
        console.log("Solicitan SHOW_PROMOTIONS")

        response.type = "SHOW_PROMOTIONS"
        response.data = promotions;
        response.html = promotion_template.html;
        response.style = promotion_template.style;
        response.script = promotion_template.script;
        response.params = promotion_template.params
        response.status = "ok"

        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))

    }else if(data.task === "savePromo"){
        console.log("SAVE Promo")
        console.log(data)
        
        const response = {
            status: "ok",
            message: "Promotion Saved"
        }
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))


    }else if(data.task === "addNewPromo"){
        console.log("Solicitan ADD_PROMOTION")

        response.type = "ADD_PROMOTION"
        response.html = new_promotion_template.html;
        response.style = new_promotion_template.style;
        response.script = new_promotion_template.script;
        response.params = new_promotion_template.params
        response.status = "ok"
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))


    }else{

        const response = {
            status: "error",
            message: "Error en Promotions -> To valid Task"
        }
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))
    }

    

    


}

const renderPromotionsTemplates = ()=>{

    const templates = [];
    console.log(promotions)
    const html = promotion_template.html;
    const data = promotions
    const params = promotion_template.params;
    let total_params = promotion_template.params.length;

    let len = promotions.length;

    while(len--){
        let item = ""

        for(let i=0; i<total_params; i++){
        
            // USAMOS REQ.USER PARA OBTENER LOS DATOS
            if(promotion_template.data_for_params === "PROMOTION"){

                item = promotion_template.html.replace("{{"+params[i]+"}}", promotions[len][params[i]]);
    
                // main_menu_html = main_menu_html.replace("{{"+ menu.params[i]+"}}", req.user[menu.params[i]] )
            }
        }
        console.log(item)
        templates.push(item)
    }
    console.log(templates)


    return templates;

}