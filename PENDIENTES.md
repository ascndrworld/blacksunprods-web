# Pendientes antes de publicar — Black Sun Prods

Lista viva de lo que falta. Tacha (o borra) cada punto al resolverlo.

## Bloqueantes (no publicar sin esto)

- [ ] **Teléfono / WhatsApp de empresa** → `src/config/site.mjs` (`phone`, `whatsapp`). Ahora es el número de ejemplo `34600000000` y el botón de WhatsApp del footer apunta ahí.
- [ ] **Testimonios reales** de ayuntamientos y promotores → `src/pages/index.astro`, sección `#testimonios`. Hoy son 3 huecos marcados como "Pendiente" y **se ven en la web**.
- [ ] **Datos legales del titular** (nombre/razón social, NIF, domicilio) en `src/pages/terminos.astro` y `src/pages/privacidad.astro`. Solo se ha cambiado el nombre de marca.
- [ ] **Resend**: verificar el dominio `blacksunprods.com` y poner `RESEND_API_KEY` (el formulario no envía sin esto).
- [ ] **Proyecto nuevo en Vercel** + dominios `blacksunprods.com` y `www.blacksunprods.com` + DNS. No enlazar al proyecto de Ascndr.

## Contenido

- [ ] **Blog (oculto, no olvidar)**. Las páginas están aparcadas en `src/_ocultos/` (fuera de `src/pages`, así que no se publican). Los 5 artículos de `src/content/blog/` son de branding de Ascndr: sustituirlos por temas del sector (p. ej. "cómo organizar un Halloween municipal", "qué incluye la producción integral de unas fiestas"). Para reactivarlo: mover `src/_ocultos/blog.astro` → `src/pages/blog.astro` y `src/_ocultos/blog/` → `src/pages/blog/`, y volver a enlazar "blog" en `Header.astro` y en los footers.
- [ ] **Bendito Castigo**: fotos/vídeos, identidad visual y fechas → `src/pages/proyectos/bendito-castigo.astro` (y quitar la tarjeta tipográfica de proyectos/home cuando haya imagen).
- [ ] **Vídeo del hero**: ahora reutiliza el vídeo de Halloween Fest que tenía la web de Ascndr. Valorar un aftermovie/reel propio de @halloweenfestlv.
- [ ] **Cónclave**: retirado de la web (era trabajo de diseño de Ascndr). Si fue producción vuestra, recuperarlo del historial de git.

## Configuración

- [ ] `.env` propio con claves nuevas (Resend, Telegram, Anthropic, Airtable, GA4…). No reutilizar las de Ascndr.
- [ ] Airtable: la tabla de leads necesita los campos nuevos del formulario (ver `.env.example`).
- [ ] Analítica (GTM/GA4) y Search Console propios.
