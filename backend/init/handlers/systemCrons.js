

/**
 * 
 *      INICIA LAS TAREAS QUE SE HARAN DE FORMA PERIODICA EN EL SYSTEMA
 * 
 *      1.- ALMACENAMIENTO PERIODICO DE SESSIONES DE LOS USUARIOS
 *     
 *      2.- ALMACENAR LOS LOGS DE ERRORES
 *      
 *      3.- REVISAR Y EJECUTAR LAS TAREAS PENDIENTES
 *      
 *      4.- BACK-UPS DE LAS BASES DE DATOS
 * 
 *      5.- REVISAR temporalEndpoints -> para eliminar caducados
 * 
 * 
 * 
 */

import systemConfig from "../../globalData/systemConfig.js"
import cronVerificationEndpoints from "../crons/cronVerificationEndpoints.js";
import cronSessions from "../crons/cronSessions.js";
import cronBlackList from "../crons/cronBlackList.js"
import cronTemporalEndpoints from "../crons/cronTemporalEndpoints.js";
import cronBackups from "../crons/cronBackups.js"
import cronSiteStats from "../crons/cronSiteStats.js"
import cronValidationTokensEmailAndSMS from "../crons/cronValidationTokensEmailAndSMS.js";
import cronPromotionsCodes from "../crons/cronPromotionsCodes.js";


export default function(){

    console.log("** systemCrons")
    systemConfig.CRONS.CRON_BACKUPS_DBS_CODE = setInterval(cronBackups, systemConfig.CRONS_INTERVALS.BACKUP_DBS)

    // Eliminamos el cros ya que el update en db se hace cuando se usa la promo
    // setInterval(cronVerificationEndpoints, systemConfig.CRONS_INTERVALS.VERIFICATION_ENDPOINTS)
    setInterval(cronSiteStats, systemConfig.CRONS_INTERVALS.SITE_STATS_TO_DB)
    setInterval(cronBlackList, systemConfig.CRONS_INTERVALS.BLACKLIST)
    setInterval(cronValidationTokensEmailAndSMS, systemConfig.CRONS_INTERVALS.VALIDATION_TOKENS_MANAGE)
    setInterval(cronSessions, systemConfig.CRONS_INTERVALS.SESSIONS)

    // ESTE NO SE HACE ASI. -< SE ACTUALLIZA EN db CADA VEZ QUE SE USA CON CODIGO
    // setInterval(cronPromotionsCodes, systemConfig.CRONS_INTERVALS.PROMOTIONS_CODES)
    


}