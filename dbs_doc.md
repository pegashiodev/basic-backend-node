

# DB USERS_DATA
    DATOS DE LOS USUARIOS

    - DB Name = users_data_ + [year]
    - Collection = week_day + day  [Ej: mon23] -> Datos que se extraen del user -> user.since -> mes y dia de creaición del usuario
    - Doc = user



# DB SITE_STATS
    ESTADISTICAS DE USO DEL SITIO

    - DB Name = site_stats_ + [year]
    - Collection = month
    - Doc = {
        _id: {  // asi esta cacheado el _id, dia, hora -> Para busquedas sin nuevos index
            _id,
            day,
            hour
        },
        day,
        hour,
        endpoints:{

            endpoint-1: [        este es el contenido que va creciendo
                ip1, ip2, ip3, ...
            ],
            endpoint-2: [        este es el contenido que va creciendo
                ip1, ip2, ip3, ip1, ...
            ],
            ...
        }
    }


# AÑADIR NUEVO IDIOMA A LA WEB

- Añadir el idioma en systemConfig.LANGUAGES_AVAILABLE
- Hay que crear htmlFilesCatched[idioma-nuevo] en la carpeta globalData para cachear los archivos html
- Añadir en languajes.js una nueva entrada con el nuevo lenguaje
- Crear las siguientes carpetas en /fronted
    - templates-[idioma-nuevo]
    - restricted-urls-[idioma-nuevo]
    - dinamic-urls-[idioma-nuevo]
    - CREAR TODAS LAS PAGINA EN EL NUEVO IDIOMA

- Añadir estas carpetas creadas en el systemConfig.CATCH_HTML_FILES_FOLDERS

#
