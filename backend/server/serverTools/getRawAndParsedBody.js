// Ejemplo de lectura en Node.js puro
export function getRawAndParsedBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            // Buffer en crudo imprescindible para Stripe
            const rawBody = Buffer.concat(chunks);
            req.rawBody = rawBody;

            // Si es un endpoint normal JSON, lo parseamos a objeto
            const contentType = req.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
                try {
                    req.body = rawBody.length > 0 ? JSON.parse(rawBody.toString('utf8')) : {};
                } catch (e) {
                    req.body = {};
                }
            }
            resolve();
        });

        req.on('error', (err) => reject(err));
    });
}