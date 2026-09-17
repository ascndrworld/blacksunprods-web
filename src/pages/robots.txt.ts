import type { APIRoute } from "astro";
import { absUrl } from "../config/site.mjs";

// Sin PUBLIC_INDEXABLE=true (p. ej. versión de prueba) se bloquea todo el rastreo.
const INDEXABLE = import.meta.env.PUBLIC_INDEXABLE === "true";

export const GET: APIRoute = () =>
  new Response(
    (INDEXABLE
      ? ["User-agent: *", "Allow: /", "", `Sitemap: ${absUrl("/sitemap-index.xml")}`, ""]
      : ["User-agent: *", "Disallow: /", ""]
    ).join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
