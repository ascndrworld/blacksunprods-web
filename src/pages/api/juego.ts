import type { APIRoute } from "astro";
import { hasStore } from "../../lib/countdownStats";
import { cleanId, cleanNumero, estado, jugar, juegoNs, marcarEntregado, resultados } from "../../lib/juego";

// API del juego del visualizer (página /juego y panel /juego/sorteo).
export const prerender = false;

const KEY = import.meta.env.CD_STATS_KEY ?? (globalThis as any).process?.env?.CD_STATS_KEY;
const json = (data: unknown, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": cache } });

// GET: premios entregados. Lo consultan los móviles ganadores cada pocos
// segundos, así que lo sirve la CDN de Vercel y Upstash solo recibe una
// lectura cada 5 s.
export const GET: APIRoute = async ({ url }) => {
  if (!hasStore()) return json({ error: "sin-almacen" }, 503);
  const { ok } = await resultados(juegoNs(url.searchParams.has("prueba")));
  return json({ ok }, 200, "public, max-age=0, s-maxage=5, stale-while-revalidate=5");
};

// POST: {id} pide el número del móvil y si ha ganado; {key, accion} son las
// acciones del panel.
export const POST: APIRoute = async ({ request }) => {
  let body: { id?: unknown; prueba?: unknown; key?: unknown; accion?: unknown; n?: unknown; ok?: unknown } = {};
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ error: "json" }, 400);
  }
  if (!hasStore()) return json({ error: "sin-almacen" }, 503);
  const prueba = body.prueba === true;
  const ns = juegoNs(prueba);

  try {
    if (body.accion !== undefined) {
      if (!KEY || body.key !== KEY) return json({ error: "clave" }, 404);
      if (body.accion === "entregado" && cleanNumero(body.n)) {
        await marcarEntregado(ns, cleanNumero(body.n), body.ok !== false);
        return json(await resultados(ns));
      }
      if (body.accion === "ver") return json(await resultados(ns));
      return json({ error: "accion" }, 400);
    }

    const id = cleanId(body.id);
    if (!id) return json({ error: "id" }, 400);
    if (estado(prueba) !== "abierto") return json({ estado: "fuera" });
    return json({ estado: "abierto", ...(await jugar(ns, id)) });
  } catch (err) {
    console.error("[juego]", err);
    return json({ error: "almacen" }, 500);
  }
};
