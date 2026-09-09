

/***
 * 
    GESTIONA LAS SUBSCRIPCIONES DE LOS USUARIOS
 
 */



/**
 * 1. Crea la SUBSCRIPCION DEL UAUARIO Y LA ALMACENA EN MONGODB
 */
export async function createSubscription(user, subscription) {

   const subscription = {
      "userId": "user_12345",
      "stripeCustomerId": "cus_H123...",      // Crucial para identificar al cliente en Stripe
      "stripeSubscriptionId": "sub_1M23...",  // ID de la suscripción activa en Stripe
      "status": "active",                     // active, past_due, canceled, incomplete (valores nativos de Stripe)
      "plan": "premium_monthly",             // Tu identificador interno o el ID del precio en Stripe (Price ID)
      "currentPeriodEnd": "2026-03-20T..."   // Fecha exacta en que termina el ciclo pagado
       
   }


}

