/**
 * rehype-embed.mjs
 *
 * Detects paragraphs containing a single bare URL and replaces them with
 * rich embed previews for YouTube, Twitter/X, Reddit, Facebook, and others.
 *
 * Supported trigger in Markdown: a URL alone on its own line, e.g.
 *   https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   https://x.com/github/status/12345
 *   https://www.reddit.com/r/programming/comments/abc/title/
 *   https://www.facebook.com/video/12345
 */

function getEmbedType(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'youtu.be') return 'youtube';
    if (host === 'x.com' || host === 'twitter.com') return 'twitter';
    if (host === 'reddit.com') return 'reddit';
    if (host === 'facebook.com' || host === 'fb.com') return 'facebook';
    if (host === 'instagram.com') return 'instagram';
    if (host === 'tiktok.com') return 'tiktok';
    if (host === 'linkedin.com') return 'linkedin';
  } catch (_) {}
  return null;
}

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    return u.searchParams.get('v') || null;
  } catch (_) { return null; }
}

function buildEmbed(url, type) {
  const common = {
    type: 'element',
    properties: { className: ['embed-preview', `embed-${type}`], 'data-embed-url': url },
  };

  if (type === 'youtube') {
    const vid = getYouTubeId(url);
    if (!vid) return null;
    const thumb = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`;
    // Thumbnail facade: shows thumbnail + play button.
    // On click (handled by client-side script), replaces with iframe.
    // Falls back to opening YouTube if embedding is disabled.
    return {
      ...common,
      tagName: 'div',
      children: [{
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['yt-facade'],
          'data-vid': vid,
          'data-embed': embedUrl,
          'data-watch': url,
          role: 'button',
          tabIndex: '0',
          'aria-label': 'Play YouTube video',
          style: `background-image:url('${thumb}')`,
        },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['yt-play-btn'], 'aria-hidden': 'true' },
            children: [{
              type: 'raw',
              value: '<svg viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C0 13.05 0 24 0 24s0 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C68 34.95 68 24 68 24s0-10.95-1.48-16.26z" fill="#FF0000"/><path d="M45 24 27 14v20" fill="#fff"/></svg>',
            }],
          },
        ],
      }],
    };
  }

  if (type === 'twitter') {
    // Twitter embeds need the widget.js — we output a blockquote + script tag
    return {
      ...common,
      tagName: 'div',
      children: [
        {
          type: 'element',
          tagName: 'blockquote',
          properties: { className: ['twitter-tweet'], 'data-dnt': 'true' },
          children: [{
            type: 'element',
            tagName: 'a',
            properties: { href: url },
            children: [{ type: 'text', value: url }],
          }],
        },
        {
          type: 'element',
          tagName: 'script',
          properties: {
            async: true,
            src: 'https://platform.twitter.com/widgets.js',
            charset: 'utf-8',
          },
          children: [],
        },
      ],
    };
  }

  if (type === 'reddit') {
    return {
      ...common,
      tagName: 'div',
      children: [
        {
          type: 'element',
          tagName: 'blockquote',
          properties: { className: ['reddit-embed-bq'], 'data-embed-height': '500' },
          children: [{
            type: 'element',
            tagName: 'a',
            properties: { href: url },
            children: [{ type: 'text', value: url }],
          }],
        },
        {
          type: 'element',
          tagName: 'script',
          properties: {
            async: true,
            src: 'https://embed.reddit.com/widgets.js',
            charset: 'UTF-8',
          },
          children: [],
        },
      ],
    };
  }

  if (type === 'facebook') {
    const encoded = encodeURIComponent(url);
    return {
      ...common,
      tagName: 'div',
      children: [{
        type: 'element',
        tagName: 'iframe',
        properties: {
          src: `https://www.facebook.com/plugins/post.php?href=${encoded}&width=560&show_text=true`,
          width: '560',
          height: '390',
          style: 'border:none;overflow:hidden;max-width:100%',
          scrolling: 'no',
          frameBorder: '0',
          allowFullscreen: true,
          allow: 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share',
          loading: 'lazy',
        },
        children: [],
      }],
    };
  }

  if (type === 'instagram') {
    const encoded = encodeURIComponent(url);
    return {
      ...common,
      tagName: 'div',
      children: [{
        type: 'element',
        tagName: 'iframe',
        properties: {
          src: `https://www.instagram.com/p/${url.split('/p/')[1]?.split('/')[0]}/embed/`,
          width: '540',
          height: '600',
          style: 'border:none;overflow:hidden;max-width:100%',
          frameBorder: '0',
          scrolling: 'no',
          allowTransparency: true,
          loading: 'lazy',
        },
        children: [],
      }],
    };
  }

  if (type === 'tiktok') {
    // TikTok oEmbed fallback card
    return {
      ...common,
      tagName: 'div',
      children: [{
        type: 'element',
        tagName: 'a',
        properties: { href: url, target: '_blank', rel: 'noopener noreferrer', className: ['embed-link-card'] },
        children: [
          { type: 'element', tagName: 'span', properties: { className: ['embed-link-icon', 'embed-icon-tiktok'] }, children: [] },
          { type: 'element', tagName: 'span', properties: { className: ['embed-link-label'] }, children: [{ type: 'text', value: 'View on TikTok' }] },
          { type: 'element', tagName: 'span', properties: { className: ['embed-link-url'] }, children: [{ type: 'text', value: url }] },
        ],
      }],
    };
  }

  if (type === 'linkedin') {
    return {
      ...common,
      tagName: 'div',
      children: [{
        type: 'element',
        tagName: 'a',
        properties: { href: url, target: '_blank', rel: 'noopener noreferrer', className: ['embed-link-card'] },
        children: [
          { type: 'element', tagName: 'span', properties: { className: ['embed-link-icon', 'embed-icon-linkedin'] }, children: [] },
          { type: 'element', tagName: 'span', properties: { className: ['embed-link-label'] }, children: [{ type: 'text', value: 'View on LinkedIn' }] },
          { type: 'element', tagName: 'span', properties: { className: ['embed-link-url'] }, children: [{ type: 'text', value: url }] },
        ],
      }],
    };
  }

  return null;
}

function isBareUrlParagraph(node) {
  if (node.tagName !== 'p') return null;
  // Must have exactly one child: an <a> tag
  const children = (node.children || []).filter(
    (c) => !(c.type === 'text' && c.value.trim() === '')
  );
  if (children.length !== 1) return null;
  const child = children[0];
  if (child.type !== 'element' || child.tagName !== 'a') return null;
  const href = child.properties?.href;
  if (!href) return null;
  // The link text should equal the URL (bare auto-link) OR be empty
  const text = (child.children || []).map((c) => c.value || '').join('').trim();
  if (text && text !== href) return null;
  return href;
}

function processTree(node) {
  if (!node.children) return;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === 'element') {
      const url = isBareUrlParagraph(child);
      if (url) {
        const type = getEmbedType(url);
        if (type) {
          const embed = buildEmbed(url, type);
          if (embed) {
            node.children[i] = embed;
            continue;
          }
        }
      }
      processTree(child);
    }
  }
}

export default function rehypeEmbed() {
  return (tree) => processTree(tree);
}
