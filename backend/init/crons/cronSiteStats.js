

/**
 * CRON: Vuelca las estadísticas de tráfico acumuladas en memoria hacia MongoDB
 */

import dbCrudHandler from "../../db/dbCrudHandler.js";
import siteStatsCatched from "../../globalData/siteStatsCatched.js";
import systemConfig from "../../globalData/systemConfig.js";

export default async function cronSiteStats() {
    const hours = Object.keys(siteStatsCatched);
    if (hours.length === 0) return;

    console.log(`📊 [CRON SiteStats] Guardando estadísticas acumuladas (${hours.length} franjas horarias)...`);

    const [week_day, month, day, year] = new Date().toString().split(' ');

    const params = {
        dbName: systemConfig.DBS.SITE_STATS + year,
        collection: month.toLowerCase(),
        upsert: true,
        await: true
    };

    for (const hourKey of hours) {
        const hourData = siteStatsCatched[hourKey];
        if (!hourData || !hourData.endpoints) {
            delete siteStatsCatched[hourKey];
            continue;
        }

        const urls = Object.keys(hourData.endpoints);
        const parsedHour = parseInt(hourKey.split('_')[1] || '0', 10);

        for (const url of urls) {
            const arr_ips = hourData.endpoints[url] || [];
            if (arr_ips.length === 0) continue;

            const filter = {
                _id: {
                    month: month.toLowerCase(),
                    day: parseInt(day, 10),
                    hour: parsedHour
                }
            };

            const update_data = {
                $set: {
                    year: year,
                    month: month.toLowerCase(),
                    day: parseInt(day, 10),
                    hour: parsedHour
                },
                $push: {
                    [`endpoints.${url}`]: { $each: arr_ips }
                }
            };

            try {
                await dbCrudHandler.updateOne(filter, update_data, params);
            } catch (err) {
                console.error(`Error guardando estadísticas de ${url}:`, err.message);
            }
        }

        // Limpiar franja horaria una vez persistida
        delete siteStatsCatched[hourKey];
    }
}