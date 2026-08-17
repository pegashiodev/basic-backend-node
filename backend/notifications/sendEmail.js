

/**
 * MÓDULO DE ENVÍO DE CORREOS ELECTRÓNICOS VÍA AWS SES (SDK v3)
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import systemConfig from '../globalData/systemConfig.js';
process.loadEnvFile();

// Inicialización del cliente SES con variables de entorno
const sesClient = new SESClient({
    region: process.env.AWS_SMTP_REGION || 'eu-west-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || '',
        secretAccessKey: process.env.AWS_PRIVATE_KEY || ''
    }
});

/**
 * Plantillas básicas de correo según tipo e idioma
 */
function buildEmailTemplate({ type, code, language = 'es', customData = {} }) {

    const isEn = language === 'en';

    if (type === 'VERIFICATION_CODE') {
        const subject = isEn 
            ? `Your verification code: ${code}` 
            : `Tu código de verificación: ${code}`;

        const textBody = isEn
            ? `Hello,\n\nYour verification code is: ${code}\nThis code will expire in 15 minutes.\nIf you did not request this, please ignore this email.`
            : `Hola,\n\nTu código de verificación es: ${code}\nEste código caduca en 15 minutos.\nSi no has solicitado este código, puedes ignorar este correo.`;

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">${isEn ? 'Verification Code' : 'Código de Verificación'}</h2>
                <p style="color: #555; font-size: 16px;">
                    ${isEn ? 'Please use the following code to complete your registration or verification:' : 'Utiliza el siguiente código para completar tu registro o verificación:'}
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a73e8; background: #f1f3f4; padding: 10px 24px; border-radius: 6px; display: inline-block;">
                        ${code}
                    </span>
                </div>
                <p style="color: #777; font-size: 14px;">
                    ${isEn ? 'This code is valid for 15 minutes.' : 'Este código es válido durante 15 minutos.'}
                </p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    ${isEn ? 'If you did not request this code, you can safely ignore this email.' : 'Si no solicitaste este código, puedes ignorar este correo de forma segura.'}
                </p>
            </div>
        `;

        return { subject, textBody, htmlBody };
    }

    // Plantilla por defecto o personalizada
    return {
        subject: customData.subject || (isEn ? 'Notification' : 'Notificación'),
        textBody: customData.text || '',
        htmlBody: customData.html || `<p>${customData.text || ''}</p>`
    };
}

/**
 * Función principal para enviar emails
 * @param {Object} options
 * @param {string} options.email - Correo de destino
 * @param {string} [options.code] - Código de verificación (si aplica)
 * @param {string} [options.type] - Tipo de correo ('VERIFICATION_CODE', etc.)
 * @param {string} [options.language] - Idioma ('es' | 'en')
 * @param {Object} [options.customData] - Asunto y textos libres alternativos
 */
export default async function sendEmail({ email, code, type = 'VERIFICATION_CODE', language, customData }) {

    if (!email) {
        console.error('❌ Error sendEmail: No se proporcionó dirección de correo de destino.');
        return { status: 'error', message: 'Email de destino obligatorio' };
    }

    const lang = language || systemConfig.MAIN_LANGUAGE || 'es';
    const { subject, textBody, htmlBody } = buildEmailTemplate({ type, code, language: lang, customData });

console.log({ subject, textBody, htmlBody })

    const fromAddress = process.env.AWS_SES_FROM_EMAIL || systemConfig.SYSTEM_EMAIL || 'no-reply@tudominio.com';

    const params = {
        Source: fromAddress,
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Subject: {
                Data: subject,
                Charset: 'UTF-8'
            },
            Body: {
                Html: {
                    Data: htmlBody,
                    Charset: 'UTF-8'
                },
                Text: {
                    Data: textBody,
                    Charset: 'UTF-8'
                }
            }
        }
    };

    try {
        const command = new SendEmailCommand(params);
        const response = await sesClient.send(command);
        console.log(`✉️ Email enviado con éxito a ${email} (MessageId: ${response.MessageId})`);
        return { status: 'ok', messageId: response.MessageId };
    } catch (error) {
        console.error('❌ Error enviando email mediante AWS SES:', error.message);
        return { status: 'error', message: error.message };
    }
}