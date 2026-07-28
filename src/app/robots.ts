import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * robots.txt — the marketing pages and the public skills catalog are open to
 * everyone, including AI crawlers and answer engines. The rest of /api is
 * machinery (inspection, votes, feedback), so it stays out of the index;
 * /api/skills is the public catalog and is explicitly allowed.
 */

// Named so the crawlers that look for their own token first (mostly the AI
// ones) get an explicit answer. The `*` rule already covers them.
const NAMED_CRAWLERS = [
  // Search
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
  // Social unfurls
  'Twitterbot',
  'facebookexternalhit',
  // AI crawlers and answer engines
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'cohere-ai',
  'Meta-ExternalAgent',
  'Bytespider',
];

const allow = ['/', '/api/skills'];
const disallow = ['/api/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow, disallow },
      ...NAMED_CRAWLERS.map((userAgent) => ({ userAgent, allow, disallow })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
