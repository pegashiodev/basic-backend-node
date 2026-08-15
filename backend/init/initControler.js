
/**
 * PROCESOS QUE SE REALIZAN ANTES DE LANZAR EL SERVIDOR HTTP
 */

import openDbs, { closeDbs } from '../db/openDbs.js';
import openRedis, { closeRedis } from '../db/openRedis.js';
import catchDbData from './handlers/catchDbData.js';
import catchStaticsFiles from './handlers/catchStaticsFiles.js';
import systemCrons from './handlers/systemCrons.js';
import catchHtmlFiles from './handlers/catchHtmlFiles.js';

export default {
    openDbs,
    closeDbs,
    openRedis,
    closeRedis,
    catchDbData,
    catchStaticsFiles,
    catchHtmlFiles, 
    systemCrons, 
};









