

export default [
    {
        _id: {
          _id: 'pcm_12890',
          type: "BALANCE_RECHARGE",
          brand: "podcastmatic"   
        },
        type: "BALANCE_RECHARGE",
        productId: 'pcm_12890',
        brand: 'podcastmatic',
        currency: 'eur',
        plan_name: 'OCASIONAL',
        title: 'Recarga de 500 Coins',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        unit_amount: 500,
        priceInCents: 500,
        coins:{
            generator: 100,
            trainning: 100,
            coaching: 100,
            audio: 0,
            images: 0,
            video: 0
        },
        stock: 'INFINITE',
        active: true,
      }, 
      {
        _id: {
          _id: 'pcm_13890',
          type: "BALANCE_RECHARGE",
          brand: "podcastmatic"   
        },
        productId: 'pcm_13890',
        type: "BALANCE_RECHARGE",
        brand: 'podcastmatic',
        currency: 'eur',
        plan_name: '',
        title: 'Recarga de 1500 Coins',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        unit_amount: 1000,
        priceInCents: 1000,
        coins:{
            generator: 100,
            trainning: 100,
            coaching: 100,
            audio: 0,
            images: 0,
            video: 0
        },
        stock: 'INFINITE',
        active: true
        
      },
      {
        _id: {
          _id: 'pcm_14890',
          type: "BALANCE_RECHARGE",
          brand: "podcastmatic"   
        },
        productId: 'pcm_14890',
        type: "BALANCE_RECHARGE",
        brand: 'podcastmatic',
        currency: 'eur',
        plan_name: 'PRO',
        title: 'Recarga de 4000 Coins',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        unit_amount: 2000,
        priceInCents: 2000,
        coins:{
            generator: 100,
            trainning: 100,
            coaching: 100,
            audio: 0,
            images: 0,
            video: 0
        },
        stock: 'INFINITE',
        active: true
      },
      // Ejemplo 1: Audiolibro
{
  "productId": "prod_audio_01",
  "name": "Audiolibro: El Arte de la Guerra",
  "type": "AUDIO_CONTENT",    // [PHYSICAL, AUDIO_CONTENT]
  "priceInCents": 1500,
  "active": true
},

// Ejemplo 2: Recarga de Saldo
{
  "productId": "prod_balance_50",
  "name": "Recarga de 50€ de Saldo",
  "type": "BALANCE_RECHARGE",
  "creditAmount": 50,
  "priceInCents": 5000,
  "active": true
},

// Ejemplo 3: Libro Físico
{
  "productId": "prod_book_print",
  "name": "Libro Tapa Dura",
  "type": "PHYSICAL",
  "priceInCents": 2900,
  "active": true
}

]


