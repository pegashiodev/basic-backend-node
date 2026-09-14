

export default [
      {
        _id: 'pcm_recharge_12890',
        productId: 'pcm_recharge_12890',
        paymentMode: "ONCE",
        type: "BALANCE_RECHARGE",
        brand: 'podcastmatic',
        currency: 'eur',
        plan_name: 'OCASIONAL',
        title: 'Recarga de 500 Coins',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        priceInCents: 500,
        coins:{
            create: 300,
            generator: 100,
            training: 100,
            coaching: 100,
            audio: 0,
            images: 0,
            video: 0
        },
        stock: 'INFINITE',
        active: true,
      }, 
      {
        _id: 'pcm_recharge_13890',
        paymentMode: "ONCE",
        productId: 'pcm_recharge_13890',
        type: "BALANCE_RECHARGE",
        brand: 'podcastmatic',
        currency: 'eur',
        plan_name: '',
        title: 'Recarga de 1500 Coins',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        priceInCents: 1000,
        coins:{
            create: 300,
            generator: 100,
            training: 100,
            coaching: 100,
            audio: 0,
            images: 0,
            video: 0
        },
        stock: 'INFINITE',
        active: true
        
      },
      // Ejemplo 1: Recarga de Saldo
      {
        _id: 'pcm_recharge_14890',
        paymentMode: "ONCE",
        productId: 'pcm_recharge_14890',
        type: "BALANCE_RECHARGE",
        brand: 'podcastmatic',
        currency: 'eur',
        plan_name: 'PRO',
        title: 'Recarga de 4000 Coins',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        priceInCents: 2000,
        coins:{
            create: 300,
            generator: 100,
            training: 100,
            coaching: 100,
            audio: 0,
            images: 0,
            video: 0
        },
        stock: 'INFINITE',
        active: true
      },
      // Ejemplo 2: Audiolibro / Podcast para consumir en streaming
      // INCLUYE EL id del contenido que se quiere descargar o consumir en la plataforma
      {
        _id: 'pcm_audio_20790',
        paymentMode: "ONCE",
        productId: 'pcm_audio_20790',
        type: "AUDIO_STREAMING",
        format: "STREAMING",   
        brand: 'podcastmatic',
        currency: 'eur',
        title: 'Contenido en Audio para Streaming',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        priceInCents: 2000,
        audioContentId: "st_2389rrass7",     
        stock: 'INFINITE',
        active: true
      },
      // Ejemplo 3: Audiolibro / Podcast para consumir descargandolo
      // INCLUYE EL id del contenido que se quiere descargar o consumir en la plataforma
      {
        _id: 'pcm_audio_20690',
        paymentMode: "ONCE",
        productId: 'pcm_audio_20690',
        type: "AUDIO_DOWNLOAD",
        format: "DOWNLOAD",   
        brand: 'podcastmatic',
        currency: 'eur',
        title: 'Contenido en Audio para Descargar',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        priceInCents: 2000,
        audioContentId: "dl_2389apass7",    
        stock: 'INFINITE',
        active: true
      },
      // Ejemplo 3: Texto digital (PDF) para descargar o enviar por email
      // COMO UN PDF PARA PODER DESCARGARLO O ENVIARLO POR EMAIL
      // INCLUYE EL id del contenido que se quiere descargar o consumir en la plataforma
      {
        _id: 'pcm_text_20890',
        paymentMode: "ONCE",
        productId: 'pcm_text_20890',
        type: "AUDIO_CONTENT",
        format: "DOWNLOAD",   
        brand: 'podcastmatic',
        currency: 'eur',
        title: 'LIBRO EN PDF  PARA ENVIAR POR EMAIL O DESCARGAR',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        priceInCents: 2000,
        textContentId: "dl_238989ass7",     
        stock: 'INFINITE',
        active: true
      }
,

      // Ejemplo 3: Libro Físico para envio ordinario
      {
        _id: 'pcm_fhysic_30021',
        paymentMode: "ONCE",
        productId: 'pcm_physic_30021',
        type: "PHYSICAL",
        brand: 'podcastmatic',
        currency: 'eur',
        title: 'TITULO DEL LIBRO FISICO A ENVIAR',
        description: 'Descripcion detallada del producto o servicio',
        galery: [],
        poster: '',
        priceInCents: 2900,
        stock: 'INFINITE',
        active: true
      }

]


