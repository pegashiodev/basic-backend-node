

import { getDb } from "../db/openDbs.js";
import systemConfig from "../globalData/systemConfig.js";

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

export const updateAffiliatePromotion = async (promotion)=>{

    // ACTUALIZAMOS EL LISTADO DE USUARIOS DEL AFILIADO
    let dbAffiliates;
    const [, month, day , year] = new Date().toString().split(' ');
    const normalizedMonth = month.toLowerCase();
    // OBTENEMOS LA BASE DE DATOS PARA ACTUALIZAR EL CONTENIDO DE LA PROMOCION
    try{
        dbAffiliates = await getDb(systemConfig.DBS.AFILIATES)
    }catch(e){
        console.log("ERROR al Obtener getDb() desde affiliatesService.updateAffiliatePromotion")
        throw new Error(`Error en "affiliateService.updateAffiliatePromotion"  al Obtener la base de datos`);
        // return {status: "error", code: 565, message: "ERROR AL ACCEDER A LA BASE DE DATOS DE LAS PROMOCIONES"}
    }
    const affiliatesCollection = dbAffiliates.collection(systemConfig.COLLECTIONS.PROMOTIONS);
    
    const affiliate_data = {
        _id: promotion.affiliate.userId,
        affiliateId: promotion.affiliate.userId,
        affiliateEmail: promotion.affiliate.email,
        promoCode: promotion.promoCode,
        mode: promotion.mode,
        email: promotion.user.email,
        userId: promotion.user.userId,
        createdAtTimestamp: promotion.endpoint === "SIGNUP" ? promotion.user.createdAt : new Date(),
        createdAt:{
            year: promotion.endpoint === "SIGNUP" ? promotion.user.userId.getTimestamp().getFullYear() : year,
            month: promotion.endpoint === "SIGNUP" ? months[promotion.user.userId.getTimestamp().getMonth()] : normalizedMonth,
            day: promotion.endpoint === "SIGNUP" ? promotion.user.userId.getTimestamp().getDate(): day
        },
        type: promotion.type,
        amountBeforeDisconunt: promotion.amountBeforeDisconunt ?? 0,
        endpoint: promotion.endpoint,
        promoCode: promotion.promoCode,
    }
    
    

    // ACTUALIZAMOS LA PROMOCION EN DB
    try{
        await affiliatesCollection.updateOne({_id:affiliate_data._id}, {$push: {afiliates: affiliate_data}}, {upsert:true});
    }catch(e){
        throw new Error(`Error en "affiliateService.updateAffiliatePromotion"  al Actualizar los datos en la Promocion: ENVIAR A ADMIN ESTA TAREA`);
    }
   
}


export default  {
    updateAffiliatePromotion,
}