export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "https://hugoflying.github.io",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // Only AK proxy
    if (url.pathname === "/ak" && request.method === "GET") {
      const flow = url.searchParams.get("flow");
      const from = url.searchParams.get("from");
      const to   = url.searchParams.get("to");

      if (!flow || !from || !to) {
        return new Response("Missing flow/from/to", { status: 400, headers: cors });
      }

      const AK_BASE = "https://api.app.airport-keeper.com/flights/v1/airport";
      const AK_AIRPORT = "LFOB";

      const upstream =
        `${AK_BASE}?airport=${encodeURIComponent(AK_AIRPORT)}` +
        `&flow=${encodeURIComponent(flow)}` +
        `&from=${encodeURIComponent(from)}` +
        `&to=${encodeURIComponent(to)}`;

      const r = await fetch(upstream, {
        headers: { Authorization: `Bearer ${env.AK_TOKEN}` },
      });

      // On renvoie tel quel, en gardant le status
      return new Response(await r.text(), {
        status: r.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404, headers: cors });
  },
};
