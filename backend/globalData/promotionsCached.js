

export default [

    // EJEMPLOS

    // PROMOCION EN EL CHECKOUT: DESCUENTO EN LINEA
    {
        _id: 'MIDU',
        promotionId: "MIDU", 
        status: 'ACTIVE',               
        endpoint: "CHECKOUT",
        promoCode: 'MIDU',
        expiresAt: new Date('2027-12-31T23:59:59').getTime(),
        affiliate: {
            name: 'mididev',
            email: 'midudev@gmail.com',
            userId: '12312nmnmkj123jk'
        },
        type: "DISCOUNT",        
        discountPercent: 25,
        units: 120,
        
    },

    // PROMOCION EN EL SIGNUP: COINS DE BIENVENIDA
    {
        _id: 'BIENVENIDA',
        promotionId: "BIENVENIDA",
        status: 'ACTIVE',
        endpoint: "SIGNUP",
        promoCode: 'BIENVENIDA',
        expiresAt: new Date('2027-12-31T23:59:59').getTime(),
        affiliate: {
          name: 'system',
          email: 'system@gmail.com',
          userId: '12312nmnmkj123jk'
        },
        type: "COINS",        
        coins:{
            create: 500,
            generator: 500,
            trainnig: 200,
            coaching: 200,
            audio: 50,
            images: 50,
            video: 10
        },
        units: 120,
       
      },

    
]