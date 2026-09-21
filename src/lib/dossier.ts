// ── Dossier + borrador de respuesta con Claude ─────────────────────────────
// Flujo gobernado desde Telegram (ver src/pages/api/telegram.ts):
//   1) Lead → aviso con botones (gratis).
//   2) "Investigar" → runDossier(): Claude + búsqueda web → dossier a Telegram.
//   3) "Redactar respuesta" → runReply(): Claude redacta el borrador de email.
// El gasto de API solo ocurre cuando el dueño pulsa un botón (control de coste).

import { SITE } from "../config/site.mjs";

// Contexto de marca para los prompts (sale de src/config/site.mjs).
const SERVICES = SITE.business.serviceType.join(", ");
const WHO = `${SITE.name}, ${SITE.tagline.toLowerCase()} de ${SITE.business.city} (${SITE.business.region})`;

export interface Lead {
  name: string;
  email: string;
  /**
   * Opcional en el formulario. NO se incluye en el prompt del dossier
   * (ver leadLines): un número no ayuda a investigar a un cliente en la
   * web y no hay razón para mandárselo al modelo.
   */
  phone: string;
  clientType: string; // valor del formulario: ayuntamiento, sala, promotor, marca, privado
  eventType: string;
  location: string;   // municipio o recinto
  date: string;       // fecha aproximada (texto libre)
  capacity: string;   // aforo estimado
  consulta: string;
}

// Etiquetas legibles de "¿Quién eres?" (compartidas por email, Telegram y prompts).
export const CLIENT_TYPES: Record<string, string> = {
  ayuntamiento: "Ayuntamiento / concejalía",
  sala: "Sala, pub o recinto",
  promotor: "Promotor",
  marca: "Marca o empresa",
  privado: "Privado o asociación",
};
export const clientTypeLabel = (v: string) => CLIENT_TYPES[v] || v || "";

export interface DossierConfig {
  anthropicKey?: string;
  telegramToken?: string;
  telegramChatId?: string;
}

const MODEL = "claude-sonnet-4-6";
const TG_LIMIT = 3800; // margen bajo el tope de 4096 de Telegram

export interface InlineKeyboard {
  inline_keyboard: { text: string; callback_data: string }[][];
}

// Botones reutilizables
export const BTN_DRAFT: InlineKeyboard = {
  inline_keyboard: [[{ text: "✍️ Redactar respuesta", callback_data: "draft" }]],
};

// Trocea y envía a Telegram en texto plano (sin parse_mode: robusto ante la
// salida del modelo). El reply_markup (botones) se adjunta solo al último trozo.
async function sendTelegram(
  token: string,
  chatId: string,
  text: string,
  replyMarkup?: InlineKeyboard
) {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > TG_LIMIT) {
    let cut = rest.lastIndexOf("\n", TG_LIMIT);
    if (cut < 1000) cut = TG_LIMIT;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  chunks.push(rest);

  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: chunks[i],
      disable_web_page_preview: true,
    };
    if (isLast && replyMarkup) body.reply_markup = replyMarkup;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Telegram ${res.status}: ${detail}`);
    }
  }
}

async function callClaude(key: string, prompt: string, useWebSearch: boolean): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }];
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${detail}`);
  }

  const data: any = await res.json();
  return (data.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();
}

function leadLines(lead: Lead): string[] {
  const nd = "no indicado";
  return [
    `- Nombre: ${lead.name}`,
    `- Email: ${lead.email}`,
    `- Tipo de cliente: ${clientTypeLabel(lead.clientType) || nd}`,
    `- Tipo de evento: ${lead.eventType || nd}`,
    `- Municipio o recinto: ${lead.location || nd}`,
    `- Fecha aproximada: ${lead.date || nd}`,
    `- Aforo estimado: ${lead.capacity || nd}`,
    `- Mensaje: ${lead.consulta || nd}`,
  ];
}

function dossierPrompt(lead: Lead): string {
  return [
    `Eres el asistente de ${WHO}. Producimos: ${SERVICES}.`,
    "Dirigimos el evento completo coordinando proveedores (artistas, sonido, luces, LED,",
    "seguridad, personal, ticketing, accesos). También damos SERVICIOS PARCIALES: alquilamos",
    "y operamos rider técnico de sonido y/o iluminación sin producir el evento (teatros, galas,",
    "entregas de premios, actos institucionales, eventos de empresa). Acaba de entrar este lead por el formulario",
    `de la web y ${SITE.ownerName} va a responderle. Prepárale un dossier para contextualizar.`,
    "",
    ...leadLines(lead),
    "",
    "Investiga con BÚSQUEDA WEB únicamente información PÚBLICA y PROFESIONAL. Pistas:",
    "- Si es un AYUNTAMIENTO: población, fiestas y eventos del calendario, concejalía",
    "  responsable (fiestas, cultura, juventud), eventos de años anteriores y quién los",
    "  produjo, y contratos o licitaciones públicas de eventos si aparecen.",
    "- Si es SALA, RECINTO o PROMOTOR: aforo, tipo de programación, estilo musical,",
    "  público, redes sociales y eventos recientes.",
    "- Si es MARCA o EMPRESA: sector, público, acciones o eventos que hayan hecho.",
    "Deduce la entidad por el dominio del email si no es genérico (gmail, hotmail…).",
    "No inventes: si algo no se encuentra, dilo claramente. No incluyas datos personales",
    "sensibles ni especulaciones intrusivas sobre la persona.",
    "",
    "Devuelve un dossier BREVE en español, en TEXTO PLANO (sin markdown ni asteriscos),",
    "con estas secciones (una o dos líneas cada una, incluye enlaces cuando los tengas):",
    "QUIÉN ES",
    "CONTEXTO (municipio / recinto / marca)",
    "QUÉ QUIERE",
    "ENCAJE CON NUESTROS FORMATOS",
    "ÁNGULO DE RESPUESTA",
    "Máximo unas 250 palabras. Sé concreto y accionable.",
  ].join("\n");
}

