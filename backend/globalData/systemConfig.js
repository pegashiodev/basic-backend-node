
const DOMAIN_PROD = "tudominio.com"
const DOMAIN_DEV = "localhost"
const ACCESS_TOKEN_MAX_AGE_SECONDS= 60*1;           //  VALOR EN SEGUNDOS  // (10 minuto para dev)         60*60*12*7;     // 7 DIASS,
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 5;      // HABRA QUE DARLE UN VALOR DE 7 DIAS ??
const SESSION_AGE_SECONDS = 60 * 10;                // 10 MINUTOS PARA PRUEBAS

export default  {

    VERSION: '1.0',
    PLATFORM_NAME: "TUDOMINIO.COM",
    HOST_DEV: "localhost:3000",
    HOST_PROD: "",
    // mode: 'DEV', // 'PROD',
    // HOST_DEV: 'localhost:3000',
    // HOST_PROD: 'automatizabots.com',

    BASE_URL_PROD: "",
    BASE_URL_DEV: "/home/carlos/dev/basic-project/backend/",
    BASE_URL_USER_FILES_FOLDER_DEV: "/home/carlos/dev/basic-project-old/user-files/",
    BASE_URL_USER_FILES_FOLDER_PROD: "",
    BASE_URL_FRONTEND_FILES_DEV: "/home/carlos/dev/basic-project-old/frontend/",
    BASE_URL_FRONTEND_FILES_PROD: "",
    
    /* LENGUAJES ADMITIDOS EN LA PLATAFORMA */
    HAS_MULTI_LANGUAJES: true, 
    MAIN_LANGUAGE: "es",
    LANGUAGES_AVAILABLE: ["es", "en"],

    /**  
    *   CONFIGURACION DEL SITIO: TIENE USUARIOS?, PERMITE SUBDOMINIOS, TRABAJAMOS CON MULTIPLES CPUS, Y DISTINTOS TIPOS DE ENDPOINTS 
    */
    HAS_USERS: true,        
    HAS_SUBDOMAINS: true, 
    HAS_RESTRICTED_ENDPOINTS: true,
    // HAS_VERIFICATION_ENDPOINTS: true,
    // HAS_DINAMIC_ENDPOINTS: true,
    // HAS_PAY_ENDPOINTS: true,
    // HAS_MASTERS_ENDPOINTS: true,

    /**  PARA HABILITAR EL DOBLE FACTOR DE AUTENTICACION */
    HAS_FA2: true,
    /** HABILITAR DOBRE AUTENTICACION EN EL SIGNUP */
    HAS_FA2_SIGNUP: true,
    /** HABILITAR DOBRE AUTENTICACION EN EL LOGIN */
    
    /** HABILITA LOS CODIGOS PROMOCIONALES EN EL SITIO */
    HAS_PROMO_CODES_SIGNUP: true,   
    HAS_PROMO_CODES_CHECKOUT: true,      

    
    /** HABILITAR PROXY INTERNO PARA ATAQUES DDOS */
    HAS_OWN_PROXY_DDOS: true,

    /** SUBDOMINIOS PERMITIDOS PARA RECIBIR PETICIONES */
    SUBDOMAINS_ALLOWED: ['hooks', 'api', "master", "api.docs"],

    // GET_SIGNUP_COUNTRY: false,              // se hace peticion en el signin para obtener el country del user

    /** HABILITA EL CACHEO INICIAL DE ARCHIVOS ESTATICOS Y DATOS DE LAS DBS ANTES DE LANZAR EL SERVIDOR */
    CATCH_STATIC_FILES: true,
    CATCH_DB_DATA: true,

    
    HOME_STATIC_FILE: 'index.html',           // Archivo index de la pagina
    HOME_DINAMIC_FILE: 'index-dinamic.html',

    /** EXTENSION DE LOS ARCHIVOS A RENDERIZAR EN EL DOM */
    EXTENSION_STATIC_VIEWS: 'html',            

    /** EXTENSION DE LOS ARCHIVOS DE LOS QUE HAY QUE GUARDAR ESTADISTICAS */
    ENDPOINTS_TYPE_TO_SAVE_STATS: ['html', 'mp3', 'wav', 'ogg', 'pdf'],

    /** 
    * NOMBRES DE LAS CARPETAS DONDE ESTAN LOS CONTENIDOS DEL SITIO 
    */
    FOLDERS: {

        TEMPLATE_FILES: 'templates',                // html files
        DINAMIC_FILES: 'dinamic',                   // HTML FILES
        STATICS_FILES :'statics',                   // CSS, JS, FONTS, ...
        IMAGES_FILES: 'images',                     // IMAGES, 
        RESTRICTED_FILES: 'restricted-urls',        // HTML FILES
        USERS_FILES: 'users-files',                 // FILES USERS: DOCS, IMAGES, AUDIOS, 
        MEDIA_FILES: 'media',                       // PLATFORM MEDIA FILES: AUDIOS, VIDEOS, 

    },
    /** DISTINTOS ESTADOS DE ENTIDADES EN LA PLATAFORMA */
    STATUS: {
        ENDED: 'ENDED',
        BLOCKED: 'BLOCKED',
        PAUSED: "PAUSED",
        HACKED: 'HACKED',
        ACTIVE: 'ACTIVE',
        ERROR_FETCH: 'ERROR',
        SUCCESS: 'ok',
        SUCCESS_FETCH: 'ok',
    },
    
    /** 
    *   DISTINTAS PAGINAS QUE SE ENVIAN AL FRONTEND 
    */

    PAGES: {
        ACCESS_PLATFORM: '/acceso-plataforma.html',     // con la / porque para redirecciones 302 absolutas
        // ACCOUNT_RECOVERY_INFO: '/account-recovery-info.html',
        BLOCKED_ACCOUNT_INFO: "/blocked-account-info.html",
        CONNECTION_ERROR_PAYMENT_PROVIDER: "/connection-error-payment-provider.html",
        DELETE_COOKIES_AND_LOGIN: "delete-cookies-and-login.html",
        EMAIL_VERIFICATION_INFO: "/email-verification-info.html",
        EMAIL_VERIFIED: "/email-verified.html",
       
        HOME: '/index.html',
        INVALID_SUBDOMAIN_REQUEST: "invalid-subdomain-request.html",
        MAIN_CAT_ENPOINT: "/bots.html",
        MAIN_BLOG_ENDPOINT: "/blog.html",
        PAGE_NOT_FOUND: '/404',
        REQUEST_INVALID: '/500',
        RENOVE_PASSWORD: "/renove-password.html", 
        RENOVE_PASSWORD_EXPIRES: "/renove-password-expired.html",
        RECOVERY_ACCOUNT: "/recovery-account.html", 
        RECOVERY_ACCOUNT_INFO: "/recovery-account-info.html",
        SEND_EMAIL_VERIFICATION_AGAIN: '/send-email-verification.html',
        SEND_EMAIL_VERIFICATION_AGAIN: '/send-email-again.html',
        SEND_EMAIL_ERROR: '/send-email-error.html',
        SEND_RECOVERY_ACCOUNT_ERROR: "/send-recovery-account-error.html",
        SESSION_IS_REQUIRED: "/session-is-required.html",
        SESSION_ENDED: '/session-ended.html',
        SYSTEM_ERROR_OCURRED: "/505.html",
        URL_AFTER_LOGIN : "/mis-bots.html",
        URL_AFTER_SIGNUP: '/bots.html',
        USER_EMAIL_VERIFIED: '/user-email-verified.html',
        USER_NOT_ACTIVE: '/user-not-active.html',
        GET_REFRESS_TOKEN: "/refresh-bridge.html",
    },

    /**   
    *   TIEMPOS DE EXPIRACION DE LOS DISTINTOS TOKENS
    */
    TOKENS_AGE:{
        ACCESS_TOKEN: ACCESS_TOKEN_MAX_AGE_SECONDS * 1000,  // 1 minuto PARA PRUEBAS          //60*60*1000,           // 1 HORA
        REFRESH_TOKEN: REFRESH_TOKEN_MAX_AGE_SECONDS * 1000, // 2 minutos PARA PRUEBAS                 1000*60*60*12*2,     // 2 DIAS
        SECURITY_TOKEN: 60*1000*10,                        // 30 MINUTOS
        // SESSION_DURATION: 1000*60*10,   // 10 minutos   //1000*60*60*24*7    // 7 DIAS
        EMAIL_VERIFICATION_AGE: 60*1000,            // 1 MINUTOS
        CATCH_STATICS_FILES_TIME: 1000*60*60*6,     // 6 HORAS
        VERIFICATION_ENDPOINTS_AGE: 1000*60*1,      // 10 MINUTOS
        VALIDATION_TOKENS: 1000*60*1,               // 10 MINUTOS
        VALIDATION_TOKENS_AGE: 90000,
        SMS_TOKEN: 1000*60*7,                       // 7 MINUTOS
        SESSION_TTL_SECONDS: SESSION_AGE_SECONDS,   // 10 MINUTOS PARA PRUEBAS  -> lo dejaremos en 7 dias ?
    },

    /**
    *  ENDPOINTS
    * 
    */ 

    //ENDPOINTS A LOS QUE SE PUEDE ACCEDER MEDIANTE METODO POST SIN COOKIE 
    VALID_POST_ENDPOINTS_WITHOUT_COOKIE: ["signup-email", "signup-email.html", "login-email", "login-email.html", "get-main-menu", "get-main-menu.html", "forgot-password", "forgot-password.html", "renove-password", "renove-password.html", "refresh-bridge", "refresh-bridge.html", "stripe-webhook", "stripe-webhook.html"],
    // ENDPOINTS A LOS QUE SE PUEDE ACCEDER MEDIANTE METODO POST SIN SESION
    VALID_POST_ENDPOINTS_WITHOUT_SESSION: ["get-main-menu", "get-html-items", "refresh-bridge", "refresh-bridge.html", "stripe-webhook", "stripe-webhook.html"],
   
    // ESTE EL EL CORRECTO
    RESTRICTED_ENDPOINTS: ["upload-files", "upload-files.html","remote-control-access-bi89530", "remote-control-panel", 'mis-bots', 'mis-bots.html', 'user', 'user.html', 'my-bots', 'my-bots.html'],

    //OJO ELIMINAMOS "remote-control-pannel"  PARA CREAR Y PROBAR EL SERVICIO
    //RESTRICTED_ENDPOINTS: ["upload-files", "upload-files.html","remote-control-access-bi89530", 'mis-bots', 'mis-bots.html', 'user', 'user.html', 'my-bots', 'my-bots.html'],

    
    // !!! VERIFICAMOS CON URL_TO_VERIFY [ PRIMERA SECCION DE LA URL]
    // SE CREAN PARA ATENDER UN SERVICIO TEMPORAL -> 
    DINAMIC_ENDPOINTS: ['temporal', 'dinamic'],

    // ENDPOINTS PARA REALIZAR PAGOS EN LA PLATAFORMA [stripe, ...]
    // NECESITAMOS TRATARLOS PORQUE SE HACEN MAS TAREAS QUE ENVIAR UNA PAGINA ESTATICA
    // SON PETICONES GET
    //PAY_ENDPOINTS: ["success-checkout", "success-checkout.html", "cancel-checkout", "cancel-checkout.html"],

    /**
     * PANEL DE ACCESO REMOTO A LA PLATAFORMA 
     * 
     */

    // REMOTE CONTROL
    REMOTE_CONTROL_ACCESS_ENDPOINT_GET: "remote-control-access-bi89530",
    // recibe los tokens y las claves para mostrar el pannel de control
    REMOTE_CONTROL_ACCESS_ENDPOINT_POST: "remote-control-access-post",
    // Entrada al manejador de las todas las acciones del pannel de control
    REMOTE_CONTROL_HANDLER_ENDPOINT_POST: "remote-control-handler-post",
    // EMAILS A LOS QUE SE ENVIAN LOS "ACCESS TOKENS" PARA ACCEDER AL PANEL REMOTO
    EMAILS_TO_SEND_ACCESS_CODES: ["pegashio@gmail.com", "pannelAdmin@ejemplo.com"],
    // Claves de acceso para el panel remoto
    ACCESS_VALID_KEYS: ["PANNEL_ACCESS_KEY_1", "PANNEL_ACCESS_KEY_2"],
    // desde Access-Pannel se nos enviará a este endpoint para mostrar el pannel de control
    REMOTE_CONTROL_PANEL_ENDPOINT: "remote-control-panel",
    REMOTE_PANEL_INTERNAL_ENDPOINTS : ["siteStats"],

    
    /** 
     * TAMAÑO MAXIMO DE LOS ARCHIVOS QUE SE PUEDEN SUBIR AL SERVIDOR
     */
    LIMITS_FILES_SIZE: {
        JSON: 32_000,          // 32 KB
        IMAGE: 540_000,         // 540 KB
        AUDIO: 2_048_000,       // 2MB
    },
   
    /** 
    * TAMAÑO MAXIMO DE CACHEO DE ARCHIVOS ESTATICOS  
    */
    MAX_SIZE_CATCH_STATIC_FILES: 200_000_000,      // 200 MB
    MAX_SIZE_CATCH_HTML_FILES: 25_000_000,      // 25 MB

    /**   
    * NOMBRES DE LAS BASES DE DATOS: ALGUNOS HAY QUE COMPLETARLOS CON DATOS DEL USUARIO O CON DATOS DE LA FECHA
    */
    DBS: {
        WEB_SITE: "web_site",                               // Contiene datos, endpoint, categorias, tags, ...
        BLACKLIST: "blacklist",                             // Collection = "ips"
        BILLS: "bills_",                                    // + año. Collection = mes
        ORDERS: "orders_",                                  // + año. Collection = mes
        PAYMENTS: "payments_" ,                             // + año. Colecction = mes
        MICROPAYMENTS: "micro_payments_",                   // + año. Coleccion = mes
        PENDING_TASKS: 'pending_tasks_',                    // + año
        PRODUCTS: "products",                               //    
        PROMOTIONS: "promotions",                           // -> collection = "codes"         
        SESSIONS: 'sessions_',                              // + AÑO EN EL QUE SE CREA LA SESSION ACTUAL -> COLLECTION = MES ... IDEM
        SITE_STATS: "site_stats_",                          // + año. Collection = mes
        USERS_ACTIVITY: 'users_activity_',                  // + año -> coll = name user
        USERS_ACCOUNTING: 'users_accounting_',              // + AÑO  -> coll = MONTH
        USERS_DATA: 'users_data',                          //  -> COLLECTION = MES DE ALTA DEL USUARIO
        AFILIATES: 'afiliates',                             // -> COLLECTION = codes

    },

    COLLECTIONS: {
        PROMOTIONS: "pcm",
        PRODUCTS: "pcm",
        AFILIATES: "codes",
        BLACKLIST: "ips",
    },
    /** TIEMPO DE EXPIRACION DE LA COOKIE */
    COOKIE_AGE: ACCESS_TOKEN_MAX_AGE_SECONDS,  
    REFRESS_TOKEN_AGE: REFRESH_TOKEN_MAX_AGE_SECONDS,

    /**
     * PARAMETROS DE LAS COOKIES
     */
    COOKIE: {
        // AUMENTAMOS UN POCO SU CADUCIDAD PARA QUE CUANDO EXPIRE EL TOKEN AUN HAYA COOKIE QUE ENVIAR
        PARAMS_ATK_SIGNIN_DEV: `max-age=${ACCESS_TOKEN_MAX_AGE_SECONDS * 1.5}; expires=${ACCESS_TOKEN_MAX_AGE_SECONDS * 1.5};`,
        // PARAMS_RTK_SIGNIN_DEV: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE};`,
//PARAMS_RTK_SIGNIN_DEV: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE}; HttpOnly;`,
        PARAMS_RTK_SIGNIN_DEV: `max-age=${REFRESH_TOKEN_MAX_AGE_SECONDS * 1.5}; expires=${REFRESH_TOKEN_MAX_AGE_SECONDS * 1.5}; HttpOnly; Secure; SameSite=Strict; Path=/refresh-bridge.html;`,

        PARAMS_ATK_SIGNIN_PROD: `max-age=${ACCESS_TOKEN_MAX_AGE_SECONDS * 1.5}; expires=${ACCESS_TOKEN_MAX_AGE_SECONDS * 1.5}; Domain=${DOMAIN_PROD};`,
//PARAMS_RTK_SIGNIN_PROD: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE}; HttpOnly; Secure; Domain=${DOMAIN_PROD};`,
        PARAMS_RTK_SIGNIN_PROD: `max-age=${REFRESH_TOKEN_MAX_AGE_SECONDS * 1.5}; expires=${REFRESH_TOKEN_MAX_AGE_SECONDS * 1.5}; HttpOnly; Secure; SameSite=Strict; Path=/refresh-bridge.html;`,

        PARAMS_DEVIDE_ID_DEV: `max-age=${REFRESH_TOKEN_MAX_AGE_SECONDS * 1.5}; expires=${REFRESH_TOKEN_MAX_AGE_SECONDS * 1.5};`,
        PARAMS_DEVIDE_ID_PROD: `max-age=${REFRESH_TOKEN_MAX_AGE_SECONDS * 1.5}; expires=${REFRESH_TOKEN_MAX_AGE_SECONDS * 1.5};`,
        CLEAN_RTK: ["rtk=; expires=0; max-age=0; HttpOnly;"],
        CLEAN_ATK: ["atk=; expires=0; max-age=0"],
        CLEAN_DEVICE_ID: ["deviceId=; expires=0; max-age=0"],
        CLEAN_ALL_ACCESS_TOKENS: ["rtk=; expires=0; max-age=0; HttpOnly;" , "atk=; expires=0; max-age=0;", "deviceId=; expires=0; max-age=0;"],
        // CLEAN_ALL_ACCESS_TOKENS: ["rtk=; expires=0; max-age=0;" , "atk=; expires=0; max-age=0;", "deviceId=; expires=0; max-age=0;"],
    },  
    
    /** 
    *   NOMBRES DE LAS BASES DE DATOS QUE HAY QUE ABRIR ANTES DE LANZAR EL SERVIDOR HTTP  
    */
    DBS_TO_OPEN: [ "promotions", "products", "orders_2026", "payments_2026", "bills_2026", "users_accounting_2026", 'blacklist', 'users_data', 'users_activity_2026', 'sessions_2026', "site_stats_2026"],

    /** 
    *   BASES DE DATOS DE LAS QUE HAY QUE CACHEAR CIERTOS DATOS ENTES DE LANZAR EL SERVIDOR HTTP 
    */
    DBS_TO_CATCH_DATA: ["promotions","blacklist", "products", "users_data", "sessions_2026"],

    /**  
    *   CARPTETA BASE  DESDE LA QUE HAY QUE CACHEAR LOS ARCHIVOS ESTATICOS
    */
    BASE_URL_CATCH_FILES_DEV: "/home/carlos/dev/basic-project-old/frontend/",
    BASE_URL_CATCH_FILES_PROD: "",
    /** 
    *   CARPETAS DONDE ESTAN LOS ARCHIVOS ESTATICOS DEL SITIO
    */
    CATCH_FILES_FOLDERS: ["statics/", "images/", "media/"],
    /**  
    * CARPETAS DONDE ESTAN LOS ARCHIVOS HTML DEL SITIO
    */
    CATCH_HTML_FILES_FOLDERS: ["/templates-es", "/templates-en", "/restricted-urls-es", "/restricted-urls-en" ],
    

    /** 
    *   CRONS DEL SISTEMA: SE AÑADEN LOS intetvals de los crons para detenerlos si es necesario.
    */
    CRONS: {},      
    /** 
    *    CADA CUANTO TIEMPO SE HACEN LOS CRONS 
    */ 
    CRONS_INTERVALS: {
        SESSIONS: 1000*60*2,                           // 60 MINUTOS -> CADA HORA SE COMPRUEBA SI ES LA HORA CORRECTA
        BACKUP_DBS: 1000*60*60*60,                      // 60 MINUTOS -> CADA HORA SE COMPRUEBA SI ES LA HORA CORRECTA
        BLACKLIST: 1000*60*2,                          // 10 MINUTOS    // CADA CUANTO TIEMPO SE RECORRE LA BLACKLIST PARA LEVANTAR BLOQUEOS
        SITE_STATS_TO_DB: 1000*60*2,                   // 60 MINUTOS   // CADA HORA Y SE COMPRUEBA QUE SEA UNA HORA EN CONCRETO ??
        VALIDATION_TOKENS_MANAGE: 1000*60*2,           // 10 MINUTOS   //
        VERIFICATION_ENDPOINTS: 1000*60*2,             // 10 MINUTOS       // CADA CUANTO TIEMPO SE RECORREN LOS ENDPOINT PARA VER SU ESTADO
        PROMOTIONS_CODES: 1000*60*2,                     // 10 MINUTOS
    },

    /** 
    *   REGLAS PARA EL PROXY INTERNO DEL SITIO 
    */
    DDOS_RULES: {
        MAX_REQUEST_BY_SECOND: 120,               // MAXIMO DE 120 RECURSOS POR SEGUNDO  
        MAX_REQUEST_BY_MINUTE: 800,               // EN UN MINUTO PODRIA VER 15 PAGINAS COMO MAXIMO -> 15 * 50 RECURSOS  = 750 PETICIONS
       
        MAX_REQUEST_BY_HOUR: 50_000,
       
        MAX_REQUEST_BY_DAY: 1_000_000,

        MAX_TIMES_SIGNUP_BY_MIN: 3, 
        MAX_TIMES_LOGIN_BY_MIN: 3,

        TIME_IP_PAUSED: 1000*60*30,                 // 30 MINUTOS
        TIME_IP_BLOCKED: -1,                        // SIEMPRE
    },


}

