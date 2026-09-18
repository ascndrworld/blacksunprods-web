# Pendientes antes de publicar — Black Sun Prods

Lista viva de lo que falta. Tacha (o borra) cada punto al resolverlo.

## Bloqueantes (no publicar sin esto)

- [ ] **Teléfono / WhatsApp de empresa** → `src/config/site.mjs` (`phone`, `whatsapp`). Mientras siga el número de ejemplo `34600000000`, el botón de WhatsApp y el teléfono de Schema.org **no se muestran** (se activan solos al poner el número real).
- [ ] **Testimonios reales** de ayuntamientos y promotores → `src/pages/index.astro`, sección `#testimonios`. **Oculta** (`SHOW_TESTIMONIALS = false`): sustituir los 3 huecos "Pendiente" y poner `true`.
- [x] **Indexación**: la web NO se indexa por defecto (noindex + robots Disallow). En el despliegue final con dominio, poner `PUBLIC_INDEXABLE=true` en Vercel.
- [ ] **Datos legales del titular** (nombre/razón social, NIF, domicilio) en `src/pages/terminos.astro` y `src/pages/privacidad.astro`. Solo se ha cambiado el nombre de marca.
- [ ] **Resend**: verificar el dominio `blacksunprods.com` y poner `RESEND_API_KEY` (el formulario no envía sin esto).
- [x] **Proyecto nuevo en Vercel** + dominios `blacksunprods.com` y `www.blacksunprods.com` + DNS. No enlazar al proyecto de Ascndr.

## Contenido

- [ ] **Blog (oculto, no olvidar)**. Las páginas están aparcadas en `src/_ocultos/` (fuera de `src/pages`, así que no se publican). Los 5 artículos de `src/content/blog/` son de branding de Ascndr: sustituirlos por temas del sector (p. ej. "cómo organizar un Halloween municipal", "qué incluye la producción integral de unas fiestas"). Para reactivarlo: mover `src/_ocultos/blog.astro` → `src/pages/blog.astro` y `src/_ocultos/blog/` → `src/pages/blog/`, y volver a enlazar "blog" en `Header.astro` y en los footers.
- [ ] **Cambiar imágenes de portada de Halloween Fest** (pedido por Frank): la de la tarjeta de `/proyectos` y la de la caja de proyectos de la home (ahora ambas `hw3-07.webp`) → `src/pages/proyectos.astro` y `src/pages/index.astro`.
- [ ] **Bendito Castigo**: Frank enviará logo y conceptos para subirlos; también fotos/vídeos, identidad visual y fechas → `src/pages/proyectos/bendito-castigo.astro` (y quitar la tarjeta tipográfica de proyectos/home cuando haya imagen).
- [ ] **Vídeo del hero**: ahora reutiliza el vídeo de Halloween Fest que tenía la web de Ascndr. Valorar un aftermovie/reel propio de @halloweenfestlv.
- [ ] **Fotos propias para `/sonido-e-iluminacion`**: la landing de servicios técnicos reutiliza `hw3-12.webp` (la misma del hero de `/ayuntamientos`) y `hw3-04.webp`. Ideal: fotos de montaje, truss, mesa de sonido o un evento "solo técnica" (teatro, gala, entrega de premios).
- [ ] **Confirmar la nomenclatura del rider** en `src/pages/sonido-e-iluminacion.astro` (`montajes`). Transcrito de las notas de Frank, con estas interpretaciones que hay que validar: `was 16x32` → "cabezas **wash** 16×32"; `X2 T24n` → "2× T24N"; `Sub das st2 18` → "Subgrave **DAS ST-2** 18\"". En el montaje mediano las torres y los subs van sin marca porque la nota tampoco la daba.
- [x] **Mediano y grande comparten iluminación**: confirmado por Frank. Los dos llevan puente de 9 m, 6 beam 7R, 4 cabezas wash, 4 PAR LED y 4 cegadoras; entre ellos solo cambia el sonido (12.000 W vs 15.500 W). No es un error de transcripción: **no "arreglar"**.
- [ ] **Precios fuera de la web a propósito**: el montaje (550/700/850) y el transporte (3,5 €/km) NO se publican. El presupuesto se cierra caso por caso.
- [ ] **Valorar una tarjeta en "Para quién"** (`#para-quien` de la home) para teatros/empresas que solo buscan técnica; ahora solo están ayuntamientos, salas, promotores y marcas.
- [ ] **Cónclave**: retirado de la web (era trabajo de diseño de Ascndr). Si fue producción vuestra, recuperarlo del historial de git.

## Configuración

- [ ] `.env` propio con claves nuevas (Resend, Telegram, Anthropic, Airtable, GA4…). No reutilizar las de Ascndr.
- [ ] Airtable: la tabla de leads necesita los campos nuevos del formulario (ver `.env.example`).
- [ ] Analítica (GTM/GA4) y Search Console propios.
