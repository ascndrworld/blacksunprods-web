import type { APIRoute } from "astro";
import { cleanSrc, hasStore, isHfEvent, logFv, track } from "../../lib/countdownStats";

// Medición de la landing de venta /navidad (sendBeacon). Igual que /api/hf
// pero con un almacén por noche: "nav24" (Nochebuena) y "nav31" (Nochevieja).
export const prerender = false;

const nsOf = (n: unknown) => (String(n) === "31" ? "nav31" : "nav24");

export const POST: APIRoute = async ({ request }) => {
  let body: { e?: unknown; src?: unknown; k?: unknown; i?: unknown; v?: unknown; n?: unknown } = {};
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const ns = nsOf(body.n);

  if (body.e === "fv") {
    const n = {
      t: Date.now(),
      v: String(body.v ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 12),
      src: cleanSrc(body.src),
      k: String(body.k).slice(0, 40),
      i: String(body.i).slice(0, 300).replace(/[^\s"@]+@[^\s"@]+\.[a-z]{2,}/gi, "[correo]"),
    };
    if (hasStore()) {
      try { await logFv(n, ns); } catch (err) { console.error("[nv] Error guardando aviso:", err); }
    }
    return new Response(null, { status: 204 });
  }
  if (!isHfEvent(body.e)) return new Response(null, { status: 400 });
  if (!hasStore()) return new Response(null, { status: 204 });
  try {
    await track(body.e, cleanSrc(body.src), ns);
  } catch (err) {
    console.error("[nv] Error guardando evento:", err);
  }
  return new Response(null, { status: 204 });
};
