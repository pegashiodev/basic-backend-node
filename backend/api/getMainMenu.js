
/**
 * SIRVE EL MENU PRINCIPAL DEL FRONTED:
 * - SI EL USUARIO NO ESTA LOGUEADO ES UN CONTENIDO BASICO
 * - SI EL USUARIO ESTA LOGUEADO LE MUESTRA SUS DATOS MAS RELEVANTES: SALDO, FAVORITOS, ...
 */


import usersByEmail from "../globalData/usersByEmail.js";
import getOurCookie from "../tools/getOurCookie.js";
import {main_menu_basic, main_menu_full} from "../dinamic-views/menu-templates.js"


/**
 * 
 * @param {object} Objeto Requests de NodeJS  
 * @param {object} Objeto Response de NodeJS
 * @returns -> Retorna el menu correspondiente a cada caso
 */
export default function(req, res){
    console.log("getMainMenu")
    console.log("Body: ", req.body)
    // req.body.from -> pagina que pide el menu
    let response = {}
    response.menu = main_menu_basic

    if(!req.headers.cookie){
        console.log("No COOKIE -> BASIC MENU")
        let menu_html_updated;

        if(main_menu_basic.params.length){
            menu_html_updated = replaceParams(req,main_menu_basic)
        }else{
            menu_html_updated = main_menu_basic.html
        }


        response.status=  "ok",
        response.menu.type =  "BASIC",
        response.menu.html = menu_html_updated
        delete response.menu.params;
        delete response.menu.data_for_params

        
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(response));
        return;

    }

    const result_getOurCookie = getOurCookie(req)
   
    // SI NO TIENE NUESTRA COOKIE O SE HA MANIPULADO SERVIMOS EL MENU BASICO
    // SIN ACCESO A LA PARTE DEL USUARIO

    // if(result_getOurCookie.status !== 'ok'){

    //     if(result_getOurCookie.task === "SEND_FETCH_ERROR"){
    //         res.writeHead(200, { 'Content-Type': 'application/json' });
    //         res.end(JSON.stringify(result_getOurCookie.response_data));
    //         return;
    //     }
    // }
    

    if(!req.has_our_cookie){
        console.log("No HAS_OUR_COOKIE -> BASIC MENU")
        let menu_html_updated;
       
        if(main_menu_basic.params.length){
            menu_html_updated = replaceParams(req, main_menu_basic)
        }else{
            menu_html_updated = main_menu_basic.html
        }
        response.status=  "ok",
        response.menu.type =  "BASIC",
        response.menu.html = menu_html_updated
        delete response.menu.params;
        delete response.menu.data_for_params
        
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(response));
        return;

    }

    console.log("HAS_OUR_COOKIE")
    req.user = usersByEmail[req.our_cookie.atk_decoded.email]
    // console.log(req.user)
    // menu = full_menu_html.replace("{{saldoCoins}}", req.user.saldoCoins)
   
    let menu_html_updated;
    response.menu = main_menu_full
        
    if(main_menu_full.params.length){
        menu_html_updated = replaceParams(req, main_menu_full)
    }else{
        menu_html_updated = main_menu_full.html
    }

    response.status=  "ok",
    response.menu.type =  "FULL",
    response.menu.html = menu_html_updated
    delete response.menu.params;
    delete response.menu.data_for_params


    // AÑADIMOS AL response DATOS DE CONFIGURACION
    // PROMOS, USER-PREFERENCES, FAVORITOS, ...
    /**
     *      NO SE SI ESTO ES NECESARIO AQUI 
     *          - TAL VEZ SOLO EN EL CHECKOUT
     * 
     */
    // response.promos_codes = [];
    // promotionsCached.forEach((promo)=>{
    //     if(promo.expireTime > Date.now() && promo.units > 0){
    //         const obj = {
    //             promo_code: promo.promo_code,
    //             saldoCoins: promo.saldoCoins,
    //             discount: promo.discount,
    //             units: promo.units,
    //         }
    //         response.promos_codes.push(obj)
    //     }
    // })
    // console.log(response.promos_codes)

    response.user = {
        preferences: req.user.preferences || [],
        favorites: req.user.favorites || [],
    }    

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(JSON.stringify(response_data));
    return;

}

function replaceParams(req, menu){

    let main_menu_html = menu.html
    let len = menu.params.length;

    for(let i=0; i<len; i++){
    
        // USAMOS REQ.USER PARA OBTENER LOS DATOS
        if(menu.data_for_params === "USER"){

            main_menu_html = main_menu_html.replace("{{"+ menu.params[i]+"}}", req.user[menu.params[i]] )
        }
    }
    
    return main_menu_html

    
}

