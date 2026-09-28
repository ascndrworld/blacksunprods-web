import type { APIRoute } from "astro";
import { cleanSrc, hasStore, isEvent, track } from "../../lib/countdownStats";

// Recibe los eventos de la landing /countdown (sendBeacon). Serverless en Vercel.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: { e?: unknown; src?: unknown } = {};
  try {
    // sendBeacon manda text/plain: se parsea a mano.
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!isEvent(body.e)) return new Response(null, { status: 400 });

  if (!hasStore()) {
    console.warn("[cd] Sin KV_REST_API_URL/KV_REST_API_TOKEN: evento no guardado", body.e);
    return new Response(null, { status: 204 });
  }
  try {
    await track(body.e, cleanSrc(body.src));
  } catch (err) {
    console.error("[cd] Error guardando evento:", err);
  }
  return new Response(null, { status: 204 });
};
