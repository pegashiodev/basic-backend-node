

import { getDb } from "../db/openDbs.js";
import systemConfig from "../globalData/systemConfig.js";

export const updateAffiliatePromotion = async (promotion, user)=>{

    // ACTUALIZAMOS EL LISTADO DE USUARIOS DEL AFILIADO
    let dbAffiliates;
    const now = Date.now();
    const [, month, day , year] = new Date().toString().split(' ');
    const normalizedMonth = month.toLowerCase();

    // OBTENEMOS LA BASE DE DATOS PARA ACTUALIZAR EL CONTENIDO DE LA PROMOCION
    try{
        dbAffiliates = await getDb(systemConfig.DBS.AFILIATES)
    }catch(e){
        console.log("ERROR al Obtener getDb() desde promotionsHandler.js")
        throw new Error(`Error en "affiliateService.updateAffiliatePromotion"  al Obtener la base de datos`);
        // return {status: "error", code: 565, message: "ERROR AL ACCEDER A LA BASE DE DATOS DE LAS PROMOCIONES"}
    }
    const affiliatesCollection = dbAffiliates.collection(systemConfig.COLLECTIONS.PROMOTIONS);
    const affiliate_data = {
        email: user.email,
        userId: user._id.userId,
        createdAtTimestamp: promotion.endpoint === "SIGNUP" ? user.createdAtTimestamp : now,
        createdAt:{
            year: promotion.endpoint === "SIGNUP" ? user._id.from.year : year,
            month: promotion.endpoint === "SIGNUP" ? user._id.from.month : normalizedMonth,
            day: promotion.endpoint === "SIGNUP" ? user._id.from.day : day
        },
        type: promotion.type,
        amountBeforeDisconunt: promotion.amountBeforeDisconunt || 0,
        endpoint: promotion.endpoint,
        promoCode: promotion.promoCode,
    }
    const customAffiliateId = {
        afiliateId: promotion.affiliate.userId,
        email: promotion.affiliate.email,
        promoCode: promotion.promoCode
    }

    // ACTUALIZAMOS LA PROMOCION EN DB
    try{
        await affiliatesCollection.updateOne({_id:customAffiliateId}, {$push: {afiliates: affiliate_data}}, {upsert:true});
    }catch(e){
        throw new Error(`Error en "affiliateService.updateAffiliatePromotion"  al Actualizar los datos en la Promocion: ENVIAR A ADMIN ESTA TAREA`);
    }
   
}


export default  {
    updateAffiliatePromotion,
}