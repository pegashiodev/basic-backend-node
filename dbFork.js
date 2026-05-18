

process.on("message", (message) =>{

    dbFork(message)

})


const dbFork = async  (body)=>{

    // const result = await insertOne(data)

    if (body.status === "ok"){

        process.send({status: "ok"})
    }else{
        process.send({status: "error"})

    }


}