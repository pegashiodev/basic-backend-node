


import usersByEmail from "../globalData/usersByEmail.js"
import { user_template } from "../dinamic-views/user-templates-remote-panel.js"


export default (data, res)=>{

    console.log("usersDataHandler")
    const response = {}

    if(data.task === "searchUser"){

        // BUSCAMOS UN USER POR SU EMAIL

        console.log("Solicitan SEARCH USER")
        const email = data.usersByEmail

        // ENVIAMOS SOLO LOS DATOS QUE SE TIENEN QUE VER O
        // QUE SE PUEDEM MODIFICAR: 

        response.type = "SEARCH_USER"
        // response.data = usersByEmail[data.email];

        // HAY QUE DEVOLVER UN ARRAY AUNQUE SEA UN SOLO ELEMENTO
        response.data = [];
        
        response.data.push(usersByEmail["pegashio@gmail.com"]);
        console.log(response.data)
        response.html = user_template.html;
        response.style = user_template.style;
        response.script = user_template.script;
        response.params = user_template.params;
        response.status = "ok"

        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))

    }else if(data.task === "updateUserData"){
        console.log("UPDATE USER DATA")
        console.log(data)
        
        const response = {
            status: "ok",
            message: "User Data Updated"
        }
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))


    
    }else if(data.task === "searchQuestions"){

        console.log("Search UserQuestions ...")
        
        const response = {
            status: "pendiente",
            message: "Falta Implementar ESTO!!"
        }
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))


    

    }else{

        const response = {
            status: "error",
            message: "Error en ProductsAdmin -> NO valid Task"
        }
        res.writeHead(200, { 'Content-Type': 'application/js' });
        return res.end(JSON.stringify(response))
    }

}