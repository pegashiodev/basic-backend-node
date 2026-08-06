
/***
 * 
 *      PREVIENE ATAQUES DE FUERZA BRUTA POR NUMERO DE PETICIONES POR IP
 * 
 *      MAS ADENTRO LIMITAREMOS POR TIPO DE ACHIVO ( IMG, AUDIO, ...)
 * 
 *          "ip": {
 *              _id: ip,
 * 
 *              "times_by_sec"  : {sec: sec, times: 1},
                "times_by_min"  : {min: min, times: 1},
                "times_10_min"  : {tramo: tramo, times: 1},
                "times_hour"    : {hour: hour, times: 1},
                "times_day"     : {day: day, times: 1},
                "/signup"       : {min: min, times: 1},  
                "/signup.html"  : {min: min, times: 1},  
                "/login"        : {min: min, times: 1},
                "/login.html"   : {min: min, times: 1},

 *              status: "PAUSED",  // "BLOCKED"
 *              spireTime: ,
 *              times_paused: ,
 *              
 * 
 *              }
 * 
 * 
 */




import ddosControl from "../../globalData/ddosControl.js"
import blackList from "../../globalData/blackList.js"
import systemConfig from "../../globalData/systemConfig.js"
import dbCrudHandler from "../../db/dbCrudHandler.js"


/**
 * 
 * @param {object} Objeto Request de NodeJS 
 * 
 */

