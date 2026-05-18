



export const product_template = {
    html:   `<div class="product" id="{{ref}}">
                <p>Referencia: {{ref}}</p>
                <p>Plan-Name: {{plan_name}}</p>

                <p>Titulo: {{title}}</p>
                <p>Description: {{description}}</p>
                <p>SaldoCoins: {{saldoCoins}}</p>
                <p>Precio: {{unit_amount}} Centimos</p>

                <div class="edit-product-wrap hidden" data-id="{{ref}}">
                    <p>Editar El Producto</p>
                    <button class="product-btn save">GUARDAR</button>
                </div>
                <button class="product-btn edit">EDITAR</button>
                
                <div class="save-wrap hidden">
                    <input type="text"/>
                    <button class="promo-btn confirm">CONFIRMAR</button>
                </div>
            </div>`,
    script: ``,
    style: `.promo{margin-bottom: 2rem;}.hidden{display:none;}`,

    params: ["ref", "title", "plan_name","description", "saldoCoins", "unit_amount"],
    data_for_params: "PROMOTION"
} 

export const new_product_template = {

    html: ` <form class="new-product-form">
                <div class="new-product">
                    <p>Referencia</p>
                    <input type="text" value=""></input>
                    <p>Titulo:</p>
                    <input type="text" value=""></input>
                    <p>Description:</p>
                    <input type="text" value=""></input>
                    <p>SaldoCoins</p>
                    <input type="text" value=""></input>
                    <p>Precio</p>
                    <input type="text" value=""></input>

                </div>
                <button class="product-btn save">GUARDAR</button>
                
                <div class="save-wrap hidden">
                    <input type="text"/>
                    <button class="promo-btn confimr">CONFIRMAR</button>
                </div>
            </form>`,
    script: ``,
    style: `.promo{margin-bottom: 2rem;}.hidden{display:none;}`,
    params: [],
    data_for_params: "PROMOTION"
}
