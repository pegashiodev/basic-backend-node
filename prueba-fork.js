

import {fork} from "node:child_process"
import { resolve } from "node:path"




async function addUser (body, cb){

    const dbFork = fork("./dbFork.js")

    dbFork.on("message", (result)=>{

        if(result.status === "ok"){
        console.log("Dentro del Fork")
           cb(result)

        }else{
            console.log("ERROR en ADDUSER")
        }
    })


    dbFork.send(body)

   
    

    // const addSession = function (user){

    //     console.log("En ADD SESSION !!!")

    //     const dbFork = fork("./dbFork.js")

    //     dbFork.on("message", (result)=>{

    //         if(result.status === "ok"){
    //             console.log("segundo Fork !!!")
                

    //         }else{
    //             console.log("ERROR en ADDUSER")
    //         }
    //     })

    // }
   

}

function cb(data){
    console.log(data)
    console.log("Este seria el Add Session")
}

addUser({name: "Jose", status: "ok"}, cb)

