# Author System

> **For AI Agents & Developers** — How the author profile pages work, how to add new authors, and how author linking works across blog posts.

---

## Overview

Authors are managed via a single JSON file. Each author gets a dedicated profile page at `/author/{slug}/` that displays their bio, social media links, and all their articles. Blog posts automatically link to the author's page when the author name matches (case-insensitive).

---

## Architecture

| Component | Path | Purpose |
|-----------|------|---------|
| Author data | `src/data/authors.json` | Single source of truth for all authors |
| Author helpers | `src/lib/posts.ts` | Functions to query authors and generate URLs |
| Author page | `src/pages/author/[slug].astro` | Dynamic route for author profile pages |
| Blog post link | `src/pages/blog/[slug].astro` | Conditionally links author name to profile |
| Link styles | `src/styles/style.css` | `.author-link` CSS rules |

---

## How It Works

1. **Author matching** — When a blog post renders, it calls `findAuthorByName(post.author)` which does a case-insensitive lookup in `authors.json`.
2. **Conditional linking** — If a matching author is found, the author name in the post meta and author bio section becomes a clickable link to `/author/{slug}/`. If no match, the name displays as plain text.
3. **Author page generation** — At build time, Astro generates a static page for each author in the JSON file via `getStaticPaths`.
4. **Article listing** — The author page filters all posts by author name (case-insensitive) and displays them in a grid.

---

## `src/data/authors.json` Schema

```json
[
    {
        "id": 1,
        "name": "Kaushik Jagani",
        "slug": "kaushik-jagani",
        "bio": "Short author biography text.",
        "avatar": "",
        "social": {
            "facebook": "",
            "instagram": "",
            "reddit": "",
            "linkedin": ""
        }
    }
]
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique incremental ID starting from 1 |
| `name` | string | Yes | Display name (used for matching with post `author` field) |
| `slug` | string | Yes | URL-safe slug for the author page route |
| `bio` | string | Yes | Short biography shown on the author page |
| `avatar` | string | No | URL to avatar image. If empty, shows first letter initial |
| `social.facebook` | string | No | Full Facebook profile URL. Leave empty to hide |
| `social.instagram` | string | No | Full Instagram profile URL. Leave empty to hide |
| `social.reddit` | string | No | Full Reddit profile URL. Leave empty to hide |
| `social.linkedin` | string | No | Full LinkedIn profile URL. Leave empty to hide |

---

## Adding a New Author

1. Open `src/data/authors.json`
2. Add a new object to the array with the next incremental `id`:

```json
{
    "id": 2,
    "name": "New Author Name",
    "slug": "new-author-name",
    "bio": "Author biography here.",
    "avatar": "",
    "social": {
        "facebook": "",
        "instagram": "",
        "reddit": "",
        "linkedin": ""
    }
}
```

3. Ensure the `name` field exactly matches (case-insensitive) the `author` field used in blog post frontmatter.
4. The `slug` must be URL-safe: lowercase, hyphens instead of spaces, no special characters.
5. Rebuild — the new author page will be generated automatically.

---

## Updating Social Links

Edit `src/data/authors.json` and fill in the social media URLs. Only links with non-empty URLs will be displayed on the author page:

```json
"social": {
    "facebook": "https://facebook.com/yourprofile",
    "instagram": "https://instagram.com/yourprofile",
    "reddit": "https://reddit.com/user/yourprofile",
    "linkedin": "https://linkedin.com/in/yourprofile"
}
```

---

## Important Notes

- **Author name matching is case-insensitive** — "Kaushik Jagani", "kaushik jagani", and "KAUSHIK JAGANI" all match the same author.
- **No match = no link** — If a blog post's `author` field doesn't match any author in the JSON, the name displays as plain text with no link.
- **All blog posts work automatically** — Both existing and newly added posts use the same matching logic. No per-post configuration needed.
- **Social links are optional** — Empty strings are filtered out and won't render buttons on the author page.
