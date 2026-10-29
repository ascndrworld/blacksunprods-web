// Juego del visualizer de Halloween Fest V: quien escanea el QR de la pantalla
// recibe un número de 4 cifras al azar y, al momento, sabe si ha ganado. Solo
// tienen premio los NUMEROS elegidos: de cada grupo de GRUPO escaneos, uno al azar
// recibe uno de ellos hasta repartirlos todos (las posiciones se sortean con
// el primer escaneo de la noche); al resto le sale otro número cualquiera. El
// panel /juego/sorteo solo sirve para ver los ganadores y marcar entregados.
//
// Los móviles no envían datos personales: cada uno se identifica con un id
// aleatorio que genera el propio navegador. Solo los ganadores de una entrada
// dejan su nombre, que apunta Frank en /juego/admin para contactar con ellos. Mismo Upstash que las estadísticas.
//
// Claves:  {ns}:n              contador de escaneos
//          {ns}:dev:{id}       JSON {n, premio} de ese móvil
//          {ns}:plan:g{GRUPO}  JSON {posición: [índice de NUMEROS, índice de PREMIOS]}
//                              (la clave lleva GRUPO: si cambia, se sortea un plan nuevo)
//          {ns}:usados (set)   números ya dados a los que no ganan
//          {ns}:drawn  (list)  JSON {n, premio} de los ganadores, por orden de llegada
//          {ns}:ok     (set)   números ganadores que ya han recogido el premio
//          {ns}:datos  (hash)  número → JSON {nombre, apellidos, contacto} de quien
//                              gana una entrada (lo apunta Frank en /juego/admin)
// ns = "juego5", o "juego5p-g5" con ?prueba (no se mezcla con la noche real; la prueba empieza
// de cero con los grupos de 5).

import { pipeline } from "./countdownStats";

// Solo se reparten números la noche del evento (hora de Madrid, ya en invierno).
export const OPENS = Date.parse("2026-10-31T20:00:00+01:00");
export const CLOSES = Date.parse("2026-11-01T12:00:00+01:00");

export const juegoNs = (prueba: boolean): string => (prueba ? "juego5p-g5" : "juego5");

// Un ganador al azar en cada grupo de GRUPO escaneos.
export const GRUPO = 5;

// Los únicos números con premio. A cada uno le toca un premio al azar.
export const NUMEROS = ["2104", "2506", "2412", "3112", "0211", "0111", "2009", "2704", "1803", "3110"];

// Un premio por número ganador (misma cantidad que NUMEROS).
export const PREMIOS = [
  "Una copa esta noche",
  "Una copa esta noche",
  "Una copa esta noche",
  "Una copa esta noche",
  "Una entrada para Nochebuena 2026",
  "Una entrada para Nochebuena 2026",
  "Una entrada para Nochevieja 2026",
  "Una entrada para Nochevieja 2026",
  "Una entrada para Halloween Fest 2027",
  "Una entrada para Halloween Fest 2027",
];

// Frases al recibir el número (una por móvil, siempre la misma).
export const FRASES_GANA = [
  "Has superado la prueba. Pocos llegan hasta aquí… Reclama lo que es tuyo antes de que acabe la noche.",
  "El juego te ha elegido. Tu premio te espera en la barra. No hagas esperar al juego.",
  "Has jugado… y has sobrevivido. Ve a la barra y enseña esta pantalla. Ahora.",
];
export const FRASES_GAME_OVER = [
  "Esta vez el azar no te ha elegido. Pero recuerda: el juego nunca termina del todo.",
  "Has jugado… y has perdido. Considérate afortunado: sigues aquí. Disfruta de la noche.",
  "No era tu noche para ganar. Era tu noche para sobrevivir. Vive o muere… tú eliges cómo acaba.",
];

export const cleanId = (s: unknown): string =>
  typeof s === "string" && /^[a-z0-9-]{16,64}$/i.test(s) ? s.toLowerCase() : "";

export type Estado = "fuera" | "abierto";
export const estado = (prueba: boolean, now = Date.now()): Estado =>
  prueba || (now >= OPENS && now < CLOSES) ? "abierto" : "fuera";

const azar = (max: number): number => {
  const r = new Uint32Array(1);
  crypto.getRandomValues(r);
  return r[0] % max;
};

