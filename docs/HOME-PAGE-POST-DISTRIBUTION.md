# Home Page Post Distribution — Unique Post Logic

> **For AI Agents & Developers** — This document explains how the home page (`src/pages/index.astro`) distributes posts across its four sections to prevent duplicate content.

---

## Problem (Before Fix)

The original code reused the same posts across multiple sections:

```
Hero:      posts[0..3]     (4 posts)
Main feed: posts[4..18]    (15 posts)
Sidebar:   posts[0..5]     ← DUPLICATED hero posts 0–3!
Trending:  posts[4+]       ← DUPLICATED main feed posts!
```

This caused the same article to appear in Hero AND Sidebar, and in Main Feed AND Trending — making the home page look repetitive.

---

## Solution: Threshold-Based Unique Distribution

**File:** `src/pages/index.astro` (frontmatter section)

### Section Slot Counts

| Section | Slot Count | Priority |
|---------|-----------|----------|
| Hero | 4 (1 main + 3 side) | 1st pick |
| Main Feed | 15 | 2nd pick |
| Sidebar "Popular" | 6 | 3rd pick |
| Trending | 6 | 4th pick |
| **Total** | **31** | |

### How It Works

1. **Threshold check:** `posts.length >= 31` (HERO + MAIN + SIDEBAR + TRENDING counts)
2. **If enough posts (≥ 31):** Each section gets **completely unique** posts. A post assigned to Hero will NOT appear in Main Feed, Sidebar, or Trending.
3. **If not enough posts (< 31):** Posts MAY repeat across sections — this is intentional so sections aren't left empty when the site has few articles.

### Assignment Order

Posts come from `getAllPosts()` sorted by **date descending** (latest first).

```
When posts >= 31 (unique mode ON):
  Hero:      takes posts[0..3]   → marks IDs as used
  Main Feed: takes posts[4..18]  → marks IDs as used
  Sidebar:   takes posts[19..24] → marks IDs as used
  Trending:  takes posts[25..30] → featured posts first, then fills remaining
```

```
When posts < 31 (unique mode OFF):
  Each section pulls independently from the full post array.
  Repetition is allowed so no section is empty.
```

### Key Function: `takeUnique()`

```typescript
function takeUnique(pool, count, uniqueMode): posts[] {
  // Iterates pool, skips already-assigned IDs when uniqueMode=true
  // Returns up to `count` posts
  // Tracks used IDs in shared `assignedIds` Set
}
```

### Trending Section Special Behavior

- Trending prioritizes posts with `featured: true` in frontmatter
- After featured posts are exhausted, fills remaining slots with non-featured posts
- Only shows when `posts.length >= 7`

---

## Constants Reference

| Constant | Value | Purpose |
|----------|-------|---------|
| `HERO_COUNT` | 4 | Posts in hero section |
| `MAIN_COUNT` | 15 | Posts in main feed |
| `SIDEBAR_COUNT` | 6 | Posts in sidebar |
| `TRENDING_COUNT` | 6 | Posts in trending |
| `UNIQUE_THRESHOLD` | 31 | Min posts for unique mode |

---

## When to Modify

- **Adding a new home page section?** → Add a new constant, increase `UNIQUE_THRESHOLD`, add a `takeUnique()` call in the correct priority order.
- **Changing slot counts?** → Update the relevant constant. `UNIQUE_THRESHOLD` auto-calculates.
- **Posts still repeating?** → Check `posts.length` — if below 31, repetition is by design. Add more content to reach the threshold.

---

## Related Files

| File | Role |
|------|------|
| `src/pages/index.astro` | Home page with distribution logic |
| `src/lib/posts.ts` | `getAllPosts()` — returns posts sorted by date desc |
| `src/components/cards/` | Card components rendering each section |
