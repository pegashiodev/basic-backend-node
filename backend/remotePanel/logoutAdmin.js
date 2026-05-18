

export default (data, res)=>{

    console.log("logOutHandler")


    const response_data = {
        status: "error",
        message: "Error en LogoutHandler"
    }
    res.writeHead(200, { 'Content-Type': 'application/js' });
    return res.end(JSON.stringify(response_data))
}