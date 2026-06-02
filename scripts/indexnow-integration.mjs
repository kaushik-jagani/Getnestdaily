/**
 * Astro integration: auto-submit all post URLs to Bing IndexNow after every build.
 * Reads posts from src/content/posts/ directly — reliable on Cloudflare Pages builds.
 *
 * Key:      3ed052140c1d46fda13751477b44b040
 * Key file: https://getnestdaily.xyz/3ed052140c1d46fda13751477b44b040.txt
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const INDEXNOW_CONFIG = {
    site: 'https://getnestdaily.xyz',
    host: 'getnestdaily.xyz',
    key: '3ed052140c1d46fda13751477b44b040',
};
INDEXNOW_CONFIG.keyLocation = `${INDEXNOW_CONFIG.site}/${INDEXNOW_CONFIG.key}.txt`;

export function submitToIndexNow(payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
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
            'astro:build:done': async ({ logger }) => {
                const { site, host, key, keyLocation } = INDEXNOW_CONFIG;

                if (!key || key === 'REPLACE_WITH_YOUR_KEY') {
                    logger.info('[IndexNow] No key configured, skipping.');
                    return;
                }

                // Read slugs directly from filesystem — pages[] can be empty on Cloudflare builds
                const __dir = path.dirname(fileURLToPath(import.meta.url));
                const postsDir = path.join(__dir, '..', 'src', 'content', 'posts');
                let urls = [];
                try {
                    urls = fs.readdirSync(postsDir)
                        .filter(f => f.endsWith('.md'))
                        .map(f => `${site}/blog/${f.replace(/\.md$/, '')}/`);
                } catch (e) {
                    logger.warn(`[IndexNow] Cannot read posts dir: ${e.message}`);
                    return;
                }

                if (urls.length === 0) {
                    logger.info('[IndexNow] No posts found, skipping.');
                    return;
                }

                logger.info(`[IndexNow] Submitting ${urls.length} URL(s) to Bing...`);
                try {
                    const res = await submitToIndexNow({ host, key, keyLocation, urlList: urls });
                    if (res.status === 200 || res.status === 202) {
                        logger.info(`[IndexNow] ✓ Success (HTTP ${res.status}).`);
                    } else {
                        logger.warn(`[IndexNow] ✗ HTTP ${res.status}: ${res.body}`);
                    }
                } catch (err) {
                    logger.warn(`[IndexNow] ✗ Failed: ${err.message}`);
                }
            },
        },
    };
}

