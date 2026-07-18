/**
 * Site-wide configuration: brand, nav, external links.
 * Public values come from NEXT_PUBLIC_* env with safe fallbacks so the site
 * always builds, even without an env file.
 */

export const site = {
  name: 'Vaizer',
  tagline: 'See, shape, and steer your agents.',
  description:
    'Vaizer is agent and prompt management made visible: break any skill into a readable workflow, analyze and version your prompts, feature-flag prompt config per environment, and run every agent session from one HUD.',
  // Absolute URL used for metadata. Vaizer lives at its own domain.
  // Use `||` (not `??`) so an empty-string env var falls back too.
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vaizer.app',
  discordUrl:
    process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/nekkolabs',
  githubUrl:
    process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/nekko-labs/vaizer',
  parentName: 'Nekko Labs',
  parentUrl: 'https://nekkolabs.com',
} as const;

export const nav: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Skills', href: '/skills' },
  { label: 'Prompts', href: '/prompts' },
  { label: 'Config', href: '/config' },
  { label: 'HUD', href: '/hud' },
  { label: 'Watch', href: '/watch' },
];
