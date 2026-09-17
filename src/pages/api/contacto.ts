import type { APIRoute } from "astro";
import { SITE as BRAND, absUrl } from "../../config/site.mjs";
import { clientTypeLabel, type Lead } from "../../lib/dossier";

// Endpoint bajo demanda (serverless en Vercel); el resto del sitio sigue estático.
export const prerender = false;

// ── Config de remitentes/destinatario (sale de src/config/site.mjs) ──
const OWNER_EMAIL = BRAND.email;                         // a quién le llega el aviso
const FROM_NOTIFY = `Web ${BRAND.name} <${BRAND.email}>`; // remitente del aviso
const FROM_REPLY  = `${BRAND.name} <${BRAND.email}>`;     // remitente de la auto-respuesta

// ── Marca (para el diseño de los emails) ──
const SITE = BRAND.url;
const BAND = absUrl(BRAND.emailBanner); // logo sobre banda (imagen: Gmail no la recolorea)
const IG   = BRAND.instagram;
const IG_LABEL = IG.replace(/^https?:\/\/(www\.)?/, "");

const RESEND_API_KEY =
  import.meta.env.RESEND_API_KEY ??
  (globalThis as any).process?.env?.RESEND_API_KEY;

// ── Telegram (aviso instantáneo de nuevo lead) ──
const TELEGRAM_BOT_TOKEN =
  import.meta.env.TELEGRAM_BOT_TOKEN ??
  (globalThis as any).process?.env?.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID =
  import.meta.env.TELEGRAM_CHAT_ID ??
  (globalThis as any).process?.env?.TELEGRAM_CHAT_ID;

