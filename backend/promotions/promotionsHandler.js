

import dbCrudHandler from "../db/dbCrudHandler.js"
import promotionsCached from "../globalData/promotionsCached.js"
import systemConfig from "../globalData/systemConfig.js";




export const applyPromoCode = (req)=>{

    console.log("VERIFY_PROMO_CODE")

    let promo_code = req.body.promo_code.trim();

    if(promo_code.length < systemConfig.PROMO_CODE_MIN_LENGTH){
        return {status: "invalid", code: 561, message: "El código promocional no es correcto"}
    }
   
    const promo = promotionsCached.find((el)=>{
        return el.promo_code === promo_code.toUpperCase()
    })


    if(!promo){
        return {status: "blocked", code: 561, message: "El código de la promoción ya no esta disponible"}

    }else if(promo.expireTime < Date.now()){
        return {status: "expired", code: 562 , message: "Este codigo promocional ya ha caducado"}
    
    }else if(promo.status && promo.status !== "ACTIVE"){
        return {status: "blocked", code: 561, message: "El código de la promoción ya no esta disponible"}

    }else if(promo.units <= 0){
        return {status: "consumed", code: 563, message: "El código de la promoción ya se ha agotado"}

    }

    promo.units --;
    promo.used = true;

    // AÑADIMOS LOS DATOS DE LA PROMOCION

    req.body.saldoAds = promo.saldoAds ? promo.saldoAds : 0;
    req.body.saldoCoins = promo.saldoCoins ? promo.saldoCoins : 0;
    req.body.saldoMoney = promo.saldoMoney ? promo.saldoMoney : 0;

    updatePromo(promo)

    return {status: "ok", message: "Valid Promotional Code "}


}

/***
 * 
 *  - ANTES DE CREAR UNA PROMO COMPROBAMOS SI EL CODIGO YA EXISTE
 *  PORQUE NO BORRAMOS CUANDO FINALIZA.
 *  - ASI QUE BUSCAMOS SI EXISTE Y LA REACTIVAMOS 
 *  Y ACTUALIZAMOS LOS DATOS
 * 
 */

export const addPromo = (promo)=>{

    console.log("ADD_PROMO")



}

export const updatePromo = (promo)=>{

    console.log("UPDATE_PROMO_CODE")
    const filter = {_id: promo._id}
    const params = {
        dbName: "promotions",
        collection: "codes",
        await: false,
    }
    const update_data = {$set: promo}

    dbCrudHandler.updateOne(filter, update_data, params)


}

export const deletePromo = (promo)=>{

    console.log("DELETE_PROMO_CODE")

}


export default  {
    applyPromoCode,
    addPromo,
    updatePromo,
    deletePromo,
}