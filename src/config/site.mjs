// ═══════════════════════════════════════════════════════════════
//  CONFIGURACIÓN DE MARCA
//  ─────────────────────────────────────────────────────────────
//  Este es el ÚNICO archivo que hay que tocar para reutilizar
//  el esqueleto de la web con otra marca. De aquí tiran:
//
//    · src/layouts/Layout.astro      (SEO, Open Graph, Schema.org)
//    · src/components/Header.astro   (logo y redes)
//    · src/pages/robots.txt.ts       (robots + sitemap)
//    · src/pages/site.webmanifest.ts (PWA)
//    · src/pages/api/contacto.ts     (emails de aviso y respuesta)
//    · src/lib/dossier.ts            (prompts del agente de leads)
//    · src/content.config.ts         (autor por defecto del blog)
//    · astro.config.mjs              (site → sitemap y canónicas)
//
//  Los TEXTOS de las páginas (home, proyectos, legales…) NO salen
//  de aquí: se reescriben a mano. Busca "MARCA" para encontrarlos.
//
//  Lo único que queda fuera de este archivo es vercel.json
//  (redirección dominio-sin-www → www), porque es JSON estático.
// ═══════════════════════════════════════════════════════════════

export const SITE = {
  // ── Identidad ──────────────────────────────────────────────
  /** Nombre comercial, tal cual se escribe. */
  name: "Black Sun Prods",
  /** Dominio canónico CON www y sin barra final. */
  url: "https://www.blacksunprods.com",
  /** Cómo se muestra el dominio en textos y firmas de email. */
  domainLabel: "blacksunprods.com",
  /** Bajada corta de una línea. Aparece en el manifest de la PWA. */
  tagline: "Productora de eventos",
  /** Idioma y locale del sitio. */
  lang: "es",
  locale: "es_ES",

  // ── SEO por defecto (cada página puede sobreescribirlo) ────
  defaultTitle: "Black Sun Prods · Productora de eventos en Jaén",
  defaultDescription:
    "Productora de eventos en Jaén: dirigimos, producimos y ejecutamos eventos musicales, fiestas temáticas y programación para ayuntamientos, salas y marcas.",
  /** Ruta de la imagen para compartir en redes (1200x630). JPG, no WebP. */
  ogImage: "/images/og-blacksunprods.jpg",
  ogImageAlt: "Black Sun Prods — productora de eventos. Del concepto a la multitud.",

  // ── Contacto ───────────────────────────────────────────────
  email: "info@blacksunprods.com",
  /**
   * Remitente del aviso interno de nuevos contactos. Está en el mismo
   * dominio (verificado en Resend) pero NO es `email` a propósito: mandar
   * de info@ a info@ desde un servidor externo es un patrón de auto-envío
   * que los filtros archivan como spam. No necesita buzón: las respuestas
   * salen por reply_to (van al cliente) y los rebotes los recoge Resend.
   */
  notifySender: "web@blacksunprods.com",
  /**
   * Destinatarios del aviso de nuevo contacto. Van los dos a propósito:
   * info@ deja el registro en el buzón de la marca, y el Gmail personal
   * garantiza el aviso inmediato en el móvil sin depender de la recogida
   * POP de Hostinger, que no arrastra lo que su filtro aparta como spam.
   * Un lead perdido cuesta dinero: la redundancia sale barata.
   */
  notifyTo: ["info@blacksunprods.com", "franmadi10@gmail.com"],
  /** Teléfono en formato E.164 (para Schema.org y el enlace tel:). */
  phone: "+34634434864",
  /** Solo dígitos con prefijo de país, para el enlace de WhatsApp. */
  whatsapp: "34634434864",
  /** Nombre de quien firma los emails automáticos. */
  ownerName: "Francisco José",

  // ── Titular (LSSI art. 10 y responsable del RGPD) ──────────
  /**
   * Datos identificativos que la ley obliga a publicar en /terminos
   * y /privacidad. Mientras falte cualquiera de los tres primeros, el
   * bloque de identificación NO se muestra: publicar un dato inventado
   * es peor que no publicarlo, porque la identificación del titular es
   * justo lo que la LSSI exige que sea cierto y comprobable.
   * Se rellenan los tres de golpe (ver `hasLegalOwner`).
   */
  owner: {
    /** Nombre y apellidos si es autónomo; denominación social completa si es sociedad. */
    legalName: "",
    /** NIF (persona física) o CIF (sociedad). */
    taxId: "",
    /** Domicilio completo: vía y número, código postal, localidad y provincia. */
    address: "",
    /**
     * Solo sociedades: datos de inscripción en el Registro Mercantil
     * ("Registro Mercantil de Jaén, tomo X, folio Y, hoja Z"). Un
     * autónomo no se inscribe, así que se queda vacío y no se imprime.
     */
    registry: "",
  },

  // ── Redes ──────────────────────────────────────────────────
  instagram: "https://www.instagram.com/blacksunprods",

  // ── Marca visual ───────────────────────────────────────────
  /** Logo del header (PNG con transparencia). */
  logo: "/logo.png",
  /** Banda de cabecera de los emails (600px de ancho, PNG). */
  emailBanner: "/email-logo-band-bsp.png",
  /** Color de la barra del navegador y fondo de la PWA. */
  themeColor: "#0a0a0a",
  backgroundColor: "#000000",

  // ── Negocio local (Schema.org LocalBusiness) ───────────────
  business: {
    city: "Jaén",
    region: "Andalucía",
    country: "ES",
    latitude: 37.7796,
    longitude: -3.7849,
    priceRange: "€€",
    areaServed: ["Jaén", "Andalucía", "España"],
    serviceType: [
      "Producción de eventos",
      "Eventos para ayuntamientos",
      "Eventos musicales y fiestas temáticas",
      "Producción para salas y ocio nocturno",
      "Activaciones de marca",
      "Alquiler de sonido e iluminación",
      "Producción técnica para teatros, galas y entregas de premios",
    ],
    description:
      "Black Sun Prods es una productora de eventos y experiencias en directo con base en Jaén. Dirige, produce y ejecuta eventos musicales, fiestas temáticas, programación cultural y eventos para ayuntamientos, salas, promotores y marcas, coordinando artistas, técnica, seguridad, ticketing y operación. También presta servicios parciales: alquiler y operación de rider técnico de sonido e iluminación para teatros, galas, entregas de premios, actos institucionales y eventos de empresa, sin necesidad de producir el evento completo.",
  },
};

