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
    return {
      ...common,
      tagName: 'div',
      children: [{
        type: 'element',
        tagName: 'div',
        properties: { className: ['embed-iframe-wrap'] },
        children: [{
          type: 'element',
          tagName: 'iframe',
          properties: {
            src: `https://www.youtube.com/embed/${vid}`,
            title: 'YouTube video',
            frameBorder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowFullscreen: true,
            loading: 'lazy',
          },
          children: [],
        }],
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
