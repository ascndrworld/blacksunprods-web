#!/usr/bin/env node
/*
 * ga-report.mjs — Informe de tráfico de GA4 desde la línea de comandos.
 *
 * Consulta la Google Analytics Data API (GA4) con una cuenta de servicio
 * y saca un resumen legible: totales, tendencia diaria, fuentes de tráfico,
 * páginas más vistas, países, dispositivos y eventos clave (p. ej. envíos
 * del formulario de contacto).
 *
 * Uso:
 *   npm run report:ga                 # últimos 28 días
 *   npm run report:ga -- --days 7     # últimos 7 días
 *   npm run report:ga -- --days 90    # últimos 90 días
 *   npm run report:ga -- --json       # salida JSON (para pipes/otros scripts)
 *
 * Requiere en .env:
 *   GA4_PROPERTY_ID                 (ID numérico de la propiedad)
 *   GOOGLE_APPLICATION_CREDENTIALS  (ruta al JSON de la cuenta de servicio)
 */

import { readFileSync } from "node:fs";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// ── Cargar .env sin dependencias externas ────────────────────────────
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch { /* sin .env: se usan variables del entorno del sistema */ }

// ── Argumentos ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const daysArg = args[args.indexOf("--days") + 1];
const DAYS = args.includes("--days") && /^\d+$/.test(daysArg) ? Number(daysArg) : 28;

const PROPERTY_ID = process.env.GA4_PROPERTY_ID?.trim();
const CREDS = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

if (!PROPERTY_ID) {
  console.error("✗ Falta GA4_PROPERTY_ID en .env (ID NUMÉRICO de la propiedad, no el G-XXXX).");
  process.exit(1);
}
if (!CREDS) {
  console.error("✗ Falta GOOGLE_APPLICATION_CREDENTIALS en .env (ruta al JSON de la cuenta de servicio).");
  process.exit(1);
}

const client = new BetaAnalyticsDataClient();
const property = `properties/${PROPERTY_ID}`;
const dateRange = { startDate: `${DAYS}daysAgo`, endDate: "today" };

// ── Helpers ──────────────────────────────────────────────────────────
const num = (v) => Number(v ?? 0);
const fmt = (n) => new Intl.NumberFormat("es-ES").format(n);
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const secs = (s) => {
  const t = Math.round(num(s));
  const m = Math.floor(t / 60);
  return m > 0 ? `${m}m ${t % 60}s` : `${t}s`;
};

async function runReport(config) {
  const [res] = await client.runReport({ property, dateRanges: [dateRange], ...config });
  return res;
}

function rows(res) {
  return (res.rows ?? []).map((r) => ({
    dims: (r.dimensionValues ?? []).map((d) => d.value),
    mets: (r.metricValues ?? []).map((m) => m.value),
  }));
}

