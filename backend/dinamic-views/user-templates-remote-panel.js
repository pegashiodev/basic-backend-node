
/**
 * TEMPLATES PARA MOSTRAR LAS PROMOCIONES EN EL FRONTEND
 * - TIENE SU PLANTILLA  HTML
 * - LOS ESTILOS CSS
 * - EL JAVASCRIPT SI ES NECESARIO
 * - LOS PARAMETROS A CAMBIAR CON LOS DATOS DE LA BASE DE DATOS
 * - Y UN "data_for_params", que ahora no recuerdo para que lo usaba.
 * 
 */




/**
 * TEMPLATE PARA UN USER
 */


export const user_template = {
    html:   `<div class="user-template" id="userData">
                <p>EMAIL</p>
                <p>{{email}}</p>
                <p>NAME</p>
                <p>{{name}}</p>
                <p>STATUS</p>
                <p>{{status}}</p>
                <p>SALDO</p>
                <p>{{saldoCoins}}</p>
               
                <div class="edit-user-wrap hidden" data-id="userData">
                    <p>Editar la Promo</p>
                    <button class="promo-btn save">GUARDAR</button>
                </div>
                <button class="promo-btn edit">EDITAR</button>
                
                <div class="save-wrap hidden">
                    <input type="text"/>
                    <button class="promo-btn confirm">CONFIRMAR</button>
                </div>
            </div>`,
    script: ``,
    style: `.promo{margin-bottom: 2rem;}.hidden{display:none;}`,

    params: [ "email", "saldoCoins", "name", "status"],
    data_for_params: "PROMOTION"
}