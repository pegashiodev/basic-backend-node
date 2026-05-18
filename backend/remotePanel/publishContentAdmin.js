


export default (data, res)=>{

    console.log("publishContentHandler")



    /***
     * 
     *      Consultar metadata de la DB_site_web
     * 
     *      PREPARAR LOS CONTENIDOS DEL MODAL
     * 
     *      Devolver el json con los datos, el html, el css y js
     * 
     * 
    */

    // const response_data = {
    //     status: "error",
    //     message: "Error en PublishContentHandler"
    // }
    


    const response_data = {
        status: "ok",
        data:{
            metadata: {

            },
            html: ``,
            js: ``,
            css: ``,


        }
    }
    res.writeHead(200, { 'Content-Type': 'application/js' });
    return res.end(JSON.stringify(response_data))
}