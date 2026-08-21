

import path from "node:path";
import systemConfig from "../../globalData/systemConfig.js";

export default (req) => {
  req.its_bad_get_request = false;

  const rawUrl = req.url || "/";
  const [pathnameRaw, queryString] = rawUrl.split("?");

  // 1. Limpieza y normalización de segmentos
  const cleanPathname = pathnameRaw.toLowerCase();
  const segments = cleanPathname.split("/").filter((seg) => seg.trim() !== "");

  let urlLanguage = null;
  let canonicalSegments = [...segments];

  // 2. Detección segura de idioma: solo si existe en los admitidos
  if (
    canonicalSegments.length > 0 &&
    systemConfig.LANGUAGES_AVAILABLE.includes(canonicalSegments[0])
  ) {
    urlLanguage = canonicalSegments.shift(); // Extrae el idioma del array de segmentos
  }

  // 3. Resolución de la ruta canónica limpia (ej. "/mis-bots" o "/blog/mis-bots")
  const canonicalPath =
    canonicalSegments.length > 0 ? `/${canonicalSegments.join("/")}` : "/";

  // El endpoint raíz de primer nivel real (ej. "mis-bots", "blog", "user")
  const rootEndpoint = canonicalSegments[0] || "";

  // 4. Verificación de endpoint restringido
  // Una ruta SOLO es restringida si su raíz canónica de primer nivel está protegida
  const isRestricted =
    systemConfig.RESTRICTED_ENDPOINTS.includes(rootEndpoint);

  // 5. Determinación del idioma de respuesta
  let resolvedLanguage = systemConfig.MAIN_LANGUAGE;
  if (urlLanguage) {
    resolvedLanguage = urlLanguage;
  } else if (req.headers["accept-language"]) {
    const browserLang = req.headers["accept-language"]
      .split(",")[0]
      .split("-")[0]
      .toLowerCase();
    if (systemConfig.LANGUAGES_AVAILABLE.includes(browserLang)) {
      resolvedLanguage = browserLang;
    }
  }

  // 6. Nombre de archivo y extensión
  let fileName = "";
  let ext = "";

  if (canonicalPath === "/") {
    fileName = systemConfig.HOME_STATIC_FILE;
    ext = systemConfig.EXTENSION_STATIC_VIEWS;
  } else {
    fileName = path.basename(cleanPathname);
    const extMatch = fileName.lastIndexOf(".");
    if (extMatch !== -1) {
      ext = fileName.substring(extMatch + 1);
    } else {
      ext = systemConfig.EXTENSION_STATIC_VIEWS;
      fileName += `.${ext}`;
    }
  }

  // 7. Parseo robusto de Query Strings con URLSearchParams
  let searchParams = null;
  if (queryString) {
    const parsed = new URLSearchParams(queryString);
    searchParams = Object.fromEntries(parsed.entries());
    if (Object.keys(searchParams).length === 0) searchParams = null;
  }

  // 8. Inyección en req.urlData
  req.urlData = {
    method: req.method,
    host: req.headers.host || undefined,
    mode: req.headers["sec-fetch-mode"] || undefined,
    url: cleanPathname,
    url_parts: segments,
    canonicalPath: canonicalPath, // Ruta normalizada sin idioma
    url_to_verify: rootEndpoint.split(".")[0],
    is_restricted: isRestricted,
    fileName: fileName,
    //endpoint: rootEndpoint.split(".")[0],
    endpoint: fileName.split(".")[0],         // 
    ext: ext,
    search: queryString || "",
    searchParams: searchParams,
    ip: req.socket?.remoteAddress || req.socket?.address()?.address,
    hasCookie: Boolean(req.headers.cookie),
    url_language: urlLanguage,
    language: resolvedLanguage,
    userAgent: req.headers["user-agent"] || "",
    authorization: req.headers["authorization"] || "",
  };

  if(!isRestricted && systemConfig.RESTRICTED_ENDPOINTS.includes(fileName)){
    req.its_bad_get_request = true;
  }

  return;
};