// ── Consultas ────────────────────────────────────────────────────────
async function main() {
  const [totals, byDay, sources, pages, countries, devices, events] = await Promise.all([
    runReport({
      metrics: [
        { name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" },
        { name: "screenPageViews" }, { name: "averageSessionDuration" },
        { name: "bounceRate" }, { name: "engagementRate" },
      ],
    }),
    runReport({
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    runReport({
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    runReport({
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "averageSessionDuration" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }),
    runReport({
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 8,
    }),
    runReport({
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }),
    runReport({
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 15,
    }),
  ]);

  const t = rows(totals)[0]?.mets ?? [];
  const summary = {
    rango: `últimos ${DAYS} días`,
    usuarios: num(t[0]),
    usuariosNuevos: num(t[1]),
    sesiones: num(t[2]),
    vistasPagina: num(t[3]),
    duracionMediaSesion: num(t[4]),
    bounceRate: num(t[5]),
    engagementRate: num(t[6]),
  };

  if (asJson) {
    console.log(JSON.stringify({
      propertyId: PROPERTY_ID,
      summary,
      byDay: rows(byDay).map((r) => ({ date: r.dims[0], users: num(r.mets[0]), sessions: num(r.mets[1]) })),
      sources: rows(sources).map((r) => ({ channel: r.dims[0], sessions: num(r.mets[0]), users: num(r.mets[1]) })),
      pages: rows(pages).map((r) => ({ path: r.dims[0], views: num(r.mets[0]), users: num(r.mets[1]) })),
      countries: rows(countries).map((r) => ({ country: r.dims[0], users: num(r.mets[0]) })),
      devices: rows(devices).map((r) => ({ device: r.dims[0], users: num(r.mets[0]), sessions: num(r.mets[1]) })),
      events: rows(events).map((r) => ({ event: r.dims[0], count: num(r.mets[0]) })),
    }, null, 2));
    return;
  }

  // ── Salida legible ──────────────────────────────────────────────
  const line = "─".repeat(56);
  console.log(`\n📊  INFORME GA4 · propiedad ${PROPERTY_ID} · ${summary.rango}`);
  console.log(line);
  console.log(`  Usuarios .............. ${fmt(summary.usuarios)}  (${fmt(summary.usuariosNuevos)} nuevos)`);
  console.log(`  Sesiones .............. ${fmt(summary.sesiones)}`);
  console.log(`  Vistas de página ...... ${fmt(summary.vistasPagina)}`);
  console.log(`  Duración media sesión . ${secs(summary.duracionMediaSesion)}`);
  console.log(`  Tasa de interacción ... ${pct(summary.engagementRate)}`);
  console.log(`  Tasa de rebote ........ ${pct(summary.bounceRate)}`);

  const src = rows(sources);
  if (src.length) {
    console.log(`\n🔗  FUENTES DE TRÁFICO`);
    console.log(line);
    for (const r of src) {
      console.log(`  ${(r.dims[0] || "(sin definir)").padEnd(24)} ${fmt(num(r.mets[0])).padStart(6)} sesiones  ·  ${fmt(num(r.mets[1]))} usuarios`);
    }
  }

  const pg = rows(pages);
  if (pg.length) {
    console.log(`\n📄  PÁGINAS MÁS VISTAS`);
    console.log(line);
    for (const r of pg) {
      console.log(`  ${fmt(num(r.mets[0])).padStart(6)} vistas  ${r.dims[0]}`);
    }
  }

  const co = rows(countries);
  if (co.length) {
    console.log(`\n🌍  PAÍSES`);
    console.log(line);
    for (const r of co) {
      console.log(`  ${(r.dims[0] || "(sin definir)").padEnd(24)} ${fmt(num(r.mets[0])).padStart(6)} usuarios`);
    }
  }

  const dv = rows(devices);
  if (dv.length) {
    console.log(`\n📱  DISPOSITIVOS`);
    console.log(line);
    for (const r of dv) {
      console.log(`  ${(r.dims[0] || "").padEnd(12)} ${fmt(num(r.mets[0])).padStart(6)} usuarios  ·  ${fmt(num(r.mets[1]))} sesiones`);
    }
  }

  const ev = rows(events);
  if (ev.length) {
    console.log(`\n⚡  EVENTOS`);
    console.log(line);
    for (const r of ev) {
      console.log(`  ${(r.dims[0] || "").padEnd(28)} ${fmt(num(r.mets[0])).padStart(8)}`);
    }
  }

  const days = rows(byDay);
  if (days.length) {
    const max = Math.max(...days.map((r) => num(r.mets[0])), 1);
    console.log(`\n📈  USUARIOS POR DÍA`);
    console.log(line);
    for (const r of days) {
      const u = num(r.mets[0]);
      const bar = "█".repeat(Math.round((u / max) * 30));
      const d = r.dims[0]; // YYYYMMDD
      const label = `${d.slice(6, 8)}/${d.slice(4, 6)}`;
      console.log(`  ${label}  ${bar} ${fmt(u)}`);
    }
  }

  console.log(`\n${line}`);
  if (summary.usuarios === 0) {
    console.log("⚠️  0 usuarios en el rango. Puede que la propiedad lleve poco tiempo,");
    console.log("    o que GA4_PROPERTY_ID apunte a otra propiedad. Prueba --days 90.\n");
  } else {
    console.log("✓  Informe generado correctamente.\n");
  }
}

main().catch((err) => {
  console.error("\n✗ Error consultando la GA4 Data API:\n");
  console.error(`  ${err.message}`);
  if (String(err.message).includes("PERMISSION_DENIED")) {
    console.error("\n  → Da acceso de LECTURA al email de la cuenta de servicio en");
    console.error("    Analytics → Administrar → Acceso a la propiedad.\n");
  } else if (String(err.message).includes("API has not been used") || String(err.message).includes("SERVICE_DISABLED")) {
    console.error("\n  → Activa la 'Google Analytics Data API' en tu proyecto de Google Cloud.\n");
  } else {
    console.error("");
  }
  process.exit(1);
});
