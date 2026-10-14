import type { APIRoute } from "astro";
import { cleanSrc, hasStore, hfNs, isHfEvent, logFv, track } from "../../lib/countdownStats";

// Recibe los eventos de la landing de venta /halloween-fest (sendBeacon).
// Mismo almacén que /api/cd, con el prefijo "hf". Serverless en Vercel.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: { e?: unknown; src?: unknown; k?: unknown; i?: unknown; v?: unknown } = {};
  try {
    // sendBeacon manda text/plain: se parsea a mano.
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  // Avisos del iframe de Fourvenues: a los logs y a Upstash (los logs duran
  // poco), para ver qué manda al comprar. Se tapan los correos por si acaso.
  if (body.e === "fv") {
    const n = {
      t: Date.now(),
      v: String(body.v ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 12),
      src: cleanSrc(body.src),
      k: String(body.k).slice(0, 40),
      i: String(body.i).slice(0, 300).replace(/[^\s"@]+@[^\s"@]+\.[a-z]{2,}/gi, "[correo]"),
    };
    console.log("[hf] fv", n.src, n.k, n.i);
    if (hasStore()) {
      try { await logFv(n); } catch (err) { console.error("[hf] Error guardando aviso:", err); }
    }
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
