import { createReadStream, existsSync, access, constants  }  from  'node:fs'



export const sendMediaFile = (data, res)=>{

    console.log("Sending Media File")
    
    const {pathname: filePath} = new URL('../../frontend/' + data.folder + data.fileName, import.meta.url);

    let readStream = createReadStream(filePath);
    // let stats = fs.statfsSync(filePath);
    // console.log(stats)
    res.writeHead(200, {'Content-Type': 'text/html'});
    readStream.on('data', data => res.write(data));
    readStream.on('close', () => res.end());

}