function replyPrompt(name: string, dossier: string): string {
  return [
    `Eres ${SITE.ownerName}, de ${WHO} (${SERVICES}).`,
    "Vas a responder por email a un lead que escribió por el formulario de la web.",
    "Tienes este dossier de investigación previa:",
    "",
    "----- DOSSIER -----",
    dossier,
    "-------------------",
    "",
    "Redacta un BORRADOR de respuesta en español, cercano pero profesional, listo para",
    "enviar (TEXTO PLANO, sin markdown). Estructura:",
    `- Saludo personal a ${name}.`,
    "- Muestra natural de que entiendes su evento y su contexto (sin parecer que le has espiado).",
    "- Una primera idea de cómo plantearíamos el evento: formato, experiencia para el público",
    "  y qué nos encargaríamos de coordinar (artistas, técnica, seguridad, accesos…).",
    "- OJO: si lo que pide es SOLO técnica (sonido y/o iluminación, alquiler de rider) y no el",
    "  evento entero, no le vendas producción integral: céntrate en el rider, el montaje y la",
    "  operación, y pregunta por espacio, aforo y si ya tiene rider escrito.",
    "- Si faltan datos clave (fecha, aforo, espacio, presupuesto orientativo), pídelos en",
    "  2 o 3 preguntas concretas.",
    "- Propuesta de siguiente paso: una llamada breve o preparar una propuesta.",
    `- Cierre y firma SOLO como '${SITE.ownerName}' (o '${SITE.ownerName} · ${SITE.name}'). NO inventes email,`,
    "  teléfono, web, precios ni ningún dato de contacto.",
    "No prometas nada que no esté confirmado. Tono humano, nada robótico. Máximo unas 280 palabras.",
  ].join("\n");
}

// 2) Genera el dossier (con búsqueda web) y lo envía a Telegram con el botón
//    "Redactar respuesta". No lanza: registra errores y avisa por Telegram.
export async function runDossier(lead: Lead, cfg: DossierConfig): Promise<void> {
  if (!cfg.telegramToken || !cfg.telegramChatId) return;
  if (!cfg.anthropicKey) {
    console.warn("Dossier omitido: falta ANTHROPIC_API_KEY.");
    return;
  }
  try {
    const dossier = await callClaude(cfg.anthropicKey, dossierPrompt(lead), true);
    const message = `🔎 DOSSIER · ${lead.name}\n\n${dossier || "(Sin contenido)"}`;
    await sendTelegram(cfg.telegramToken, cfg.telegramChatId, message, BTN_DRAFT);
  } catch (err) {
    console.error("Error generando/enviando el dossier:", err);
    try {
      await sendTelegram(
        cfg.telegramToken,
        cfg.telegramChatId,
        `⚠️ No se pudo generar el dossier de ${lead.name}.`
      );
    } catch { /* best-effort */ }
  }
}

// 3) Redacta el borrador de respuesta a partir del dossier y lo envía a Telegram.
export async function runReply(name: string, dossier: string, cfg: DossierConfig): Promise<void> {
  if (!cfg.telegramToken || !cfg.telegramChatId) return;
  if (!cfg.anthropicKey) {
    console.warn("Borrador omitido: falta ANTHROPIC_API_KEY.");
    return;
  }
  try {
    const draft = await callClaude(cfg.anthropicKey, replyPrompt(name, dossier), false);
    const message = `✍️ BORRADOR DE RESPUESTA · ${name}\n\n${draft || "(Sin contenido)"}`;
    await sendTelegram(cfg.telegramToken, cfg.telegramChatId, message);
  } catch (err) {
    console.error("Error generando/enviando el borrador:", err);
    try {
      await sendTelegram(
        cfg.telegramToken,
        cfg.telegramChatId,
        `⚠️ No se pudo generar el borrador de respuesta de ${name}.`
      );
    } catch { /* best-effort */ }
  }
}
