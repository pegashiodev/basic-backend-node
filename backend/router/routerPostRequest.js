
/**
 * 
 *  Routeamos la peticion POST
 * 
 * 
 *  - SI ES UN SUBDOMINIIO LO REDIRIGIMOS
 * 
 *  - SI ES MASTER LO REDIRIGIMOS 
 * 
 *  - EL RESTO -> Routeamos al manejador que corresponda
 * 
 * 
 */


import signUpHandler from "./routerHandlers/signUpHandler.js";
import logInHandler from "./routerHandlers/logInHandler.js";
import logOutHandler from "./routerHandlers/logOutHandler.js";
import renovePasswordHandler from "./routerHandlers/renovePasswordHandler.js";
import systemConfig from "../globalData/systemConfig.js";
import checkOutHandler from "./routerHandlers/checkOutHandler.js";
import mastersEndpoints from "../globalData/mastersEndpoints.js";
import forgotPasswordHandler from "./routerHandlers/forgotPasswordHandler.js";
import expiredEndpointHandler from "./routerHandlers/expiredEndpointHandler.js";
import remoteControlAccessHandler from "../restrictedEndpoints/remoteControlAccessHandler.js";
import remoteControlPanelHandler from "../restrictedEndpoints/remoteControlPanelHandler.js";
import uploadFilesHandler from "./routerHandlers/uploadFilesHandler.js";
import getMainMenu from "../api/getMainMenu.js";
import getHtmlItems from "../api/getHtmlItems.js";
import verifyFromRemotePanel from "../remotePanel/verifyFromRemotePanel.js";
process.loadEnvFile();


export default function (req, res){

    console.log("** routerPostRequest !!")
    console.log(req.urlData)
    console.log({endpoint: req.urlData.endpoint})

    const REMOTE_CONTROL_PANEL_ENDPOINT = systemConfig.REMOTE_CONTROL_PANEL_ENDPOINT
    const REMOTE_CONTROL_ACCESS_POST = systemConfig.REMOTE_CONTROL_ACCESS_ENDPOINT_POST
    const REMOTE_CONTROL_HANDLER_POST = systemConfig.REMOTE_CONTROL_HANDLER_ENDPOINT_POST


    
    const postHandlers = {

        "signup":               {handler: signUpHandler, access: systemConfig.HAS_USERS}, // NO ACCESS IF SYSTEM HAS NO USERS
        "signup.html":          {handler: signUpHandler, access: systemConfig.HAS_USERS},
        "login":                {handler: logInHandler, access: systemConfig.HAS_USERS},
        "login.html":           {handler: logInHandler, access: systemConfig.HAS_USERS},
        "logout":               {handler: logOutHandler, access: systemConfig.HAS_USERS},
        "logout.html":          {handler: logOutHandler, access: systemConfig.HAS_USERS},
        "forgot-password":      {handler: forgotPasswordHandler, access: systemConfig.HAS_USERS},
        "forgot-password.html": {handler: forgotPasswordHandler, access: systemConfig.HAS_USERS},
        "expired-endpoint":     {handler: expiredEndpointHandler, access: systemConfig.HAS_USERS},
        "expired-endpoint.html":{handler: expiredEndpointHandler, access: systemConfig.HAS_USERS},

        "upload-files.html":    {handler: uploadFilesHandler, access: systemConfig.HAS_USERS},
        "upload-files":         {handler: uploadFilesHandler, access: systemConfig.HAS_USERS},

        "renove-password":      {handler: renovePasswordHandler, access: systemConfig.HAS_USERS},
        "renove-password.html": {handler: renovePasswordHandler, access: systemConfig.HAS_USERS},
        
        // "recovery-account":     {handler: recoveryAccountHandler, access: systemConfig.HAS_USERS},
        // "recovery-account.html":{handler: recoveryAccountHandler, access: systemConfig.HAS_USERS},


        "checkout":             {handler: checkOutHandler, access: systemConfig.HAS_USERS},
        "checkout.html":        {handler: checkOutHandler, access: systemConfig.HAS_USERS},
        "finalizar-pedido":     {handler: checkOutHandler, access: systemConfig.HAS_USERS},
        "finalizar-pedido":     {handler: checkOutHandler, access: systemConfig.HAS_USERS},
        

        "get-html-items":       {handler: getHtmlItems, access: true},
        "get-main-menu":        {handler: getMainMenu, access: true} ,                       // Acceso Siempre. Luego se comprueba la cookie
        // "get-user-info":        {handler: "sendUserInfo", access: systemConfig.HAS_USERS},      // our_cookie required

        "verify-from-remote-panel": {handler: verifyFromRemotePanel, access: systemConfig.HAS_USERS},

    }
    // postHandlers[REMOTE_CONTROL_PANNEL_ENDPOINT] = {handler: remoteControlPannelHandler, access: systemConfig.HAS_USERS}
    // Controlador para mostrar el pannel
    postHandlers[REMOTE_CONTROL_ACCESS_POST] = {handler: remoteControlAccessHandler, access: systemConfig.HAS_USERS}
    // Controlador de las acciones dentro del Remote Pannel
    postHandlers[REMOTE_CONTROL_HANDLER_POST] = {handler: remoteControlPanelHandler, access: systemConfig.HAS_USERS}





    if(postHandlers[req.urlData.endpoint] && postHandlers[req.urlData.endpoint].access){

        return postHandlers[req.urlData.endpoint].handler(req,res);
    
    }
    if(mastersEndpoints[req.urlData.url_to_verify]){
        return routerPostMasterEndpoints(req, res)
    }


    console.log('No ha manejador para este endpoint !!!')
        
    const response_data = {
        code: 460,
        message: "IMVALID ENDPOINT"
    }
    res.writeHead(460, { 'Content-Type': 'text/plain' });
    res.end(JSON.stringify(response_data));
    return;

}
