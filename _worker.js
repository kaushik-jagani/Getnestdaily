const SITE = "https://getnestdaily.xyz";
const HOST = "getnestdaily.xyz";
const KEY = "3ed052140c1d46fda13751477b44b040";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

async function fetchUrlsFromSitemap() {
  let xml, sitemapSource;
  try {
    const r = await fetch(`${SITE}/sitemap-0.xml`);
    if (r.ok) { xml = await r.text(); sitemapSource = "sitemap-0.xml"; }
  } catch (_) {}
  if (!xml) {
    const r = await fetch(`${SITE}/sitemap.xml`);
    if (!r.ok) throw new Error("Could not fetch sitemap");
    xml = await r.text();
    sitemapSource = "sitemap.xml";
  }
  const urls = [];
  const re = /<loc>(.*?)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const u = m[1].trim();
    if (u.includes("/blog/") && !u.endsWith("/blog/")) urls.push(u);
  }
  return { urls, sitemapSource };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // /submit-bing — auto-fetch sitemap and submit to IndexNow
    if (url.pathname === "/submit-bing" || url.pathname === "/submit-bing/") {
      try {
        const { urls, sitemapSource } = await fetchUrlsFromSitemap();
        if (!urls.length) {
          return new Response(JSON.stringify({ success: false, error: "No blog URLs found in sitemap" }), {
            status: 404, headers: { "Content-Type": "application/json" }
          });
        }
        const payload = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls };
        const res = await fetch("https://api.indexnow.org/IndexNow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
        });
        return new Response(JSON.stringify({
          success: res.status === 200 || res.status === 202,
          httpStatus: res.status,
          submitted: urls.length,
          sitemapSource,
          urls,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500, headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Redirect www → non-www
    if (url.hostname === "www.getnestdaily.xyz") {
      return Response.redirect(
        `https://getnestdaily.xyz${url.pathname}${url.search}`,
        301
      );
    }

    // Redirect /index.html
    if (url.pathname === "/index.html") {
      return Response.redirect(
        "https://getnestdaily.xyz/",
        301
      );
    }

    // Force HTTPS
    if (url.protocol === "http:") {
      return Response.redirect(
        `https://${url.hostname}${url.pathname}${url.search}`,
        301
      );
    }

    // Fetch the response
    const response = await fetch(request);
    return response;
  }
}
