

/**
 * 
 *      
 *      "hour_1": {
 *          enpoints: {
 *              "url-1": [ip1, ip2, ...],,
 *              "url-2": [ip1, ip2, ...]
 *              }
 * 
 *      },
 * 
 *      "hour_2": {
 *          enpoints: {
 *              "url-1": [ip1, ip2, ...],,
 *              "url-2": [ip1, ip2, ...]
 *              }
 * 
*          }
 *  
 *  
 * 
 * keys = [ hour_1, hour_2, ...]
 * 
 */


import sessionsCached from "../../globalData/sessionsCached.js";
import siteStatsCatched from "../../globalData/siteStatsCatched.js";

// ALMACENA LA INFO DE LA NAVEGACION EN LA WEB

export default function(req){
    // console.log(req.urlData)
    const hour = new Date().getHours()

    if(!req.urlData?.endpoint){
        return
    }
    const endpoint = req.urlData.endpoint

    //SI USER Y SESSION -> ALMACENAMOS NAVEGACION
    if(req.user){
        if(sessionsCached[req.user.email]){
            sessionsCached[req.user.email].navigate.push(req.urlData.endpoint)
        }
    }
        
    if(!siteStatsCatched["hour_" + hour]){
        siteStatsCatched["hour_" + hour] = {
            endpoints : {}
        }
        siteStatsCatched["hour_" + hour].endpoints[req.urlData.endpoint] = []
        siteStatsCatched["hour_" + hour].endpoints[req.urlData.endpoint].push(req.urlData.ip)

    }else{

        if(!siteStatsCatched["hour_" + hour].endpoints[endpoint]){
            // siteStatsCatched["hour_" + hour].endpoints = {}
            siteStatsCatched["hour_" + hour].endpoints[req.urlData.endpoint] = []
            siteStatsCatched["hour_" + hour].endpoints[req.urlData.endpoint].push(req.urlData.ip)
        
        }else{
            siteStatsCatched["hour_" + hour].endpoints[req.urlData.endpoint].push(req.urlData.ip)
            
        }
        
    }

    console.log({siteStatsCatched})

}