export default (req)=>{

    console.log('PROXY  !!')

    const [week_day, month, day, year, time] = new Date().toString().split(' ')
    // [ 'Sun', 'Jun','29', '2025','20:09:25', 'GMT+0200','(hora',    'de','verano',   'de','Europa',   'central)'  ]
    const [hour, min, sec] = time.split(":")
    const tramo = Math.floor(min/10)

    let pointer = ddosControl[req.ip]

    if(!pointer){

        // ALMACENA LAS ESTADISTICAS DE USO DE LA PLATAFORMA 
        ddosControl[req.ip] = {
            
            "times_by_sec"  : {sec: sec, times: 1},
            "times_by_min"  : {min: min, times: 1},
            "times_10_min"  : {tramo: tramo, times: 1},
            "times_hour"    : {hour: hour, times: 1},
            "times_day"     : {day: day, times: 1},
            "/signup"       : {min: min, times: 1},  
            "/signup.html"  : {min: min, times: 1},  
            "/login"        : {min: min, times: 1},
            "/login.html"   : {min: min, times: 1},
        }

    }else{

// ¡¡¡¡¡ IMPORTANTE -> USAMOS LA DOBLE COMPARACION PORQUE LOS TIPOS NO SON IGUALES "NUMBER" == "STRING", CREO QUE ASI MAS RAPIDO
        if(pointer.times_by_sec.sec == sec){
            pointer.times_by_sec.times ++
            
            if(pointer.times_by_sec.times > systemConfig.DDOS_RULES.MAX_REQUEST_BY_SECOND){
                
                // AÑADIMOS A BLACKLIST O ACTUALIZAMOS SU ESTADO
                if(!blackList[req.ip]){
                    blackList[req.ip]._id = req.ip
                    blackList[req.ip] = ddosControl[req.ip]
                    blackList[req.ip].status = "PAUSED";
                    blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_PAUSED
                    blackList[req.ip].times_paused = 1;
                    // const params = {
                    //     dbName: "blackListIps",
                    //     collection: "ips",
                    //     await: false
                    // }
                    // dbCrudHandler.insertOne(blackList[req.ip], params)

                }else if(blackList[req.ip].times_paused === 2){
                    blackList[req.ip].status = "BLOCKED";
                    blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_BLOCKED
                    const filter = {
                        _id: req.ip
                    }
                    // const update_data = {$set: blackList[req.ip]}
                    // const params = {
                    //     dbName: "blackListIps",
                    //     collection: "ips",
                    //     await: false
                    // }
                    // dbCrudHandler.updateOne(filter, update_data, params)
                }else{
                    blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_PAUSED
                    blackList[req.ip].times_paused ++;
                }
            }

        }else{
            pointer.times_by_sec.sec = sec
            pointer.times_by_sec.times = 1
        }

        if(pointer.times_by_min.min == min){
            pointer.times_by_min.times ++
            
            if(pointer.times_by_min.times > systemConfig.DDOS_RULES.MAX_REQUEST_BY_MINUTE){

                // AÑADIMOS A BLACKLIST O ACTUALIZAMOS SU ESTADO
                if(!blackList[req.ip]){
                
                    blackList[req.ip] = ddosControl[req.ip]
                    blackList[req.ip].status = "PAUSED";
                    blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_PAUSED
                    blackList[req.ip].times_paused = 1;
                    // const params = {
                    //     dbName: "blackListIps",
                    //     collection: "ips",
                    //     await: false
                    // }
                    // blackList[req.ip]._id = req.ip;
                    // dbCrudHandler.insertOne(blackList[req.ip], params)
                
                }else if(blackList[req.ip].times_paused ===3){
                
                    blackList[req.ip].status = "BLOCKED";
                    blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_BLOCKED
                    // const filter = {
                    //     _id: req.ip
                    // }
                    // const update_data = {$set: blackList[req.ip]}
                    // const params = {
                    //     dbName: "blackList",
                    //     collection: "ips",
                    //     await: false
                    // }
                    // dbCrudHandler.updateOne(filter, update_data, params)

                }else{
                    blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_PAUSED
                    blackList[req.ip].times_paused ++;
                }
            }

        }else{
            pointer.times_by_min.min = min
            pointer.times_by_min.times = 1
        }

        if(pointer.times_10_min.tramo == tramo){
            pointer.times_10_min.times ++
            
            if(pointer.times_10_min.times > 10){
                // console.log('Limite por 10 minutos alcanzado')
            }

        }else{
            pointer.times_10_min.tramo = tramo
            pointer.times_10_min.times = 1
        }

        if(pointer.times_hour.hour == hour){
            pointer.times_hour.times ++
        
        }else{
            pointer.times_hour.hour = hour
            pointer.times_hour.times = 1
        }

        if(pointer.times_day.day == day){
            pointer.times_day.times ++
        
        }else{
            pointer.times_day.day = day
            pointer.times_day.times = 1
        }

        if(req.url.trim() === "/signup.html" || req.url === "/signup"){
            if(pointer[req.url].min == min){
                pointer[req.url].times ++;
               
                if( pointer[req.url].times > systemConfig.DDOS_RULES.MAX_TIMES_SIGNUP_BY_MIN){
                    // PAUSED
                    if(!blackList[req.ip]){
                        blackList[req.ip] = ddosControl[req.ip]
                        blackList[req.ip].status = "PAUSED";
                        blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_PAUSED
                        blackList[req.ip].times_paused = 1;
                        const params = {
                            dbName: "blackListIps",
                            collection: "ips",
                            await: false
                        }
                        blackList[req.ip]._id = req.ip;
                        dbCrudHandler.insertOne(blackList[req.ip], params)
                   
                    }else if(blackList[req.ip].times_paused === 3){
                        blackList[req.ip].status = "BLOCKED";
                        blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_BLOCKED
                        const filter = {
                            _id: req.ip
                        }
                        blackList[req.ip]._id = req.ip
                        const update_data = {$set: blackList[req.ip]}
                        const params = {
                            dbName: "blackListIps",
                            collection: "ips",
                            await: false
                        }
                        dbCrudHandler.updateOne(filter, update_data, params)
                    
                    }else{
                        blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_PAUSED
                        blackList[req.ip].times_paused ++;
                    }
                }

            }else{
                pointer[req.url].min = min;
                pointer[req.url].times = 1
            }
        }
        if(req.url.trim() === "/login.html" || req.url === "/login"){
            
            if(pointer[req.url].min == min){
                pointer[req.url].times ++;
                
                if( pointer[req.url].times > systemConfig.DDOS_RULES.MAX_TIMES_LOGIN_BY_MIN){
                    // PAUSED
                    if(!blackList[req.ip]){
                        blackList[req.ip] = ddosControl[req.ip]
                        blackList[req.ip].status = "PAUSED";
                        blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_PAUSED
                        blackList[req.ip].times_paused = 1;
                        const params = {
                            dbName: "blackListIps",
                            collection: "ips",
                            await: false
                        }
                        blackList[req.ip]._id = req.ip;
                        dbCrudHandler.insertOne(blackList[req.ip], params)
                   
                    }else if(blackList[req.ip].times_paused === 3){
                        blackList[req.ip].status = "BLOCKED";
                        blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_BLOCKED
                        const filter = {
                            _id: req.ip
                        }
                        blackList[req.ip]._id = req.ip
                        const update_data = {$set: blackList[req.ip]}
                        const params = {
                            dbName: "blackListIps",
                            collection: "ips",
                            await: false
                        }
                        dbCrudHandler.updateOne(filter, update_data, params)
                   
                    }else{
                        blackList[req.ip].expireTime = Date.now() + systemConfig.DDOS_RULES.TIME_IP_PAUSED
                        blackList[req.ip].times_paused ++;
                    }
                }

            }else{
                pointer[req.url].min = min;
                pointer[req.utl].times = 1
            }
        }

    }

    // console.log(blackList)
    // console.log(ddosControl)

}
    