import type { APIRoute } from "astro";
import { absUrl } from "../config/site.mjs";

export const GET: APIRoute = () =>
  new Response(
    ["User-agent: *", "Allow: /", "", `Sitemap: ${absUrl("/sitemap-index.xml")}`, ""].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
