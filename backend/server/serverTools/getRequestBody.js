
/**
 * EXTRAE EL CUERPO (BODY) DE LA PETICIÓN POST DE FORMA SEGURA Y EFICIENTE
 */

const LIMITS_BYTES = {
    'JSON': 128 * 1024,       // 128 KB
    'DOC': 2 * 1024 * 1024,   // 2 MB
    'IMAGE': 5 * 1024 * 1024, // 5 MB
    'AUDIO': 10 * 1024 * 1024,// 10 MB
    'FILE': 10 * 1024 * 1024  // 10 MB
};

export default function getRequestBody(req, type = 'JSON') {
    return new Promise((resolve, reject) => {
        const maxLimit = LIMITS_BYTES[type] || LIMITS_BYTES.JSON;
        const chunks = [];
        let totalSize = 0;
        let isAborted = false;

        req.on('data', (chunk) => {
            if (isAborted) return;

            totalSize += chunk.length;

            if (totalSize > maxLimit) {
                isAborted = true;
                // Destruimos el stream para evitar consumo de CPU y memoria
                req.destroy(new Error('PAYLOAD_TOO_LARGE'));
                return reject({
                    status: 'error',
                    code: 413,
                    message: `El cuerpo enviado supera el límite permitido (${Math.round(maxLimit / 1024)} KB)`
                });
            }

            chunks.push(chunk);
        });

        req.on('end', () => {
            if (isAborted) return;

            const buffer = Buffer.concat(chunks);

            if (type === 'JSON') {
                if (buffer.length === 0) {
                    return resolve({ status: 'ok', data: {} });
                }

                try {
                    const parsedJson = JSON.parse(buffer.toString('utf-8'));
                    resolve({ status: 'ok', data: parsedJson });
                } catch (e) {
                    reject({
                        status: 'error',
                        code: 400,
                        message: 'JSON con formato inválido o mal formado'
                    });
                }
            } else {
                // Para binarios (IMAGE, AUDIO, FILE) devolvemos el Buffer puro y su metadata
                resolve({
                    status: 'ok',
                    data: {
                        buffer: buffer,
                        size: totalSize,
                        mimeType: req.headers['content-type']
                    }
                });
            }
        });

        req.on('error', (err) => {
            if (!isAborted) {
                reject({
                    status: 'error',
                    code: 500,
                    message: err.message || 'Error en el flujo de recepción de datos'
                });
            }
        });
    });
}