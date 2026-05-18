
const limits = {
    'JSON': 128000,
    'DOC': 524000,
    'IMAGE': 512000,
    'AUDIO': 1024000
}

export default async (req, type)=>{
    
    console.log(`getRequestBody -> Recibimos ${type} Data!!`)
    let result = null;
    let data = '';

    return new Promise((resolve, reject)=>{

        req.on('data', (chunk)=>{

            data+= chunk;
            if(data.length > limits[type]){     
                reject ({status: 'error', from: 'getJsonData', code: 404, message: 'El file enviado supera los limites de tamaño establecidos'})
            }
        })

        req.on('end',()=>{
            try{
                data = JSON.parse(data.toString());
                resolve({status:'ok', data:data})
                
            }catch(e){
                reject({status: 'error', code: 404, message:'ERROR Parseando el Json Recibido en Request'});
            }
            
        });

        req.on('error', ()=>{
            console.log('ERROR')
            reject({status: 'error', code:404, message: data.length})
        })

    })

}