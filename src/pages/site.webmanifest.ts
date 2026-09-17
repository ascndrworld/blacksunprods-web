import type { APIRoute } from "astro";
import { SITE } from "../config/site.mjs";

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: SITE.name,
        short_name: SITE.name,
        description: SITE.tagline,
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: SITE.backgroundColor,
        theme_color: SITE.themeColor,
        icons: [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        ],
      },
      null,
      2
    ),
    { headers: { "Content-Type": "application/manifest+json" } }
  );
