

/**
 * TEMPLATES PARA ENVIAR LOS EMAILS
 * 
 */



const signup_template = `<p>Hola ${data.name}:</p>
<p style="margin-bottom: 20px;">Te damos la bienvenida a Consulta Legal.<br> A continuacion te failitamos un codgo de verificación para completar la creación de la cuenta</p>
<div style="width: 320px;height: auto; border: 1px solid plum;border-radius: 12px;margin: 0 auto;text-align: center;background-color:aliceblue;">
    <p style="text-align: center;"><h2>ConsultaLegal.IO</h2></p>
    <h3 style="text-align: center;">Codigo de Verificacion</h3>
    <hr>
    <h1 style="font-weight: bold;">${data.token}</h1>
</div>
<div style="max-width: 70%;border: 1px solid plum; margin: 0 auto; min-height: 400px; border-radius: 12px;margin-top: 20px;">
    <p style="text-align: center;">Mas texto</p>
</div>`
