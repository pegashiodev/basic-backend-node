

/**
 * 
 *      - RECORRE promotionsCodes y los almacena en db (UPDATE)
 *      - SI YA NO QUEDAN UNIDADES DISPONIBLES LO RETIRA DE RAM
 * 
 *      - SI SE TERMINAN LOS CODES NO LO BORRAMOS, LO MARCAMOS 
 *      COMO "ENDED"
 * 
 *      - CUANDO CREAMOS UNO, BUSCAMOS SI YA EXISTE Y SI ES ASI LO ACTUALIZAMOS
 *  
 * 
 * 
 */



import promotionsCached from "../../globalData/promotionsCached.js";
import promotionsHandler from "../../promotions/promotionsHandler.js";

export default function(){

    console.log("Promotions_CRON")
    
    promotionsCodes.forEach((promo)=>{
        // si aun quedan unidades de esta promo
        if(!promo.ended){
            // si ha sido utilizado desde la ultima pasada del cron
            if(promo.used){
                // Si aún quedan unidades, lo actualizamos en db
                // NO AWAIT -> NO ESPERAMOS
                promotionsHandler.updatePromo(promo)

                // ES AQUI DONDE MARCAMOS ENDED SI NO QUEDAN MAS UNIDADES
                if(promo.units <= 0){
                    promo.ended = true;
                    promo.status = "ENDED"
                }
                

                promo.used = false
            }
        
        }

    })

}