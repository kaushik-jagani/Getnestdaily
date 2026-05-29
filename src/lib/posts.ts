import { getCollection, type CollectionEntry } from 'astro:content';
import authorsData from '../data/authors.json';

// ============================================
// Author Types & Helpers
// ============================================

export interface Author {
  id: number;
  name: string;
  slug: string;
  bio: string;
  avatar: string;
  social: {
    facebook: string;
    instagram: string;
    reddit: string;
    linkedin: string;
  };
}

const authors: Author[] = authorsData as Author[];

export function getAllAuthors(): Author[] {
  return authors;
}

export function getAuthorBySlug(slug: string): Author | undefined {
  return authors.find(a => a.slug === slug);
}

export function findAuthorByName(name: string): Author | undefined {
  return authors.find(a => a.name.toLowerCase() === name.toLowerCase());
}

export function getAuthorUrl(author: Author): string {
  return `/author/${author.slug}/`;
}

export function getAuthorLink(authorName: string): string | null {
  const author = findAuthorByName(authorName);
  return author ? getAuthorUrl(author) : null;
}

// ============================================
// Post Types & Helpers
// ============================================

export interface Post {
  id: string;
  title: string;
  slug: string;
  category: string | string[];
  date: string;
  author: string;
  image: string;
  featured?: boolean;
  reading_time?: string;
  tags?: string[];
  meta_description?: string;
  keywords?: string[];
  content: string;
  entry: CollectionEntry<'posts'>;
}

function mapEntryToPost(entry: CollectionEntry<'posts'>): Post {
  return {
    id: entry.id,
    title: entry.data.title,
    slug: entry.id,
    category: entry.data.category,
    date: entry.data.date,
    author: entry.data.author,
    image: entry.data.image,
    featured: entry.data.featured,
    reading_time: entry.data.reading_time,
    tags: entry.data.tags,
    meta_description: entry.data.meta_description,
    keywords: entry.data.keywords,
    content: entry.body || '',
    entry: entry
  };
}

export async function getAllPosts(): Promise<Post[]> {
  const entries = await getCollection('posts');
  return entries
    .map(mapEntryToPost)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getAllPosts();
  return posts.find(p => p.slug === slug);
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter(p => p.featured);
}

export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const posts = await getAllPosts();
  const categories = getPostCategories(post);
  return posts
    .filter(p => p.id !== post.id && categories.some(cat => postMatchesCategory(p, cat)))
    .slice(0, limit);
}

// ============================================
// Category Helpers
// ============================================

export function getPostCategories(post: Post): string[] {
  const categories = Array.isArray(post?.category) ? post.category : [post?.category];
  return categories.filter(Boolean).map(c => String(c).trim()).filter(Boolean);
}

export function getPrimaryCategory(post: Post): string {
  return getPostCategories(post)[0] || 'uncategorized';
}

export function postMatchesCategory(post: Post, category: string): boolean {
  return getPostCategories(post).some(c => c.toLowerCase() === category.toLowerCase());
}

export function postMatchesCategorySlug(post: Post, slug: string): boolean {
  return getPostCategories(post).some(c => slugify(c) === slug);
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  const cats = new Set<string>();
  posts.forEach(p => getPostCategories(p).forEach(c => cats.add(c)));
  return [...cats].sort((a, b) => a.localeCompare(b));
}

export async function getCategoryPostCount(category: string): Promise<number> {
  const posts = await getAllPosts();
  return posts.filter(p => postMatchesCategory(p, category)).length;
}

export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter(p => postMatchesCategorySlug(p, categorySlug));
}

// ============================================
// Text & Formatting Utilities
// ============================================

export function slugify(str: string): string {
  return String(str).toLowerCase().trim()
    .replace(/&/g, '-and-')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalizeWords(str: string): string {
  return String(str)
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(words / 200) || 1;
}

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&nbsp;/g, ' ');
}

export function getExcerpt(content: string, length = 120): string {
  if (!content) return '';
  let text = content.replace(/<[^>]*>/g, '');
  // Strip markdown headings (##, ###, etc.)
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Strip bold/italic markers
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
  // Strip inline code
  text = text.replace(/`+([^`]*)`+/g, '$1');
  // Strip blockquotes
  text = text.replace(/^>\s+/gm, '');
  // Strip horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  // Strip links, keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  text = decodeHtmlEntities(text);
  return text.substring(0, length) + '...';
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function categoryUrl(categoryName: string): string {
  return `/pages/category/${slugify(categoryName)}/`;
}

export function postUrl(slug: string): string {
  return `/blog/${slug}/`;
}

export function resolveImageUrl(image: string, targetWidth: number = 800): string {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) {
    try {
      const url = new URL(image);
      if (url.hostname === 'images.pexels.com') {
        url.searchParams.set('auto', 'compress');
        url.searchParams.set('cs', 'tinysrgb');
        url.searchParams.set('w', String(targetWidth));
        url.searchParams.set('dpr', '1');
        // Remove old static w param if present so we always control it
        return url.toString();
      }
      if (url.hostname === 'images.unsplash.com') {
        url.searchParams.set('w', String(targetWidth));
        url.searchParams.set('q', '70');
        url.searchParams.set('fm', 'webp');
        url.searchParams.set('fit', 'crop');
        return url.toString();
      }
    } catch { /* invalid URL, return as-is */ }
    return image;
  }
  if (image.startsWith('/')) return image;
  return '/' + image;
}