// ── Airtable (CRM: cada lead queda registrado como fila) ──
const AIRTABLE_TOKEN =
  import.meta.env.AIRTABLE_TOKEN ??
  (globalThis as any).process?.env?.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID =
  import.meta.env.AIRTABLE_BASE_ID ??
  (globalThis as any).process?.env?.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE =
  import.meta.env.AIRTABLE_TABLE ??
  (globalThis as any).process?.env?.AIRTABLE_TABLE;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function esc(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// "Plantilla" base de los emails: cabecera (banda con logo, imagen) + cuerpo claro + pie.
// El cuerpo es claro a propósito: Gmail recolorea fondos pero NO imágenes, así que la
// banda negra con el logo crema se ve siempre bien, y el resto sobrevive al modo oscuro.
function shell(body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
</head>
<body style="margin:0;padding:0;background-color:#e7e2d4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#e7e2d4" style="background-color:#e7e2d4;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid rgba(0,0,0,0.08);">
        <tr><td style="padding:0;font-size:0;line-height:0;">
          <img src="${BAND}" alt="${BRAND.name}" width="600" style="display:block;border:0;width:100%;max-width:600px;height:auto;">
        </td></tr>
        <tr><td style="padding:40px;font-family:Montserrat,Helvetica,Arial,sans-serif;color:#141414;">
          ${body}
        </td></tr>
        <tr><td align="center" style="padding:26px 40px;border-top:1px solid rgba(0,0,0,0.08);font-family:Montserrat,Helvetica,Arial,sans-serif;text-align:center;">
          <p style="margin:0;font-size:12px;line-height:1.7;letter-spacing:0.03em;color:#8a857a;text-align:center;">
            ${BRAND.name} · ${BRAND.tagline}<br>
            <a href="${SITE}" style="color:#5a564e;text-decoration:none;">${BRAND.domainLabel}</a>
            &nbsp;·&nbsp;
            <a href="${IG}" style="color:#5a564e;text-decoration:none;">Instagram</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function field(label: string, value: string) {
  return `<tr><td style="padding:0 0 20px;">
    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#9a948a;margin:0 0 4px;">${label}</div>
    <div style="font-size:16px;line-height:1.5;color:#141414;">${value}</div>
  </td></tr>`;
}

const BTN = "display:inline-block;background:#000000;color:#F7EFDB;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 30px;";

async function sendEmail(payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
  return res.json();
}

// Envía un mensaje al chat de Telegram del dueño (parse_mode HTML; escapa el
// contenido con esc()). replyMarkup opcional = botones inline (aprobar/descartar).
async function sendTelegram(text: string, replyMarkup?: unknown) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram sin configurar (faltan TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).");
    return;
  }
  const body: Record<string, unknown> = {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Telegram ${res.status}: ${detail}`);
  }
  return res.json();
}

// Registra el lead en Airtable (CRM). Nunca lanza: si algo falla (config
// ausente, API caída, campo inexistente) avisa por consola y devuelve null,
// para no romper la respuesta al usuario. Devuelve el id del registro creado
// ("rec…") por si más adelante se quiere actualizar su Estado.
async function createLead(lead: Lead): Promise<string | null> {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE) {
    console.warn(
      "Airtable sin configurar (faltan AIRTABLE_TOKEN / AIRTABLE_BASE_ID / AIRTABLE_TABLE)."
    );
    return null;
  }

  try {
    // El nombre de la tabla puede llevar espacios o acentos: hay que escaparlo.
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Nombre: lead.name,
          Email: lead.email,
          "Tipo de cliente": clientTypeLabel(lead.clientType),
          "Tipo de evento": lead.eventType,
          "Municipio/Recinto": lead.location,
          Fecha: lead.date,
          Aforo: lead.capacity,
          Consulta: lead.consulta,
          Estado: "Nuevo",
          Fuente: "Web",
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(`Lead no registrado en Airtable — ${res.status}: ${detail}`);
      return null;
    }

    const data: any = await res.json();
    return data?.id ?? null;
  } catch (err) {
    console.warn("Lead no registrado en Airtable:", err);
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!RESEND_API_KEY) {
    console.error("Falta RESEND_API_KEY en el entorno.");
    return json(500, { error: "config" });
  }

  let data: any;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: "Petición inválida." });
  }

  const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
  const lead: Lead = {
    name: str(data.name),
    email: str(data.email),
    clientType: str(data.clientType, 40),
    eventType: str(data.eventType),
    location: str(data.location),
    date: str(data.date),
    capacity: str(data.capacity, 40),
    consulta: str(data.consulta, 600),
  };
  const { name, email, consulta } = lead;
  const tipo = clientTypeLabel(lead.clientType);
  const website = data.website || ""; // honeypot

  // Bot: fingimos éxito y no enviamos nada
  if (website) return json(200, { ok: true });

  if (!name || !email) return json(400, { error: "Completa al menos nombre y email." });
  if (!isValidEmail(email)) return json(400, { error: "Revisa el formato del email." });

  const notifyHtml = shell(`
    <div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#9a948a;margin:0 0 8px;">Nuevo contacto</div>
    <h1 style="margin:0 0 30px;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#141414;">Tienes un mensaje nuevo</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${field("Nombre", esc(name))}
      ${field("Email", `<a href="mailto:${esc(email)}" style="color:#141414;text-decoration:underline;">${esc(email)}</a>`)}
      ${field("Quién es", esc(tipo) || "No indicado")}
      ${field("Tipo de evento", esc(lead.eventType) || "No indicado")}
      ${field("Municipio o recinto", esc(lead.location) || "No indicado")}
      ${field("Fecha aproximada", esc(lead.date) || "No indicada")}
      ${field("Aforo estimado", esc(lead.capacity) || "No indicado")}
      ${field("Mensaje", esc(consulta).replace(/\n/g, "<br>") || "Sin mensaje")}
    </table>
    <a href="mailto:${esc(email)}" style="${BTN}margin-top:10px;">Responder a ${esc(name)}</a>`);

  const autoHtml = shell(`
    <h1 style="margin:0 0 22px;font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#141414;">Gracias, ${esc(name)}</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#4a4744;">Hemos recibido tu mensaje y lo estamos revisando. Te responderemos personalmente en <strong style="color:#141414;">menos de 24 horas</strong>.</p>
    <p style="margin:30px 0 0;font-size:15px;line-height:1.6;color:#4a4744;">Un saludo,<br><strong style="color:#141414;">${BRAND.ownerName}</strong></p>`);

  // Versiones en texto plano (alternativa al HTML: mejora entregabilidad y accesibilidad).
  const notifyText = [
    "NUEVO CONTACTO",
    "",
    "Tienes un mensaje nuevo.",
    "",
    `Nombre: ${name}`,
    `Email: ${email}`,
    `Quién es: ${tipo || "No indicado"}`,
    `Tipo de evento: ${lead.eventType || "No indicado"}`,
    `Municipio o recinto: ${lead.location || "No indicado"}`,
    `Fecha aproximada: ${lead.date || "No indicada"}`,
    `Aforo estimado: ${lead.capacity || "No indicado"}`,
    `Mensaje: ${consulta || "Sin mensaje"}`,
    "",
    `Responder: ${email}`,
    "",
    "—",
    `${BRAND.name} · ${BRAND.tagline}`,
    `${BRAND.domainLabel} · ${IG_LABEL}`,
  ].join("\n");

  const autoText = [
    `Gracias, ${name}`,
    "",
    "Hemos recibido tu mensaje y lo estamos revisando. Te responderemos personalmente en menos de 24 horas.",
    "",
    "Un saludo,",
    BRAND.ownerName,
    "",
    "—",
    `${BRAND.name} · ${BRAND.tagline}`,
    `${BRAND.domainLabel} · ${IG_LABEL}`,
  ].join("\n");

  // 1) Aviso a ti (obligatorio) — responder va directo al cliente
  try {
    await sendEmail({
      from: FROM_NOTIFY,
      to: [OWNER_EMAIL],
      reply_to: email,
      subject: `Nuevo contacto: ${name}${tipo ? ` · ${tipo}` : ""}`,
      html: notifyHtml,
      text: notifyText,
    });
  } catch (err) {
    console.error("Error enviando aviso:", err);
    return json(502, { error: "No hemos podido enviar el mensaje." });
  }

  // 2) Auto-respuesta al cliente (no bloquea: si falla, el aviso ya salió)
  try {
    await sendEmail({
      from: FROM_REPLY,
      to: [email],
      reply_to: OWNER_EMAIL,
      subject: "Hemos recibido tu mensaje ✦",
      html: autoHtml,
      text: autoText,
    });
  } catch (err) {
    console.warn("Auto-respuesta no enviada:", err);
  }

  // 3) Alta en el CRM (Airtable). Se lanza aquí sin await para que viaje en
  //    paralelo al aviso de Telegram; createLead() no lanza nunca, así que la
  //    promesa es segura mientras está en vuelo.
  const leadRecord = createLead(lead);

  // 4) Aviso instantáneo a Telegram (no bloquea: si falla, el email ya salió)
  const tgText = [
    "📩 <b>Nuevo cliente</b> · formulario web",
    "",
    `👤 <b>${esc(name)}</b>`,
    `✉️ ${esc(email)}`,
    `🏢 ${esc(tipo) || "—"}`,
    `🎪 ${esc(lead.eventType) || "—"}`,
    `📍 ${esc(lead.location) || "—"}`,
    `📅 ${esc(lead.date) || "—"}`,
    `👥 ${esc(lead.capacity) || "—"}`,
    "",
    "📝 <b>Consulta</b>",
    esc(consulta) || "Sin mensaje",
  ].join("\n");
  // Botones: el dossier (que cuesta API) NO se lanza solo. Tú decides desde Telegram.
  const tgButtons = {
    inline_keyboard: [[
      { text: "🔎 Investigar", callback_data: "dossier" },
      { text: "✖️ Descartar", callback_data: "dismiss" },
    ]],
  };
  try {
    await sendTelegram(tgText, tgButtons);
  } catch (err) {
    console.warn("Aviso Telegram no enviado:", err);
  }

  // Recogemos el id del registro de Airtable (null si no se pudo crear). No se
  // expone al cliente: queda disponible en el servidor para usos posteriores.
  const leadId = await leadRecord;
  if (leadId) console.log(`Lead registrado en Airtable: ${leadId}`);

  return json(200, { ok: true });
};
