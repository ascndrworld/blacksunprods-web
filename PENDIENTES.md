# Pendientes antes de publicar — Black Sun Prods

Lista viva de lo que falta. Tacha (o borra) cada punto al resolverlo.

## Bloqueantes (no publicar sin esto)

- [ ] **Teléfono / WhatsApp de empresa** → `src/config/site.mjs` (`phone`, `whatsapp`). Mientras siga el número de ejemplo `34600000000`, el botón de WhatsApp y el teléfono de Schema.org **no se muestran** (se activan solos al poner el número real).
- [ ] **Testimonios reales** de ayuntamientos y promotores → `src/pages/index.astro`, sección `#testimonios`. **Oculta** (`SHOW_TESTIMONIALS = false`): sustituir los 3 huecos "Pendiente" y poner `true`.
- [x] **Indexación**: la web NO se indexa por defecto (noindex + robots Disallow). En el despliegue final con dominio, poner `PUBLIC_INDEXABLE=true` en Vercel.
- [ ] **Datos legales del titular** (nombre/razón social, NIF, domicilio) en `src/pages/terminos.astro` y `src/pages/privacidad.astro`. Solo se ha cambiado el nombre de marca.
- [x] **Resend** (20/09/2026): dominio `blacksunprods.com` verificado (DKIM `resend._domainkey` + `send` como CNAME a `send.forge.rmta.net`, que aporta SPF y MX de rebotes) y `RESEND_API_KEY` puesta en Vercel. Probado en producción: el formulario devuelve 200 y Resend acepta los dos emails.
- [ ] **El aviso al dueño no llega a `info@blacksunprods.com`** (la auto-respuesta al cliente sí). El aviso se manda de `info@` a `info@`: revisar en Resend → Emails si sale como *Delivered* o *Bounced*, y si existe el buzón en Hostinger. Si es el patrón auto-enviado, cambiar el `from` del aviso en `src/pages/api/contacto.ts` (`FROM_NOTIFY`) a otro buzón del dominio.
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
- [ ] Airtable: la tabla de leads necesita los campos nuevos del formulario (ver `.env.example`). **Las tres variables existen en Vercel pero la función avisa de que están sin configurar** (probablemente creadas vacías): el lead de prueba del 20/09/2026 no se registró.
- [ ] Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` y `TELEGRAM_WEBHOOK_SECRET` no existen en Vercel, así que no hay aviso instantáneo ni botón de dossier. Ojo: `TELEGRAM_CHAT_ID` se compara con `cq.from.id`, o sea que tiene que ser tu ID de usuario, no el de un grupo.
- [x] Analítica y Search Console propios (19/09/2026):
  - GA4 propio de Black Sun Prods (`G-Y98ESLJ2CQ`) cargado directamente desde la web (`PUBLIC_GA4_ID`). Comprobado en Tiempo real. **No añadirlo también en GTM** (duplicaría las visitas).
  - GTM (`GTM-M93M6G6C`) instalado pero con el contenedor vacío: listo para Meta Pixel u otras etiquetas.
  - Search Console: propiedad de dominio verificada por DNS (Hostinger) y sitemap `https://www.blacksunprods.com/sitemap-index.xml` enviado. La home ya está indexada.
- [ ] Search Console: indexación solicitada el 19/09/2026 para ayuntamientos, sonido-e-iluminacion, proyectos, halloween-fest, conclave-x-la-caseta, bendito-castigo y contacto. Revisar hacia el 03/10/2026 el informe "Páginas".
- [ ] `PUBLIC_META_PIXEL_ID` y `PUBLIC_GSC_VERIFICATION` en Vercel están vacías: rellenar el píxel solo si se hacen anuncios en Meta; la de GSC no hace falta (verificado por DNS).
