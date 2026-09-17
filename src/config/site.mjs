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
  url: "https://www.dominio.com",
  /** Cómo se muestra el dominio en textos y firmas de email. */
  domainLabel: "dominio.com",
  /** Bajada corta de una línea. Aparece en el manifest de la PWA. */
  tagline: "Consultoría creativa",
  /** Idioma y locale del sitio. */
  lang: "es",
  locale: "es_ES",

  // ── SEO por defecto (cada página puede sobreescribirlo) ────
  defaultTitle: "Black Sun Prods · Consultoría Creativa",
  defaultDescription:
    "Descripción por defecto de Black Sun Prods. 150-160 caracteres, con el servicio principal y la zona en la que opera.",
  /** Ruta de la imagen para compartir en redes (1200x630). JPG, no WebP. */
  ogImage: "/images/og-marca.jpg",
  ogImageAlt: "Black Sun Prods — consultoría creativa",

  // ── Contacto ───────────────────────────────────────────────
  email: "info@blacksunprods.com",
  /** Teléfono en formato E.164 (para Schema.org y el enlace tel:). */
  phone: "+34600000000",
  /** Solo dígitos con prefijo de país, para el enlace de WhatsApp. */
  whatsapp: "34600000000",
  /** Nombre de quien firma los emails automáticos. */
  ownerName: "Nombre",

  // ── Redes ──────────────────────────────────────────────────
  instagram: "https://www.instagram.com/usuario",

  // ── Marca visual ───────────────────────────────────────────
  /** Logo del header (PNG con transparencia). */
  logo: "/logo.png",
  /** Banda de cabecera de los emails (600px de ancho, PNG). */
  emailBanner: "/email-logo-band.png",
  /** Color de la barra del navegador y fondo de la PWA. */
  themeColor: "#0a0a0a",
  backgroundColor: "#000000",

  // ── Negocio local (Schema.org LocalBusiness) ───────────────
  business: {
    city: "Ciudad",
    region: "Comunidad",
    country: "ES",
    latitude: 0,
    longitude: 0,
    priceRange: "€€",
    areaServed: ["Ciudad", "Comunidad", "España"],
    serviceType: ["Servicio 1", "Servicio 2", "Servicio 3"],
    description:
      "Descripción larga del negocio para los datos estructurados: qué hace, para quién y desde dónde.",
  },
};

/** Clave de localStorage del consentimiento de cookies (genérica a propósito). */
export const CONSENT_KEY = "site_cookie_consent";

/** Une el dominio canónico con una ruta: absUrl("/contacto"). */
export const absUrl = (path = "/") => `${SITE.url}${path}`;

export default SITE;
