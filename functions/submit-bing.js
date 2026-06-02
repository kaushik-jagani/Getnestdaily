/**
 * Cloudflare Pages Function: /submit-bing
 * 
 * Call GET https://getnestdaily.xyz/submit-bing
 * Automatically fetches all blog URLs from the sitemap and submits to Bing IndexNow.
 * No manual slug input needed.
 */

const SITE         = 'https://getnestdaily.xyz';
const HOST         = 'getnestdaily.xyz';
const KEY          = '3ed052140c1d46fda13751477b44b040';
const KEY_LOCATION = $(System.Collections.Hashtable.site)/3ed052140c1d46fda13751477b44b040.txt;

async function fetchUrlsFromSitemap() {
    // Try sitemap-0.xml first (Astro default), fallback to sitemap.xml
    const candidates = [
        $(System.Collections.Hashtable.site)/sitemap-0.xml,
        $(System.Collections.Hashtable.site)/sitemap.xml,
    ];

    for (const url of candidates) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'IndexNow-Submitter/1.0' } });
            if (!res.ok) continue;
            const xml = await res.text();
            const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
            const urls = matches
                .map(m => m[1].trim())
                .filter(u => u.includes('/blog/') && !u.endsWith('/blog/') && !u.endsWith('/blog'));
            if (urls.length > 0) return { urls, source: url };
        } catch (_) {}
    }
    return { urls: [], source: null };
}

export async function onRequest() {
    if (!KEY || KEY === 'REPLACE_WITH_YOUR_KEY') {
        return new Response(JSON.stringify({
            success: false,
            error: 'IndexNow key not configured yet. Update the KEY value in functions/submit-bing.js',
        }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const { urls, source } = await fetchUrlsFromSitemap();

    if (urls.length === 0) {
        return new Response(JSON.stringify({
            success: false,
            error: 'No blog URLs found in sitemap. Make sure the site is deployed and sitemap is live.',
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const res = await fetch('https://api.indexnow.org/IndexNow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
        });

        const ok = res.status === 200 || res.status === 202;
        return new Response(JSON.stringify({
            success: ok,
            httpStatus: res.status,
            submitted: urls.length,
            sitemapSource: source,
            urls,
        }), {
            status: ok ? 200 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
        });
    }
}
