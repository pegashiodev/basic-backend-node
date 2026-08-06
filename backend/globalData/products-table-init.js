

/**
 * 
 *  catalogo de productos a la venta en el sitio web
 * 
 *  "strategy": ["addSaldoCoins", "addSaldoTrainning", "eProduct", "eService", "tangible" ...] -> indica que tipo de  producto o servicio ha contratado
 *      
 *  DEPENDIENDO DE "strategy" se actuara de una manera u otra al tramitar el pedido
 *              
 * 
 * 
 */

export default [

    {
        _id: "cl_12890",
        ref: "cl_12890",
        brand: "consulta-legal",
        currency: "eur",
        plan_name: "OCASIONAL",
        title: "Recarga de 500 Coins",
        description: "Descripcion detallada del producto o servicio",
        galery: [],
        poster: "",
        unit_cost: 500,
        strategy: "addSaldoCoins",
        saldoCoins: 500,
        stock: "infinite",
        promo: false,
        promo_expire: 0 
    },
    {
        _id: "cl_13890",
        ref: "cl_13890",
        brand: "consulta-legal",
        currency: "eur",
        plan_name: "",
        title: "Recarga de 1500 Coins",
        description: "Descripcion detallada del producto o servicio",
        galery: [],
        poster: "",
        unit_cost: 1000,
        strategy: "addSaldoCoins",
        saldoCoins: 1500,
        stock: "infinite",
        promo: false,
        promo_expire: 0 
    },
    {
        _id: "cl_14890",
        ref: "cl_14890",
        brand: "consulta-legal",
        currency: "eur",
        plan_name: "PRO",
        title: "Recarga de 4000 Coins",
        description: "Descripcion detallada del producto o servicio",
        galery: [],
        poster: "",
        unit_cost: 2000,
        strategy: "addSaldoCoins",
        saldoCoins: 4000,
        stock: "infinite",
        promo: false,
        promo_expire: 0 
    },
]