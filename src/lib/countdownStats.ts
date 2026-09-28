// Contadores de la landing /countdown (Halloween Fest V) en Upstash Redis.
//
// Sin cookies ni datos personales: solo se suman totales por día, evento y
// origen, así que no hace falta consentimiento. Se habla con la API REST de
// Upstash con fetch (sin dependencias).
//
// Claves:  cd:day:YYYY-MM-DD  (hash)  campo "evento:origen" → contador
//          cd:days            (set)   días con datos

const env = (k: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)[k] ??
  (globalThis as any).process?.env?.[k];

// La integración de Upstash en Vercel crea KV_REST_API_*; se aceptan también
// los nombres propios de Upstash por si se conecta a mano.
const URL_ = env("KV_REST_API_URL") ?? env("UPSTASH_REDIS_REST_URL");
const TOKEN = env("KV_REST_API_TOKEN") ?? env("UPSTASH_REDIS_REST_TOKEN");

export const EVENTS = {
  view: "Visitas",
  eject: "Clics en EJECT (ir a la web)",
  zero: "Vieron llegar el cero en directo",
} as const;
export type CdEvent = keyof typeof EVENTS;

export const isEvent = (e: unknown): e is CdEvent =>
  typeof e === "string" && Object.hasOwn(EVENTS, e);

// Origen: "qr" lo pone la redirección de halloweenfest.blacksunprods.com
// (vercel.json). Cualquier otro valor se limpia; sin él, "directo".
export const cleanSrc = (s: unknown): string => {
  const v = typeof s === "string" ? s.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24) : "";
  return v || "directo";
};

// Día natural en Madrid, que es cuando se escanea el QR.
export const madridDay = (d = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(d);

export const hasStore = (): boolean => Boolean(URL_ && TOKEN);

async function pipeline(cmds: (string | number)[][]): Promise<any[]> {
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  return (await res.json()).map((r: { result?: unknown; error?: string }) => {
    if (r.error) throw new Error(`Upstash: ${r.error}`);
    return r.result;
  });
}

export async function track(event: CdEvent, src: string): Promise<void> {
  const day = madridDay();
  await pipeline([
    ["HINCRBY", `cd:day:${day}`, `${event}:${src}`, 1],
    ["SADD", "cd:days", day],
  ]);
}

export type DayStats = { day: string; counts: Record<string, number> };

// Todos los días con datos, del más reciente al más antiguo.
export async function readAll(): Promise<DayStats[]> {
  const [days] = (await pipeline([["SMEMBERS", "cd:days"]])) as string[][];
  if (!days?.length) return [];
  days.sort().reverse();
  const hashes = await pipeline(days.map((d) => ["HGETALL", `cd:day:${d}`]));
  return days.map((day, i) => {
    const flat: string[] = hashes[i] ?? [];
    const counts: Record<string, number> = {};
    for (let j = 0; j < flat.length; j += 2) counts[flat[j]] = Number(flat[j + 1]);
    return { day, counts };
  });
}
