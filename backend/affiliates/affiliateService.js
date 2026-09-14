

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

    /* 
        En db hay ya insertado este objeto del AFILIADO:

        {   _id: affiliateId,
            email: affiliateEmail,
            promoCode: "CODIGO PERSONALIZADO PARA ESTE AFILIADO",
            mode: "ONCE", // [ONCE, SUBSCRIPTION, ...]
            type: "COINS" , // [COINS, DISCOUNT, ...]
            createdAt: 
            expiresAt: 
            affiliates. []
        
        }

    */

console.log({promotion})
    
    const affiliateId = promotion.affiliate.userId
    const affiliateEmail =promotion.affiliate.email;
    
    const affiliate_data = {
        user: {
            email: promotion.user.email,
            userId: promotion.user.userId,
        },
        createdAtTimestamp: promotion.endpoint === "SIGNUP" ? promotion.user.createdAt : new Date(),
        createdAt:{
            year: promotion.endpoint === "SIGNUP" ? promotion.user.userId.getTimestamp().getFullYear() : year,
            month: promotion.endpoint === "SIGNUP" ? months[promotion.user.userId.getTimestamp().getMonth()] : normalizedMonth,
            day: promotion.endpoint === "SIGNUP" ? promotion.user.userId.getTimestamp().getDate(): day
        },
        // mode: promotion.mode,
        // type: promotion.type,
        endpoint: promotion.endpoint,
        promoCode: promotion.promoCode,
    }
    if(promotion.type === "DISCOUNT"){
        affiliate_data.amountBeforeDiscount = promotion.amountBeforeDiscount
        affiliate_data.discountPercent = promotion.discountPercent
        affiliate_data.totalAmountInCentsPaid = promotion.totalAmountInCentsPaid;
    }
  
    

    // ACTUALIZAMOS LA PROMOCION EN DB
    try{
        await affiliatesCollection.updateOne({_id:affiliateId}, {$push: {afiliates: affiliate_data}}, {upsert:true});
    }catch(e){
        throw new Error(`Error en "affiliateService.updateAffiliatePromotion"  al Actualizar los datos en la Promocion: ENVIAR A ADMIN ESTA TAREA`);
    }
   
}


export default  {
    updateAffiliatePromotion,
}