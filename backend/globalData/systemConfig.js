
const DOMAIN_PROD = "tudominio.com"
const DOMAIN_DEV = "localhost"
const COOKIE_MAX_AGE = 60*10;  //  VALOR EN SEGUNDOS  // (10 minuto para dev)         60*60*12*7;     // 7 DIASS,


export default  {


    VERSION: '1.0',
    PLATFORM_NAME: "AutomatizaBots",
    HOST_DEV: "localhost:3000",
    HOST_PROD: "",

    // mode: 'DEV', // 'PROD',
    // HOST_DEV: 'localhost:3000',
    // HOST_PROD: 'automatizabots.com',
    
   
    BASE_URL_PROD: "",
    BASE_URL_DEV: "/home/carlos/dev/nodejs/pruebas/proyect-basic/backend/",
    BASE_URL_USER_FILES_FOLDER_DEV: "/home/carlos/dev/nodejs/pruebas/proyect-basic/user-files/",
    BASE_URL_USER_FILES_FOLDER_PROD: "",
    BASE_URL_FRONTEND_FILES_DEV: "/home/carlos/dev/nodejs/pruebas/proyect-basic/frontend/",
    BASE_URL_FRONTEND_FILES_PROD: "",

    EMAIL_NOT_REPLY_SENDER: "pegashio70@gmail.com",
    EMAIL_SENDER: "pegashio70@gmail.com",
    
    MAIN_LANGUAGE: "es",
    LANGUAGES_AVAILABLE: ["es", "en"],
    HAS_MULTI_CPUS: false,
    HAS_USERS: true,
    HAS_SUBDOMAINS: true, 
    HAS_RESTRICTED_ENDPOINTS: true,
    HAS_VERIFICATION_ENDPOINTS: true,
    HAS_DINAMIC_ENDPOINTS: true,
    HAS_PAY_ENDPOINTS: true,
    HAS_MASTERS_ENDPOINTS: true,
    // PARA HABILIRAR EL ACCESO ENVIADO CODIGO DE VALIDACIÓN
    // SOLO EN EL SIGNUP
    HAS_2FA: true,
    HAS_2FA_SIGNUP: true,       // SI SOLO QUEREMOS EL SIGNUP CON ENVIO DE CODE PARA VERIFICAR EL EMAIL
    // PARA HABILITAR TAMBIEN EN EL LOGIN
    // HAS_2FA_LOGIN: true,
    // SE ENVIA DENTRO DEL getMainMenu ??? 
    HAS_PROMO_CODES: true,      
    PROMO_CODE_MIN_LENGTH : 6,
    
    HAS_MULTI_LANGUAJES: true, 
    // HABILITAR PROXY INTERNO PARA ATAQUES DDOS
    HAS_OWN_PROXY_DDOS: true,


    // SUBDOMINIOS PERMITIDOS PARA RECIBIR PETICIONES
    SUBDOMAINS_ALLOWED: ['hooks', 'api', "master", "api.docs"],

    GET_SIGNUP_COUNTRY: false,              // se hace peticion en el signin para obtener el country del user
    CATCH_STATIC_FILES: true,
    CATCH_DB_DATA: true,

    COOKIE_AGE: COOKIE_MAX_AGE,

    HOME_STATIC_FILE: 'index.html',           // Archivo index de la pagina
    HOME_DINAMIC_FILE: 'index-dinamic.html',
    EXTENSION_STATIC_VIEWS: 'html',            // EXTENSION DE LAS VISTAS ESTATICOS

    ENDPOINTS_TYPE_TO_SAVE_STATS: ['html', 'mp3', 'wav', 'ogg', 'pdf'],

    VALID_POST_ENDPOINTS_WITHOUT_COOKIE: ["signup", "signup.html", "login", "login.html", "get-main-menu", "get-main-menu.html"],


    FOLDERS: {

        TEMPLATE_FILES: 'templates',            // html files
        DINAMIC_FILES: 'dinamic',
        STATICS_FILES :'statics',
        IMAGES_FILES: 'images',
        RESTRICTED_FILES: 'restricted-urls',
        USERS_FILES: 'users-files',
        MEDIA_FILES: 'media',

    },

    STATUS: {
        ENDED: 'ENDED',
        BLOCKED: 'BLOCKED',
        HACKED: 'HACKED',
        ACTIVE: 'ACTIVE',
        ERROR_FETCH: 'ERROR',
        SUCCESS: 'ok',
        SUCCESS_FETCH: 'ok',
        EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED"
    },
    
    PAGES: {
        ACCESS_PLATFORM: '/acceso-plataforma.html',     // con la / porque para redirecciones 302 absolutas
        // ACCOUNT_RECOVERY_INFO: '/account-recovery-info.html',
        BLOCKED_ACCOUNT_INFO: "/blocked-account-info.html",
        CONNECTION_ERROR_PAYMENT_PROVIDER: "/connection-error-payment-provider.html",
        DELETE_COOKIES_AND_LOGIN: "delete-cookies-and-login.html",
        EMAIL_VERIFICATION_INFO: "/email-verification-info.html",
        EMAIL_VERIFIED: "/email-verified.html",
        // EXPIRED_ENDPOINT: '/expired-endpoint.html',      // se enviaba desde emailVerificationHandler
        HOME: '/index.html',
        INVALID_SUBDOMAIN_REQUEST: "invalid-subdomain-request.html",
        MAIN_CAT_ENPOINT: "/bots.html",
        MAIN_BLOG_ENDPOINT: "/blog.html",
        PAGE_NOT_FOUND: '/404.html',
        REQUEST_INVALID: '/500.html',
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
    },

    TOKENS_AGE:{
        ACCESS_TOKEN: 60*1000,  // 1 minuto           //60*60*1000,           // 1 HORA
        REFRESH_TOKEN: 60*1000*5, // 5 minutos                 1000*60*60*12*2,     // 2 DIAS
        SECURITY_TOKEN: 60*1000*10,                        // 30 MINUTOS
        SESSION_DURATION: 1000*60*10,   // 10 minutos   //1000*60*60*24*7    // 7 DIAS
        EMAIL_VERIFICATION_AGE: 60*1000,       // 1 MINUTOS
        CATCH_STATICS_FILES_TIME: 1000*60*60*6,      // 6 HORAS
        VERIFICATION_ENDPOINTS_AGE: 1000*60*1,      // 10 MINUTOS
        VALIDATION_TOKENS: 1000*60*1,               // 10 MINUTOS
        SMS_TOKEN: 1000*60*7,                       // 7 MINUTOS
    },

    // ENDPOINTS

   

    // VERIFICAMOS CON EL ENDPOINT  -> HA DE SER IGUAL AL ENDPOINT
    // VERIFICATION_ENDPOINTS: ['email-verification', 'email-verification.html', 'recovery-account', 'recovery-account.html','renove-password', 'renove-password.html'],
    VERIFICATION_ENDPOINTS: ['recovery-account', 'recovery-account.html','renove-password', 'renove-password.html'],

    // url donde hay que verificar cookie y session  !!! VERIFICAMOS CON URL_TO_VERIFY [ PRIMERA SECCION DE LA URL]
    // QUE ES LA PRIMERA SESSION DE LA URL (host:port/ESTA-SECCION/end_point)
    
    // ESTE EL EL CORRECTO
    // RESTRICTED_ENDPOINTS: ["upload-files", "upload-files.html","remote-control-access-bi89530", "remote-control-panel", 'mis-bots', 'mis-bots.html', 'user', 'user.html', 'my-bots', 'my-bots.html'],

//OJO ELIMINAMOS "remote-control-pannel"  PARA CREAR Y PROBAR EL SERVICIO
RESTRICTED_ENDPOINTS: ["upload-files", "upload-files.html","remote-control-access-bi89530", 'mis-bots', 'mis-bots.html', 'user', 'user.html', 'my-bots', 'my-bots.html'],

    
    // !!! VERIFICAMOS CON URL_TO_VERIFY [ PRIMERA SECCION DE LA URL]
    // SE CREAN PARA ATENDER UN SERVICIO TEMPORAL -> 
    DINAMIC_ENDPOINTS: ['temporal', 'dinamic'],

    // ENDPOINTS PARA REALIZAR PAGOS EN LA PLATAFORMA [stripe, ...]
    // NECESITAMOS TRATARLOS PORQUE SE HACEN MAS TAREAS QUE ENVIAR UNA PAGINA ESTATICA
    PAY_ENDPOINTS: ["success-checkout", "success-checkout.html", "cancel-checkout", "cancel-checkout.html"],

    // REMOTE CONTROL
    REMOTE_CONTROL_ACCESS_ENDPOINT_GET: "remote-control-access-bi89530",
    // recibe los tokens y las claves para mostrar el pannel de control
    REMOTE_CONTROL_ACCESS_ENDPOINT_POST: "remote-control-access-post",
    // Entrada al manejador de las todas las acciones del pannel de control
    REMOTE_CONTROL_HANDLER_ENDPOINT_POST: "remote-control-handler-post",

    EMAILS_TO_SEND_ACCESS_CODES: ["pegashio@gmail.com", "pannelAdmin@ejemplo.com"],
    ACCESS_VALID_KEYS: ["PANNEL_ACCESS_KEY_1", "PANNEL_ACCESS_KEY_2"],
    // desde Access-Pannel se nos enviará a este endpoint para mostrar el pannel de control
    REMOTE_CONTROL_PANEL_ENDPOINT: "remote-control-panel",
    REMOTE_PANEL_INTERNAL_ENDPOINTS : ["siteStats"],

    
    LIMITS_FILES_SIZE: {
        JSON: 124_000,          // 124 KB
        IMAGE: 540_000,         // 540 KB
        AUDIO: 1_024_000,       // 1MB
    },
   
    // MAX_AUDIO_DURATION: 0,
    MAX_SIZE_CATCH_STATIC_FILES: 100_000_000,      // 100 MB
    MAX_SIZE_CATCH_HTML_FILES: 25_000_000,      // 25 MB


    DBS: {
        WEB_SITE: "web_site",                               // Contiene datos, endpoint, categorias, tags, ...
        AUTOMATES: 'automates',             //
        BLACKLIST: "blacklist",                             // collection: "ips"
        BILLS: "bills_",                                    // + año -> collection el mes
        ORDERS: "orders_",                                  // Collection el mes
        PAYMENTS: "payments_" ,                             // Colecction el mes
        PENDING_TASKS: 'pending_tasks_',                    // +YEAR
        PRODUCTS: "products",                               //             
        SESSIONS: 'sessions_',                              //  + AÑO EN EL QUE SE CREA LA SESSION ACTUAL -> COLLECTION MES ... IDEM
        SITE_STATS: "site_stats_",                          // año -> collection: mes
        SYSTEM_BOTS: 'sysytem_bots',                        // x coll x BOTS
        USERS_ACTIVITY: 'users_activity_',                  // x YEAR -> coll x name user
        USERS_BOTS: 'users_bots',                           // coll x NAME USER
        USERS_CONTA: 'users_conta_',                        // +YEAR -> coll x MONTH
        USERS_DATA: 'users_data_',                          // + AÑO ALTA DEL USUARIIO -> COLLECTION = MES DE ALTA DEL USUARIO
        VERIFICATION_ENDPOINTS: "verification_endpoints",   // Collection: "emails"

    },
    
    COOKIE: {
        PARAMS_ATK_SIGNIN_DEV: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE};`,
        // PARAMS_RTK_SIGNIN_DEV: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE};`,
        PARAMS_RTK_SIGNIN_DEV: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE}; HttpOnly;`,

        PARAMS_ATK_SIGNIN_PROD: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE}; Domain=${DOMAIN_PROD};`,
        PARAMS_RTK_SIGNIN_PROD: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE}; HttpOnly; Secure; Domain=${DOMAIN_PROD};`,
        PARAMS_DEVIDE_ID_DEV: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE};`,
        PARAMS_DEVIDE_ID_PROD: `max-age=${COOKIE_MAX_AGE}; expires=${COOKIE_MAX_AGE};`,
        CLEAN_RTK: ["rtk=; expires=0; max-age=0; HttpOnly;"],
        CLEAN_ATK: ["atk=; expires=0; max-age=0"],
        CLEAN_DEVICE_ID: ["deviceId=; expires=0; max-age=0"],
        CLEAN_ALL_ACCESS_TOKENS: ["rtk=; expires=0; max-age=0; HttpOnly;" , "atk=; expires=0; max-age=0;", "deviceId=; expires=0; max-age=0;"],
        // CLEAN_ALL_ACCESS_TOKENS: ["rtk=; expires=0; max-age=0;" , "atk=; expires=0; max-age=0;", "deviceId=; expires=0; max-age=0;"],
        
    },    

    DBS_TO_OPEN: ["promotions", "products", "orders_2025", "orders_2026", "payments_2025", "payments_2026","bills_2025", "bills_2026", "users_accounting_2025", "users_accounting_2026", 'blacklist', 'verificationEndpoints_2025', 'verificationEndpoints_2026', 'users_data_2025', 'users_data_2026', 'users_activity_2025', 'users_activity_2026', 'sessions_2025', 'sessions_2026', 'automates', "site_stats_2025", "site_stats_2026"],

    DBS_TO_CATCH_DATA: ["promotions","blacklist", "products", "users_data_2025", "users_data_2026", "sessions_2025", "sessions_2026", "verificationEndpoints_2025","verificationEndpoints_2026"],

    BASE_URL_CATCH_FILES_DEV: "/home/carlos/dev/nodejs/pruebas/proyect-basic/frontend/",
    BASE_URL_CATCH_FILES_PROD: "",
    CATCH_FILES_FOLDERS: ["/statics", "/images", "/media"],
    CATCH_HTML_FILES_FOLDERS: ["/templates-es", "/templates-en", "/restricted-urls-es", "/restricted-urls-en" ],
    
    CRONS: {},      // SE AÑADEN LOS intetvals de los crons para detenerlos si es necesario.
    // CADA CUANTO TIEMPO SE HACE MANTENIMIENTO DE DATOS 
    CRONS_INTERVALS: {
        SESSIONS: 1000*60*2,                           // 60 MINUTOS -> CADA HORA SE COMPRUEBA SI ES LA HORA CORRECTA
        BACKUP_DBS: 1000*60*60*60,                      // 60 MINUTOS -> CADA HORA SE COMPRUEBA SI ES LA HORA CORRECTA
        BLACKLIST: 1000*60*2,                          // 10 MINUTOS    // CADA CUANTO TIEMPO SE RECORRE LA BLACKLIST PARA LEVANTAR BLOQUEOS
        SITE_STATS_TO_DB: 1000*60*2,                   // 60 MINUTOS   // CADA HORA Y SE COMPRUEBA QUE SEA UNA HORA EN CONCRETO ??
        VALIDATION_TOKENS_MANAGE: 1000*60*2,           // 10 MINUTOS   //
        VERIFICATION_ENDPOINTS: 1000*60*2,             // 10 MINUTOS       // CADA CUANTO TIEMPO SE RECORREN LOS ENDPOINT PARA VER SU ESTADO
        PROMOTIONS_CODES: 1000*60*2,                     // 10 MINUTOS
    },

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

