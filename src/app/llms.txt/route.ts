import { categoryLabels, isInstallable, skills, skillsMarketplace } from '@/data/skills';
import { site } from '@/lib/site';

/**
 * /llms.txt — the llmstxt.org convention: a plain-text map of the site for LLMs
 * and answer engines. Generated from the skills data, so the catalog section
 * cannot drift from what the site actually lists.
 */

export const dynamic = 'force-static';

export function GET(): Response {
  const byCategory = new Map<string, typeof skills>();
  for (const skill of skills) {
    const list = byCategory.get(skill.category) ?? [];
    list.push(skill);
    byCategory.set(skill.category, list);
  }

  const catalog = [...byCategory.entries()]
    .map(([category, entries]) => {
      const label = categoryLabels[category as keyof typeof categoryLabels] ?? category;
      const lines = entries
        .map(
          (skill) =>
            `- [${skill.name}](${site.url}/skills/${skill.slug}): ${skill.description} By ${skill.author}.${
              isInstallable(skill) ? ` Install: \`${skill.installCommand}\`` : ''
            }`,
        )
        .join('\n');
      return `### ${label}\n\n${lines}`;
    })
    .join('\n\n');

  const body = `# ${site.name}

> ${site.tagline} ${site.description}

Vaizer makes agent work legible. Paste a skill and see the workflow it actually runs before you trust it with your machine. Write, version, and analyze prompts instead of guessing at them. Feature-flag prompt config per environment. Then watch every agent session from one place. Built by ${site.parentName}.

## What is here

- **[Skills](${site.url}/skills)**: search any skill, from our catalog or anywhere on GitHub, and see exactly how it runs as a workflow graph (trigger, agent steps, tool calls, decisions, output) before installing it. There is also a public JSON catalog at ${site.url}/api/skills.
- **[Prompts](${site.url}/prompts)**: write, store, and version prompts, and analyze each one: issues and weak points, the decisions it hands to the model, cost per model, and which model should run it.
- **[Prompt config](${site.url}/config)**: feature-flag prompts per project and environment. Toggle what is served in development, staging, and production, and cache or invalidate prompts like a flag.
- **[Agent HUD](${site.url}/hud)**: a command center for every agent session, long-running loops and short chats together, with progress, spend, and an attention queue that surfaces the ones that actually need you.
- **[Watch](${site.url}/watch)**: follow a long-running agent loop as a journey: milestones on a path, a marker that advances, and a feed of what the agent just tried.

## Pages

- [Home](${site.url}/): the pitch and the feature tour.
- [Skills](${site.url}/skills): the catalog and the workflow visualizer.
- [Prompts](${site.url}/prompts): the prompt workbench.
- [Prompt config](${site.url}/config): per-environment prompt flags.
- [Agent HUD](${site.url}/hud): the session command center.
- [Watch](${site.url}/watch): the loop monitor.

## Skill catalog

Skills marked installable come from the ${skillsMarketplace.name} marketplace. Add it once with \`${skillsMarketplace.addCommand}\`, then install any skill by name.

${catalog}

## API

- \`GET ${site.url}/api/skills\`: the public skills catalog as JSON.

## Elsewhere

- [GitHub](${site.githubUrl}): Vaizer's source.
- [Discord](${site.discordUrl}): the community.
- [${site.parentName}](${site.parentUrl}): the company behind Vaizer.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
