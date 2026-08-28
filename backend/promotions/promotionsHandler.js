
/****
 * 
 *  CUANDO UN USARIO SE REGISTRA EN LA PLATAFORMA SE 
 *  PASA POR AQUI PARA REVISAR SI ENVIA UN CODIGO PROMOCIONAL
 * 
 *      - SI ES CORRECTO SE REALIZA LA ACCION QUE SEA EN CADA CASO
 * 
 */




import dbCrudHandler from "../db/dbCrudHandler.js"
import { getDb } from "../db/openDbs.js";
import systemConfig from "../globalData/systemConfig.js";


/**
 *  APLICA EL CODIGO DE LA PROMO QUE VIENE EN SU PETICION SI ES CORRECTO
 * 
 * @param {*} req 
 * @returns 
 */

const promotions = [
    {
        _id: 'MIDU',
        promotionId: "MIDU", 
        status: 'ACTIVE',               
        endpoint: "CHECKOUT",
        promoCode: 'MIDU',
        expiresAt: new Date('2027-12-31T23:59:59').getTime(),
        owner: {
            name: 'mididev',
            email: 'midudev@gmail.com',
            userId: '12312nmnmkj123jk'
        },
        type: "DISCOUNT",        
        discountPercent: 20,
        units: 120,
        
    },
    {
        _id: 'BIENVENIDA',
        promotionId: "BIENVENIDA",
        status: 'ACTIVE',
        endpoint: "SIGNUP",
        promoCode: 'BIENVENIDA',
        expiresAt: new Date('2027-12-31T23:59:59').getTime(),
        owner: {
          name: 'system',
          email: 'system@gmail.com',
          userId: '12312nmnmkj123jk'
        },
        type: "COINS",        
        coins:{
            generator: 500,
            trainnig: 200,
            coaching: 200,
            audio: 50,
            images: 50,
            video: 10
        },
        units: 120,
       
      },
    
    ]


export const  validatePromotion = async (req, from)=>{

    console.log("VERIFY_PROMO_CODE")

    const promoCode = req.body.promoCode.toUpperCase();
    // getDB
    
    // Verificar DAtos de la promocion
    let dbPromotions;
    try{
        dbPromotions = await getDb(systemConfig.DBS.PROMOTIONS)
    }catch(e){

        console.log("ERROR al Obtener getDb()")
        return {status: "error", code: 565, message: "ERROR AL ACCEDER A LA BASE DE DATOS DE LAS PROMOCIONES"}
    }
console.log(dbPromotions)
    // BUSCAMOS LA PROMO
    const promotionsCollection = dbPromotions.collection("codes");
    const promotion = await promotionsCollection.findOne({_id:promoCode});

    if(!promotion){
        return {status: "invalid", code: 461, message: "El codigo de Promocion no esta disponible"}

    }else if(promotion.endpoint !== from){
        return {status: "invalid", code: 464 , message: "Este codigo no es valido para este endpoint"}
    
    }else if(promotion.expiresAt < Date.now()){
        return {status: "expired", code: 462 , message: "Este codigo promocional ya ha caducado"}
    
    }else if(promotion.status !== "ACTIVE"){
        return {status: "blocked", code: 461, message: "El código de la promoción ya no esta disponible"}

    }else if(promotion.units !== "INFINITE" && promotion.units <= 0){
        return {status: "consumed", code: 463, message: "El código de la promoción ya se ha agotado"}

    }

    // AÑADIMOS LOS DATOS DE LA PROMOCION AL BODY
    req.body.promotion = promotion;
    // ACTUALIZAMOS LAS UNNIDADES DE LA PROOCION
    if(promotion.units !== "INFINITE" && promotion.units > 0){

       await promotionsCollection.updateOne({_id:promoCode}, {$inc:{units: -1}});
    }
   
    return {status: "ok", code: 200, message: "Valid Promotional Code "}

}


/**
 * APLICA LA PROMOTION AL USUARIO DESPUES DEL SIGNUP O DESPUES DE UNA COMPRA CREAR UNA NUEVA PROMOCION
 * 
 * @param {*} promo 
 */

export const applyPromotion = (req)=>{

    const promotion = req.body.promotion

    console.log("apply_PROMO")
    // actualiza los datos en el user

    // actualiza la promocion restando items

    // almacenar el usuario en la lista de los afiliados de dueño del token

}



/**
 * PARA CREAR UNA NUEVA PROMOCION
 * 
 * @param {*} promo 
 */

export const addPromotion = (promotion)=>{

    console.log("ADD_PROMO")

}



/**
 * ACTUALIZA LOS DATOS DE LA PROMOCION (Ampliar duracion, aumentar el numero de codigos, ...)
 * 
 * @param {*} promo 
 */

export const updateAfiliatePromotion = async (promotion, user)=>{

    // ACTUALIZAMOS EL LISTADO DE USUARIOS DEL AFILIADO
    let dbAfiliates;

    // OBTENEMOS LA BASE DE DATOS PARA ACTUALIZAR EL CONTENIDO DE LA PROMOCION
    try{
        dbAfiliates = await getDb(systemConfig.DBS.AFILIATES)
    }catch(e){
        console.log("ERROR al Obtener getDb() desde promotionsHandler.js")
        throw new Error(`Error en "promotionsHandler.updatePromotion"  al Obtener la base de datos`);
        // return {status: "error", code: 565, message: "ERROR AL ACCEDER A LA BASE DE DATOS DE LAS PROMOCIONES"}
    }
    const afiliatesCollection = dbAfiliates.collection("codes");
    const afiliate_data = {
        email: user.email,
        createdAtTimestamp: user.createdAtTimestamp,
        createdAt:{
            year: user._id.from.year,
            month: user._id.from.month,
            day: user._id.from.day,
            
        },
        type: promotion.type,
        amountBeforeDisconunt: promotion.amountBeforeDisconunt || 0,
        from: promotion.endpoint,
        promoCode: promotion.promoCode,
        userId: user._id._id
    }
    const customAfiliateId = {
        _id: promotion.owner.userId,
        email: promotion.owner.email,
        promoCode: promotion.promoCode
    }

    // ACTUALIZAMOS LA PROMOCION EN DB
    try{
        await afiliatesCollection.updateOne({_id:customAfiliateId}, {$push: {afiliates: afiliate_data}}, {upsert:true});
    }catch(e){
        throw new Error(`Error en "promotionsHandler.updatePromotion"  al Actualizar los datos en la Promocion`);
    }
   
}


/**
 * ELIMINA UNA PROMOCION
 * 
 * @param {*} promo 
 */
export const deletePromotion = (promotion)=>{

    console.log("DELETE_PROMO_CODE")

}


export default  {
    applyPromotion,
    addPromotion,
    updateAfiliatePromotion,
    deletePromotion,
}