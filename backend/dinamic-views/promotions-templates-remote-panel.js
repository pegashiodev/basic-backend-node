
/**
 * 
 *  HAN DE MANTENERSE EXACTAMENTE LA ESTRUCTURA DE WRAPS, LAS CLASES Y LOS DATA-???
 * 
 * 
 */



export const promotion_template = {
    html:   `<div class="promo" id="{{promo_code}}">
                <div>{{promo_code}}</div>
                <div>SALDO-COINS: {{saldoCoins}}</div>
                <div class="edit-promo-wrap hidden" data-id="{{promo_code}}">
                    <p>Editar la Promo</p>
                    <button class="promo-btn save">GUARDAR</button>
                </div>
                <button class="promo-btn edit" data-type="PROMOTIONS">EDITAR</button>
                
                <div class="save-wrap hidden">
                    <input type="text"/>
                    <button class="promo-btn confirm">CONFIRMAR</button>
                </div>
            </div>`,
    script: ``,
    style: `.promo{margin-bottom: 2rem;}.hidden{display:none;}`,

    params: ["promo_code", "saldoCoins"],
    data_for_params: "PROMOTION"
} 

export const new_promotion_template = {

    html: ` <form class="new-promo-form">
                <div class="new-promo">
                    <label>Codigo Promo</label>
                    <input type="text" class="code" value="Codico de la Promo"></input>

                </div>
                <button class="promo-btn save">GUARDAR</button>
                
                <div class="save-wrap hidden">
                    <input type="text"/>
                    <button class="promo-btn confirm">CONFIRMAR</button>
                </div>
            </form>`,
    script: ``,
    style: `.promo{margin-bottom: 2rem;}.hidden{display:none;}`,
    params: [],
    data_for_params: "PROMOTION"
}
