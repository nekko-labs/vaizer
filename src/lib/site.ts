/**
 * Site-wide configuration: brand, nav, external links.
 * Public values come from NEXT_PUBLIC_* env with safe fallbacks so the site
 * always builds, even without an env file.
 */

export const site = {
  name: 'Vaizer',
  tagline: 'See how your agents work.',
  description:
    'Vaizer helps you see how your AI agents work and what they are focused on. Break down any skill into a readable workflow, and watch long-running agent loops make their way toward a goal.',
  // Absolute URL used for metadata. Vaizer lives at its own domain.
  // Use `||` (not `??`) so an empty-string env var falls back too.
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vaizer.com',
  discordUrl:
    process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/nekkolabs',
  githubUrl:
    process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/nekko-labs/vaizer',
  parentName: 'Nekko Labs',
  parentUrl: 'https://nekkolabs.com',
} as const;

export const nav: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Skills', href: '/skills' },
  { label: 'Break down a skill', href: '/skills/inspect' },
  { label: 'Watch', href: '/watch' },
];
