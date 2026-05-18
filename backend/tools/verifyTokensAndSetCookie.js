

import sessionsCached from "../globalData/sessionsCached.js";
import generateAccessToken from "../sessions/generateAccessToken.js";
import generateRefreshToken from "../sessions/generateRefreshToken.js";
import generateSecurityToken from "../sessions/generateSecurityToken.js";
import systemConfig from "../globalData/systemConfig.js";


export default function (req, user, from){
    
    // IMPORTANTE
    // HA DE HABER SESSION DEL USUARIO CACHEADA !!!!!
    console.log("VERIFY_TOKENS_AND_SET_COOKIE")

    let session;
    let accessData, refreshData;
    let changeOnlyAtk = false;
    //console.log(req.tokens)
    req.set_new_cookie = false;
    const now = Date.now();
    

  
    if(from === "ADD_SESSION"){                // NO HAY SESSION 

        req.set_new_cookie = true
        refreshData = generateRefreshToken(user.name, user.email);
        req.refreshData = refreshData;

        // Incluimos el rtk en el accessToken para enlazarlos
        accessData = generateAccessToken(user.name, user.email, refreshData.rtk);
        req.accessData = accessData;
        
        // session.atk = accessData.atk;
        // session.atk_expireTime = accessData.expireTime
        // session.rtk = refreshData.rtk;
        // session.rtk_expireTime = refreshData.expireTime
    

    }else if(from === "ACCESS_REMOTE_PANNEL"){          // AÑADIMOS TOKEN para el acceso al panel remoto
    
        // NO SE ACTUALIZA AUTOMATICAMENTE COMO EL RESTO DE TIOKEN DENTRO DE LA MISMA SESSION
        // CUANDO EXPIRA HAY QUE VOLVER A LOGUEARSE -> MAS SEGURIDAD

        let pannelAccessData = generateSecurityToken(user.name, user.email, Date.now());
        req.pannelAccessData = pannelAccessData;
        req.set_new_cookie = true;

    
    }else if(!req.our_cookie){          // NO HAY NUESTRA COOKIE -> nuevos tokens de acceso normal
    
        session = sessionsCached[req.user.email]

        if(session){

            refreshData = generateRefreshToken(session.name, session.email);
            req.refreshData = refreshData;
            session.rtk = refreshData.rtk;
            session.rtk_expireTime = refreshData.expireTime
    
            accessData = generateAccessToken(session.name, session.email, refreshData.rtk);
            req.accessData = accessData;
            session.atk = accessData.atk;
            session.atk_expireTime = accessData.expireTime
    
            req.set_new_cookie = true
        }else{
            console.log("NO hay SESION y estoy en VerifyTokenAndSetCookie !!! -> 1")
        }
  
    }else{              // COMPROBAMOS SI LOS TOKENS HAN CADUCADO
        
        session = sessionsCached[req.user.email]
        if(session){

            let temp_rtk = req.our_cookie.rtk_decoded?.rtk

            if(req.our_cookie.rtk_decoded?.rtk !==  session.rtk ||  session.rtk_expireTime < now){ // SI RTK CADUCADO HAY QUE CAMBIER TAMBIEN ATK
                req.set_new_cookie = true
                refreshData = generateRefreshToken(session.name, session.email);
                console.log("*********** RTK EXPIRADO")
                console.log(refreshData)
                req.refreshData = refreshData;
                session.rtk = refreshData.rtk;
                session.rtk_expireTime = refreshData.expireTime
                temp_rtk = refreshData.rtk

                accessData = generateAccessToken(session.name, session.email, temp_rtk);    // Añadimos rtk para enlazarlos
                console.log("*********** ATK cambiado porque RTK caducado")
                req.accessData = accessData
                session.atk = accessData.atk;
                session.atk_expireTime = accessData.expireTime

            // comprobamos si atk esta caducadado
            }else if(req.our_cookie.atk_decoded?.atk !==  session.atk ||  session.atk_expireTime < now){

                req.set_new_cookie = true
                accessData = generateAccessToken(session.name, session.email, temp_rtk);    // Añadimos rtk para enlazarlos
                console.log("*********** ATK EXPIRADO")
                console.log(accessData)
                req.accessData = accessData
                session.atk = accessData.atk;
                session.atk_expireTime = accessData.expireTime

                changeOnlyAtk = true;       // SOLO CAMBIAREMOS ATK EN LA NUEVA COOKIE
            
            }


        }else{
            console.log("NO hay SESION y estoy en VerifyTokenAndSetCookie !!! -> 2")
        }

        
        
       
    }
    
    if(req.set_new_cookie){
        console.log("ALGUN Token SIII  EXPIRADOS !!!")

        let cookie_atk_params, cookie_rtk_params, cookie_stk_params,  cookie_deviceId_params;
            
            if(process.env.MODE === 'DEV'){
                cookie_rtk_params = systemConfig.COOKIE.PARAMS_RTK_SIGNIN_DEV;
                cookie_atk_params = systemConfig.COOKIE.PARAMS_ATK_SIGNIN_DEV;
                cookie_stk_params = systemConfig.COOKIE.PARAMS_RTK_SIGNIN_DEV;
                cookie_deviceId_params = systemConfig.COOKIE.PARAMS_DEVIDE_ID_DEV;
            
            }else{
                // Secure, Http Only, ...
                cookie_rtk_params = systemConfig.COOKIE.PARAMS_RTK_SIGNIN_PROD;
                cookie_atk_params = systemConfig.COOKIE.PARAMS_ATK_SIGNIN_PROD;
                cookie_stk_params = systemConfig.COOKIE.PARAMS_ATK_SIGNIN_PROD;
                cookie_deviceId_params = systemConfig.COOKIE.PARAMS_DEVIDE_ID_PROD;
        
            }

        if(from === "ACCESS_REMOTE_PANNEL"){    // ACTUALIZAMOS UNICAMENTE cookie.stk -> Para acceso a Remote-pannel
            
            req.cookie = [`stk=${req.pannelAccessData.securityToken}; ${cookie_stk_params}`]
        
        }else if(changeOnlyAtk){    // ACTUALIZAMOS UNICAMENTE cookie.atk

            req.cookie = [`atk=${req.accessData.accessToken}; ${cookie_atk_params}`]

        }else{  // ACTUALIZAMOS atk y rtk -> por caducados

            req.cookie = [`atk=${req.accessData.accessToken}; ${cookie_atk_params}`, `rtk = ${req.refreshData.refreshToken}; ${cookie_rtk_params}`, `deviceId = ${req.body.deviceId}; ${cookie_deviceId_params}`]
        }
        
        // req.set_new_cookie = false;
        // console.log({sessionsCached})
        // console.log({usersByEmail})
        
        console.log('NUEVA COOKIE !!!!!')
        console.log(req.cookie)
        // console.log(req.cookie)
        

    }else{
        console.log("Tokens NO EXPIRADOS")
    }
}