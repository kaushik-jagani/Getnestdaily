/**
 * Cloudflare Pages Function: /api/indexnow-submit
 * Call this endpoint to manually trigger IndexNow submission for all posts.
 *
 * GET  https://getnestdaily.xyz/api/indexnow-submit
 * POST https://getnestdaily.xyz/api/indexnow-submit
 */

const SITE         = 'https://getnestdaily.xyz';
const HOST         = 'getnestdaily.xyz';
const KEY          = '3ed052140c1d46fda13751477b44b040';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

// Hard-coded post slugs — update this list when adding new posts,
// or the auto-submit at build time keeps it current.
// This fallback list is for manual on-demand calls.
const STATIC_URLS = null; // null = will return instructions only; set to [] of URLs to submit

async function submitToIndexNow(urlList) {
    const payload = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList });
    const res = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: payload,
    });
    return { status: res.status, body: await res.text() };
}

export async function onRequest(context) {
    const url = new URL(context.request.url);

    // Optional: accept ?slugs=slug1,slug2 for targeted submission
    const slugsParam = url.searchParams.get('slugs');
    let urlList = [];

    if (slugsParam) {
        urlList = slugsParam.split(',').map(s => `${SITE}/blog/${s.trim()}/`);
    } else if (STATIC_URLS && STATIC_URLS.length > 0) {
        urlList = STATIC_URLS;
    } else {
        return new Response(JSON.stringify({
            message: 'IndexNow API ready. Use ?slugs=slug1,slug2 to submit specific URLs.',
            site: SITE,
            key: KEY,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const result = await submitToIndexNow(urlList);
        const success = result.status === 200 || result.status === 202;
        return new Response(JSON.stringify({
            success,
            httpStatus: result.status,
            submitted: urlList.length,
            urls: urlList,
        }), {
            status: success ? 200 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
