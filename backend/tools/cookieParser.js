
/**
 * 
 *  recibimos un string con las cookies y aqui las decodificamos y las convertimos en un objeto
 * 
 */



/**
 * @param {String} cookies -> String con las cookies que hemos recibido
 */
export default (cookies)=>{
    console.log('cookieParser!!!')
    //console.log(cookies)

    const list = {};

    // haya las que haya estan separadas por ';'
    cookies.split(`;`).forEach(function(cookie) {

        let item = cookie.trim();
        // console.log(item)

        let [ name, ...rest] = item.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);


    // // Si se colocaron como un objeto JSON
    //     if(item.startsWith('{"')){
    //         // Es un objeto JSON
    //         console.log('UNO')
    //         let item2 = JSON.parse(item)
    //         let keys = Object.keys(item2)
    //         keys.forEach((key)=>{
    //             list[key] = item2[key]
    //         })

    // // Si se colocaron como suma de valores -> key1=val1 + key2=val2 + ...
    //     }else if(item.indexOf('+')>0){
    //         console.log('DOS')


    //         let arr = item.split('+');
           
    //         arr.forEach((item)=>{
    //             let [ name, ...rest] = item.split(`=`);
    //             name = name?.trim();
    //             if (!name) return;
    //             const value = rest.join(`=`).trim();
    //             if (!value) return;
    //             list[name] = decodeURIComponent(value);
    //         })
    
    // // Si se coloco solo un valor en la cookie
    //     }else{
            
    //         console.log('TREWS')

    //         let [ name, ...rest] = item.split(`=`);
    //         name = name?.trim();
    //         if (!name) return;
    //         const value = rest.join(`=`).trim();
    //         if (!value) return;
    //         list[name] = decodeURIComponent(value);
    //     }
        

        
    });
    if(Object.keys(list).length === 0){
        return null;
    }
    return list;
}


