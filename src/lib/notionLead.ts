import { clientTypeLabel, type Lead } from "./dossier";

// Alta de cada lead del formulario en Notion → «🤝 Clientes y oportunidades»
// (el centro de mando de Frank). Entra con Fase «Por contactar» y
// «Próximo contacto» = hoy, así aparece en la vista «Toca escribir» y en el
// resumen de los lunes hasta que alguien lo mueva.
//
// Necesita en Vercel:
//   NOTION_TOKEN           secreto de una integración interna de Notion
//                          (con acceso a la página «Black Sun Prods · Centro de mando»)
//   NOTION_CLIENTES_DS     opcional: id del data source; por defecto el de Clientes

const env = (k: string): string | undefined =>
  (import.meta.env as any)[k] ?? (globalThis as any).process?.env?.[k];

const DEFAULT_DS = "41d7010e-f02b-81bd-af26-000b0d0e3e7f";

// «¿Quién eres?» del formulario → opción de «Tipo» en Notion.
const TIPO: Record<string, string> = {
  ayuntamiento: "Ayuntamiento",
  sala: "Sala / discoteca",
  promotor: "Promotor",
  marca: "Empresa",
  privado: "Boda / privado",
  artista: "Artista",
};

const ZONAS = ["Los Villares", "Jaén", "Granada", "Córdoba", "Málaga", "Sevilla", "Almería", "Cádiz", "Huelva"];
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Solo pone «Zona» si el municipio escrito nombra una de las opciones; si no,
// el municipio queda igual en el texto de la ficha.
function zona(location: string): string | null {
  const l = fold(location);
  return ZONAS.find((z) => l.includes(fold(z))) ?? null;
}

const text = (s: string) => [{ type: "text", text: { content: s.slice(0, 1900) } }];
const para = (s: string) => ({ object: "block", type: "paragraph", paragraph: { rich_text: text(s) } });

function hoyMadrid(): string {
  // AAAA-MM-DD en hora de España (en Vercel el reloj va en UTC).
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

/** Nunca lanza: si falla, avisa por consola y devuelve null (el email ya salió). */
export async function createNotionLead(lead: Lead): Promise<string | null> {
  const token = env("NOTION_TOKEN");
  const ds = env("NOTION_CLIENTES_DS") || DEFAULT_DS;
  if (!token) {
    console.warn("Notion sin configurar (falta NOTION_TOKEN).");
    return null;
  }

  const artist = lead.clientType === "artista";
  const nd = "—";
  const resumen = artist
    ? [
        `Propuesta de artista por la web`,
        lead.artistName && `Nombre artístico: ${lead.artistName}`,
        `Qué son: ${lead.eventType || nd}`,
        `Qué buscan: ${lead.goal || nd}`,
        `Estilo: ${lead.style || nd}`,
        `Desde dónde: ${lead.location || nd}`,
        lead.links && `Enlaces: ${lead.links}`,
      ]
    : [
        `Contacto por la web · ${clientTypeLabel(lead.clientType) || "sin tipo"}`,
        `Evento: ${lead.eventType || nd}`,
        `Municipio o recinto: ${lead.location || nd}`,
        `Fecha aproximada: ${lead.date || nd}`,
        `Aforo: ${lead.capacity || nd}`,
      ];
  const queHablamos = [...resumen.filter(Boolean), "", `Mensaje: ${lead.consulta || "sin mensaje"}`].join("\n");

  const properties: Record<string, unknown> = {
    Nombre: { title: text(artist && lead.artistName ? `${lead.artistName} (${lead.name})` : lead.name) },
    Email: { email: lead.email },
    Contacto: { rich_text: text(lead.name) },
    Fase: { status: { name: "Por contactar" } },
    "Próximo contacto": { date: { start: hoyMadrid() } },
    Origen: { select: { name: "Formulario web" } },
    "Qué hablamos": { rich_text: text(queHablamos) },
  };
  if (lead.phone) properties["Teléfono"] = { phone_number: lead.phone };
  const tipo = TIPO[lead.clientType];
  if (tipo) properties.Tipo = { select: { name: tipo } };
  const z = zona(lead.location);
  if (z) properties.Zona = { select: { name: z } };

  const children = [
    para(`Entró por el formulario web el ${new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}.`),
    ...queHablamos.split("\n\n").map(para),
    para(`Responder: ${lead.email}${lead.phone ? ` · ${lead.phone}` : ""}`),
  ];

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2025-09-03",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { type: "data_source_id", data_source_id: ds },
        icon: { type: "emoji", emoji: artist ? "🎤" : "📩" },
        properties,
        children,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(`Lead no registrado en Notion — ${res.status}: ${detail}`);
      return null;
    }
    const data: any = await res.json();
    return data?.url ?? data?.id ?? null;
  } catch (err) {
    console.warn("Lead no registrado en Notion:", err);
    return null;
  }
}
