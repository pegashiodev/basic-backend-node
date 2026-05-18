
import systemConfig from "../globalData/systemConfig.js";

export default function(req){
    
    let cookie_atk_params, cookie_rtk_params, cookie_deviceId_params;

    if(process.env.MODE === 'DEV'){
        cookie_rtk_params = systemConfig.COOKIE.PARAMS_RTK_SIGNIN_DEV;
        cookie_atk_params = systemConfig.COOKIE.PARAMS_ATK_SIGNIN_DEV;
        cookie_deviceId_params = systemConfig.COOKIE.PARAMS_DEVIDE_ID_DEV;
    
    }else{
        // Secure, Http Only, ...
        cookie_rtk_params = systemConfig.COOKIE.PARAMS_RTK_SIGNIN_PROD;
        cookie_atk_params = systemConfig.COOKIE.PARAMS_ATK_SIGNIN_PROD;
        cookie_deviceId_params = systemConfig.COOKIE.PARAMS_DEVIDE_ID_PROD;

    }
    req.cookie = [`atk=${req.accessData.accessToken}; ${cookie_atk_params}`, `rtk=${req.refreshData.refreshToken}; ${cookie_rtk_params}`, `deviceId = ${req.body.deviceId}; ${cookie_deviceId_params};`]
    req.set_new_cookie = true
    console.log('NUEVA COOKIE !!!!!')
    console.log(req.cookie)

}