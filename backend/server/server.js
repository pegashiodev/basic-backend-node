import { createServer } from 'node:http';
import blackList from '../globalData/blackList.js'
import getRequestHandler from './serverHandlers/getRequestHandler.js';
import postRequestHandler from './serverHandlers/postRequestHandler.js';
import optionsRequestHandler from "./serverHandlers/optionsRequestHandler.js"
import systemConfig from '../globalData/systemConfig.js';
import proxy from "./serverHandlers/proxy.js"



export default createServer((req, res) => {

    //console.log("ip: " , req.socket.address());
    req.ip = req.socket.address().address;

        
    // ANALIZAMOS  LA PETICION Y LA IP PARA EVITAR ATAQUES

    if(systemConfig.HAS_OWN_PROXY_DDOS){
        proxy(req);
    }

    if(blackList[req.ip]){

        console.log(" IP BLOQUEADA")
        if(blackList[req.ip].status === "BLOCKED"){
            res.statusCode = 429;                           // TRAFICO IRREGULAR DEDE SU IP
            // enviamos pagina con codigo de error 429
            res.setHeader('Content-Type', 'text/plain');
            return res.end('TRAFICO IRREGULAR DESDE SU IP')
        
        }else if(blackList[req.ip].status === "PAUSED"){
            // cOMPROBAMOS expireTime
            if(blackList[req.ip].expireTime > Date.now()){
                res.statusCode = 429;                           // TRAFICO IRREGULAR DEDE SU IP
                // enviamos pagina con codigo de error 429
                res.setHeader('Content-Type', 'text/plain');
                return res.end('TRAFICO IRREGULAR DESDE SU IP ->PAUSED')
            }
        }
    }

  

    if(req.method === 'GET'){
        getRequestHandler(req,res);

    }else if(req.method === 'POST'){
        postRequestHandler(req,res);

    // }else if(req.method === 'HEAD'){
    //     router.handlerHeadRequest(req,res);

    // }else if(req.method === 'PUT'){
    //     router.handlerPutRequest(req,res);

    // }else if(req.method === 'DELETE'){
    //     router.handlerDeleteRequest(req,res);

    }else if(req.method === 'OPTIONS'){

        console.log("OPTIONS REQUEST RECIBIDA ****************** ")

        //optionsRequestHandler(req,res);

    }else{
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        return res.end('INVALID METHOD');
    }


    
});


