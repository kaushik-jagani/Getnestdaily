/**
 * Astro integration: auto-submit all post URLs to Bing IndexNow after every build.
 * Fires via the `astro:build:done` hook — runs automatically on every Cloudflare deployment.
 *
 * Key:      3ed052140c1d46fda13751477b44b040
 * Key file: https://getnestdaily.xyz/3ed052140c1d46fda13751477b44b040.txt
 */

import https from 'https';

const SITE       = 'https://getnestdaily.xyz';
const HOST       = 'getnestdaily.xyz';
const KEY        = '3ed052140c1d46fda13751477b44b040';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

function postJson(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request(
            {
                hostname: 'api.indexnow.org',
                path: '/IndexNow',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': Buffer.byteLength(data),
                },
            },
            (res) => {
                let raw = '';
                res.on('data', chunk => (raw += chunk));
                res.on('end', () => resolve({ status: res.statusCode, body: raw }));
            }
        );
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

export function indexNowIntegration() {
    return {
        name: 'indexnow-auto-submit',
        hooks: {
            'astro:build:done': async ({ pages, logger }) => {
                // Collect only /blog/* pages
                const urls = pages
                    .map(p => `${SITE}/${p.pathname}`.replace(/\/+/g, '/').replace('https:/', 'https://'))
                    .filter(u => u.includes('/blog/') && !u.endsWith('/blog/'));

                if (urls.length === 0) {
                    logger.info('[IndexNow] No blog URLs found, skipping submission.');
                    return;
                }

                logger.info(`[IndexNow] Submitting ${urls.length} URL(s) to Bing...`);

                try {
                    const res = await postJson({
                        host: HOST,
                        key: KEY,
                        keyLocation: KEY_LOCATION,
                        urlList: urls,
                    });

                    if (res.status === 200 || res.status === 202) {
                        logger.info(`[IndexNow] ✓ Submitted successfully (HTTP ${res.status}).`);
                    } else {
                        logger.warn(`[IndexNow] ✗ HTTP ${res.status}: ${res.body}`);
                    }
                } catch (err) {
                    logger.warn(`[IndexNow] ✗ Request failed: ${err.message}`);
                }
            },
        },
    };
}
