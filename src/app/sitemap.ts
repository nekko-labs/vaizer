import type { MetadataRoute } from 'next';
import { skills } from '@/data/skills';
import { site } from '@/lib/site';

/**
 * sitemap.xml — the marketing pages plus every skill in the catalog, read from
 * the skills data so new entries appear without editing a list.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${site.url}${path}`;

  const pages: MetadataRoute.Sitemap = [
    { url: url('/'), changeFrequency: 'weekly', priority: 1 },
    { url: url('/skills'), changeFrequency: 'daily', priority: 0.9 },
    { url: url('/prompts'), changeFrequency: 'weekly', priority: 0.8 },
    { url: url('/config'), changeFrequency: 'weekly', priority: 0.8 },
    { url: url('/hud'), changeFrequency: 'weekly', priority: 0.8 },
    { url: url('/watch'), changeFrequency: 'weekly', priority: 0.8 },
  ];

  const skillPages: MetadataRoute.Sitemap = skills.map((skill) => ({
    url: url(`/skills/${skill.slug}`),
    changeFrequency: 'weekly',
    priority: skill.featured ? 0.8 : 0.7,
  }));

  return [...pages, ...skillPages];
}
