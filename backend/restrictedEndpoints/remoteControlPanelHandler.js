


/**
 * 
 *      GET: 
 *          
 * 
 *      POST:
 *          - RECIBIMOS CATEGORIA [products, stats, contents, ....]
 *          - Y TAREA A REALIZAR [ getPromotioins, updateContent, ... ]
 * 
 * 
 */


import systemConfig from "../globalData/systemConfig.js"
import sendStaticFile from "../server/serverHandlers/sendStaticFile.js"
import siteStatsAdmin from "../remotePanel/siteStatsAdmin.js"
import promotionsAdmin from "../remotePanel/promotionsAdmin.js"
import productsAdmin from "../remotePanel/productsAdmin.js"
import publishContentAdmin from "../remotePanel/publishContentAdmin.js"
import usersDataAdmin from "../remotePanel/usersDataAdmin.js"
import shutdownAdmin from "../remotePanel/shutdownAdmin.js"
import logoutAdmin from "../remotePanel/logoutAdmin.js"


export default async (req, res)=>{4


    const remotePanelHandlers = {

        siteStats: siteStatsAdmin,
        promotions: promotionsAdmin,
        products: productsAdmin,
        publishContent: publishContentAdmin, 
        usersData: usersDataAdmin,
        shutdown: shutdownAdmin,
        logout: logoutAdmin,


    }


    console.log("en REMOTE CONTROL PANNEL HANDLER")

    if(req.method === "GET"){
        console.log("get !!!!")
        console.log(req.our_cookie)
        
        req.urlData.restricted_endpoints = true;
        
        if(req.urlData.endpoint === systemConfig.REMOTE_CONTROL_PANEL_ENDPOINT){
            
            if(!req.our_cookie || !req.our_cookie.atk_decoded || !req.our_cookie.rtk_decoded || ! req.our_cookie.stk_decoded){
                // habria que limpiar stk de la cookie ???
                res.code = 404
                return sendStaticFile(req, res)
            }
            // Si stk expired -> Reenviamos a inicie session
            if(req.our_cookie.stk_decoded.expireTime < Date.now()){
                res.code = 200;
                req.urlData.filenName = systemConfig.PAGES.SESSION_IS_REQUIRED
                req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
                return sendStaticFile(req, res);
            }

            // el fileName del pannel ya esta en req.urlData
            if(!req.urlData.searchParams){         // SERVIMOS EL PANEL HOME
                res.code = 200
                return sendStaticFile(req, res)

            }else{      // SERVIMOS EL ENDPOINT QUE LLEGA COMO PARAM 

                console.log(req.urlData.searchParams)

                if(!req.urlData.searchParams.task){
                    res.code = 404;
                    sendStaticFile(req, res)

                }else{
                    if(systemConfig.REMOTE_PANEL_INTERNAL_ENDPOINTS.includes(req.urlData.searchParams.task)){
                        // HAY QUE AÑADIR LA EXTENSIO PORQUE TASK LLEGA POR PARAMETRO
                        req.urlData.fileName = req.urlData.searchParams.task + "." + systemConfig.EXTENSION_STATIC_VIEWS
                        req.urlData.ext = systemConfig.EXTENSION_STATIC_VIEWS
                        return sendStaticFile(req, res);
                    }else{
                        res.code = 404;
                        sendStaticFile(req, res)
                    }
                }

            }

        }else{
            res.code = 404
            return sendStaticFile(req, res)
        }

    }else if(req.method === "POST"){

        // endpoint: /remote-control-pannel
        // body: {
            //     acction a realizar,      // accion -> cambiar promos, acceder a algun valor, modificar algo, ...
            //     cookies con stk,         // cookie especial para acceso a este pannel (httpOnly)
            //     manual_key,              // clave personal para cada acccion
            // }
            
        // VALIDAR NUESTRA COOKIE
        console.log(req.our_cookie)
        console.log(req.urlData)
        console.log(req.body)

        const task = req.urlData.endpoint;

        if(!remotePanelHandlers[req.body.cat]){
            console.log(`No hay Manejador para esta Categoria: ${req.body.cat}`)
            const response_data = {
                status: "error",
                message: "No ha manehador para esta Categoria"
            }
            res.writeHead(200, { 'Content-Type': 'application/js' });
            return res.end(JSON.stringify(response_data))
        }
        if(!req.body.task){
            console.log(`No hay Manejador para esta Tarea: ${req.body.task}`)
            const response_data = {
                status: "error",
                message: "No ha manehador para esta Categoria"
            }
            res.writeHead(200, { 'Content-Type': 'application/js' });
            return res.end(JSON.stringify(response_data))
        }
               
        
        remotePanelHandlers[req.body.cat](req.body, res)


        // LOGOUT -> BORRAR COOKIT STK

    }


}