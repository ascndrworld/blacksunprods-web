import type { APIRoute } from "astro";
import { cleanSrc, hasStore, hfNs, isHfEvent, track } from "../../lib/countdownStats";

// Recibe los eventos de la landing de venta /halloween-fest (sendBeacon).
// Mismo almacén que /api/cd, con el prefijo "hf". Serverless en Vercel.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: { e?: unknown; src?: unknown; k?: unknown; i?: unknown } = {};
  try {
    // sendBeacon manda text/plain: se parsea a mano.
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  // Avisos del iframe de Fourvenues: solo a los logs, para ver qué manda al comprar.
  if (body.e === "fv") {
    console.log("[hf] fv", cleanSrc(body.src), String(body.k).slice(0, 40), String(body.i).slice(0, 300));
    return new Response(null, { status: 204 });
  }
  if (!isHfEvent(body.e)) return new Response(null, { status: 400 });

  if (!hasStore()) {
    console.warn("[hf] Sin KV_REST_API_URL/KV_REST_API_TOKEN: evento no guardado", body.e);
    return new Response(null, { status: 204 });
  }
  try {
    await track(body.e, cleanSrc(body.src), hfNs());
  } catch (err) {
    console.error("[hf] Error guardando evento:", err);
  }
  return new Response(null, { status: 204 });
};