/** Números de ejemplo: mientras sigan estos valores, no se muestra nada. */
export const WHATSAPP_PLACEHOLDER = "34600000000";
export const PHONE_PLACEHOLDER = "+34600000000";
export const hasWhatsapp = () => Boolean(SITE.whatsapp) && SITE.whatsapp !== WHATSAPP_PLACEHOLDER;
/**
 * Va aparte de `hasWhatsapp` a propósito: son dos canales distintos y
 * pueden no coincidir (una fija no tiene WhatsApp, y un WhatsApp Business
 * puede no querer llamadas). Atar el teléfono al WhatsApp haría desaparecer
 * uno al quitar el otro.
 */
export const hasPhone = () => Boolean(SITE.phone) && SITE.phone !== PHONE_PLACEHOLDER;

/**
 * El teléfono tal y como se lee en pantalla: "+34634434864" → "634 43 48 64".
 * Se calcula en vez de guardarse como segundo campo para que no puedan
 * acabar diciendo números distintos. Si no es un móvil español, se muestra
 * el E.164 tal cual, que siempre es correcto aunque sea menos bonito.
 */
export const phoneLabel = () => {
  const es = SITE.phone.match(/^\+34(\d{3})(\d{2})(\d{2})(\d{2})$/);
  return es ? `${es[1]} ${es[2]} ${es[3]} ${es[4]}` : SITE.phone;
};

/**
 * ¿Hay datos de titular suficientes para publicar el bloque legal?
 * Exige los tres obligatorios; `registry` es opcional a propósito.
 */
export const hasLegalOwner = () =>
  Boolean(SITE.owner.legalName && SITE.owner.taxId && SITE.owner.address);

export const CONSENT_KEY = "site_cookie_consent";

/** Une el dominio canónico con una ruta: absUrl("/contacto"). */
export const absUrl = (path = "/") => `${SITE.url}${path}`;

// ── Fecha de los textos legales ───────────────────────────────────────────
// A MANO, a propósito: "Última actualización" declara cuándo se revisó el
// documento de verdad. No se calcula sola ni sube con cada despliegue, porque
// entonces afirmaría una revisión que no ha existido y el dato dejaría de
// servirle al usuario para saber si los términos han cambiado.
//
// Actualízala SOLO al tocar el contenido de /terminos o /privacidad.
// La leen las dos páginas, así que no pueden quedarse desincronizadas.
export const LEGAL_UPDATED = "septiembre 2026";

export default SITE;
