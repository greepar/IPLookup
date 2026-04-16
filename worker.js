export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const ip =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
      "unknown";

    if (!url.searchParams.has("detail")) {
      return new Response(ip, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          ...corsHeaders,
        },
      });
    }

    const cf = request.cf || {};

    return new Response(
      JSON.stringify({
        ip,
        ipv6: request.headers.get("CF-Connecting-IPv6") || null,
        country: request.headers.get("CF-IPCountry") || cf.country || null,
        region: cf.region || null,
        regionCode: cf.regionCode || null,
        city: cf.city || null,
        postalCode: cf.postalCode || null,
        continent: cf.continent || null,
        timezone: cf.timezone || null,
        latitude: cf.latitude || null,
        longitude: cf.longitude || null,
        colo: cf.colo || null,
        asn: cf.asn || null,
        asOrganization: cf.asOrganization || null,
        metroCode: cf.metroCode || null,
        protocol: cf.httpProtocol || null,
        tlsVersion: cf.tlsVersion || null,
        userAgent: request.headers.get("User-Agent") || null,
      }),
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          ...corsHeaders,
        },
      }
    );
  },
};