const IOS_URL = "https://testflight.apple.com/join/fhduvPKr";
const ANDROID_URL =
  "https://play.google.com/store/apps/details?id=com.ecosystm.wekamp&hl=en-US&ah=W4rRfhkBJkUQummODFzAOlKDZgw";
const FALLBACK_URL = IOS_URL;

function pickRedirect(userAgent) {
  const ua = (userAgent || "").toLowerCase();
  if (ua.includes("android")) return ANDROID_URL;
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return IOS_URL;
  return FALLBACK_URL;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return Response.json({
        ok: true,
        service: "store-redirect-worker",
        routes: ["/open", "/healthz"],
      });
    }

    if (url.pathname === "/open") {
      const target = pickRedirect(request.headers.get("user-agent"));
      return Response.redirect(target, 302);
    }

    return new Response("Not found", { status: 404 });
  },
};
