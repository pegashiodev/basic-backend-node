

/**
 * REGISTRO DE TAREAS PROGRAMADAS DEL SISTEMA (CRONs)
 * Se ejecutan únicamente en la instancia principal (o proceso maestro PM2)
 */

import systemConfig from "../../globalData/systemConfig.js";
import cronBackups from "../crons/cronBackups.js";
import cronSiteStats from "../crons/cronSiteStats.js";

export default function systemCrons() {
    console.log("⏰ Iniciando tareas programadas del sistema...");

    // 1. Backups periódicos de bases de datos
    if (systemConfig.CRONS_INTERVALS?.BACKUP_DBS) {
        setInterval(cronBackups, systemConfig.CRONS_INTERVALS.BACKUP_DBS);
        console.log(`  - Backup DBs programado cada ${systemConfig.CRONS_INTERVALS.BACKUP_DBS / 1000}s`);
    }

    // 2. Persistencia de analíticas/estadísticas de tráfico a MongoDB
    if (systemConfig.CRONS_INTERVALS?.SITE_STATS_TO_DB) {
        setInterval(cronSiteStats, systemConfig.CRONS_INTERVALS.SITE_STATS_TO_DB);
        console.log(`  - Persistencia de estadísticas programada cada ${systemConfig.CRONS_INTERVALS.SITE_STATS_TO_DB / 1000}s`);
    }
}