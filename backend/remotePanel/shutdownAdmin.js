

export default (data, res)=>{

    console.log("shutdownHandler")

    const response_data = {
        status: "error",
        message: "Error en ShutDownHandler"
    }
    res.writeHead(200, { 'Content-Type': 'application/js' });
    return res.end(JSON.stringify(response_data))
}