const barajar = (n: number): number[] => {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = azar(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// Posición → [número ganador, premio]. Se sortea una sola vez (el primer
// escaneo lo guarda; si llegan dos a la vez, vale el que se guardó primero).
export async function plan(ns: string): Promise<Record<string, [number, number]>> {
  const clave = `${ns}:plan:g${GRUPO}`;
  const [prev] = await pipeline([["GET", clave]]);
  if (prev) return JSON.parse(prev);
  const nums = barajar(NUMEROS.length), premios = barajar(PREMIOS.length);
  const nuevo = Object.fromEntries(NUMEROS.map((_, g) => [g * GRUPO + 1 + azar(GRUPO), [nums[g], premios[g]]]));
  const [, guardado] = await pipeline([["SET", clave, JSON.stringify(nuevo), "NX"], ["GET", clave]]);
  return JSON.parse(guardado);
}

export type Resultado = { n: string; premio: string | null };

// Número de 4 cifras que no sea de los premiados ni se haya dado ya.
async function numeroSinPremio(ns: string): Promise<string> {
  for (;;) {
    const n = String(azar(10000)).padStart(4, "0");
    if (NUMEROS.includes(n)) continue;
    const [nuevo] = await pipeline([["SADD", `${ns}:usados`, n]]);
    if (nuevo === 1) return n;
  }
}

// Número del móvil y su premio (o null). Si ya había escaneado, lo mismo de antes.
export async function jugar(ns: string, id: string): Promise<Resultado> {
  const [[prev], p] = await Promise.all([pipeline([["GET", `${ns}:dev:${id}`]]), plan(ns)]);
  if (prev) return JSON.parse(prev);
  const [pos] = await pipeline([["INCR", `${ns}:n`]]);
  const r: Resultado = pos in p
    ? { n: NUMEROS[p[pos][0]], premio: PREMIOS[p[pos][1]] }
    : { n: await numeroSinPremio(ns), premio: null };
  const [set] = await pipeline([["SET", `${ns}:dev:${id}`, JSON.stringify(r), "NX"]]);
  // Dos peticiones a la vez del mismo móvil: vale la primera. Si la posición
  // sobrante era ganadora, ese premio se pierde (muy improbable).
  if (set !== "OK") return JSON.parse((await pipeline([["GET", `${ns}:dev:${id}`]]))[0]);
  if (r.premio) await pipeline([["RPUSH", `${ns}:drawn`, JSON.stringify(r)]]);
  return r;
}

export type Resultados = { total: number; ganadores: Resultado[]; ok: string[] };

export async function resultados(ns: string): Promise<Resultados> {
  const [total, drawn, ok] = await pipeline([
    ["GET", `${ns}:n`],
    ["LRANGE", `${ns}:drawn`, 0, -1],
    ["SMEMBERS", `${ns}:ok`],
  ]);
  return { total: Number(total ?? 0), ganadores: (drawn ?? []).map((x: string) => JSON.parse(x)), ok: ok ?? [] };
}

// Borra todos los datos de la prueba (contador, plan, móviles, ganadores y entregas).
// Nunca toca la noche real.
export async function reiniciarPrueba(): Promise<void> {
  const ns = juegoNs(true);
  let cursor = "0";
  do {
    const [[sig, claves]] = await pipeline([["SCAN", cursor, "MATCH", `${ns}:*`, "COUNT", 500]]);
    if (claves.length) await pipeline([["DEL", ...claves]]);
    cursor = sig;
  } while (cursor !== "0");
}

export const cleanNumero = (s: unknown): string => (typeof s === "string" && NUMEROS.includes(s) ? s : "");

export async function marcarEntregado(ns: string, n: string, ok: boolean): Promise<void> {
  await pipeline([[ok ? "SADD" : "SREM", `${ns}:ok`, n]]);
}

// Panel de administración (/juego/admin): los números elegidos con su premio
// (el del plan, que se sortea con el primer escaneo o al abrir el panel) y si
// ya ha salido o se ha entregado.
export type Datos = { nombre: string; apellidos: string; contacto: string };
export type Elegido = { n: string; premio: string; estado: "sin-salir" | "ganado" | "entregado"; datos?: Datos };

// Las entradas son para otras fechas: de quien las gana se apuntan sus datos.
export const esEntrada = (premio: string): boolean => premio.startsWith("Una entrada");

export async function elegidos(ns: string): Promise<Resultados & { elegidos: Elegido[] }> {
  const [p, r, [plano]] = await Promise.all([plan(ns), resultados(ns), pipeline([["HGETALL", `${ns}:datos`]])]);
  const datos: Record<string, Datos> = {};
  for (let i = 0; i < (plano ?? []).length; i += 2) datos[plano[i]] = JSON.parse(plano[i + 1]);
  const premioDe = Object.fromEntries(Object.values(p).map(([num, premio]) => [NUMEROS[num], PREMIOS[premio]]));
  const salidos = new Set(r.ganadores.map((g) => g.n));
  return {
    ...r,
    elegidos: NUMEROS.map((n) => ({
      n,
      premio: premioDe[n],
      estado: r.ok.includes(n) ? "entregado" : salidos.has(n) ? "ganado" : "sin-salir",
      datos: datos[n],
    })),
  };
}

const texto = (s: unknown, max: number): string => (typeof s === "string" ? s.trim().replace(/\s+/g, " ").slice(0, max) : "");

export const cleanDatos = (b: { nombre?: unknown; apellidos?: unknown; contacto?: unknown }): Datos | null => {
  const d = { nombre: texto(b.nombre, 60), apellidos: texto(b.apellidos, 80), contacto: texto(b.contacto, 60) };
  return d.nombre && d.apellidos ? d : null;
};

export async function guardarDatos(ns: string, n: string, d: Datos): Promise<void> {
  await pipeline([["HSET", `${ns}:datos`, n, JSON.stringify(d)]]);
}

// Sesión del administrador: la cookie guarda el hash de JUEGO_ADMIN_KEY, nunca la clave.
export const ADMIN_COOKIE = "juego_admin";
const ADMIN_KEY = import.meta.env.JUEGO_ADMIN_KEY ?? (globalThis as any).process?.env?.JUEGO_ADMIN_KEY;

const sha256 = async (s: string): Promise<string> =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`juego5:${s}`)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");

export const adminToken = async (clave: string): Promise<string> => (ADMIN_KEY && clave === ADMIN_KEY ? sha256(ADMIN_KEY) : "");

export const esAdmin = async (cookie: string | undefined): Promise<boolean> =>
  Boolean(ADMIN_KEY && cookie && cookie === (await sha256(ADMIN_KEY)));
