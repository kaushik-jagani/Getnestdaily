/**
 * IndexNow URL Submitter for getnestdaily.xyz
 *
 * Usage:
 *   Submit all posts:        node scripts/indexnow-submit.js
 *   Submit specific slugs:   node scripts/indexnow-submit.js slug-one slug-two
 *
 * Bing/IndexNow key: 3ed052140c1d46fda13751477b44b040
 * Key file hosted at: https://getnestdaily.xyz/3ed052140c1d46fda13751477b44b040.txt
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE = 'https://getnestdaily.xyz';
const KEY = '3ed052140c1d46fda13751477b44b040';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const HOST = 'getnestdaily.xyz';

const POSTS_MD_DIR = path.join(__dirname, '..', 'src', 'content', 'posts');

// ── Collect URLs ─────────────────────────────────────────────────────────────
function getAllPostUrls() {
    return fs.readdirSync(POSTS_MD_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => `${SITE}/blog/${f.replace(/\.md$/, '')}`);
}

function getUrlsForSlugs(slugs) {
    return slugs.map(s => `${SITE}/blog/${s.trim()}`);
}

// ── HTTP POST helper ──────────────────────────────────────────────────────────
function postJson(host, urlPath, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: host,
            path: urlPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(data),
            },
        };
        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: raw }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const cliSlugs = process.argv.slice(2);
    const urls = cliSlugs.length > 0 ? getUrlsForSlugs(cliSlugs) : getAllPostUrls();

    if (urls.length === 0) {
        console.log('No URLs to submit.');
        return;
    }

    // IndexNow accepts max 10,000 URLs per request; chunk just in case
    const CHUNK = 10000;
    for (let i = 0; i < urls.length; i += CHUNK) {
        const batch = urls.slice(i, i + CHUNK);
        console.log(`\nSubmitting ${batch.length} URL(s) to IndexNow...`);
        batch.forEach(u => console.log(' ', u));

        const payload = {
            host: HOST,
            key: KEY,
            keyLocation: KEY_LOCATION,
            urlList: batch,
        };

        try {
            const res = await postJson('api.indexnow.org', '/IndexNow', payload);
            if (res.status === 200 || res.status === 202) {
                console.log(`✓ Success (HTTP ${res.status}) — URLs accepted by IndexNow.`);
            } else {
                console.error(`✗ HTTP ${res.status}: ${res.body}`);
            }
        } catch (err) {
            console.error('✗ Request failed:', err.message);
        }
    }
}

main();
