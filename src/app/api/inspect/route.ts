import { NextResponse } from 'next/server';
import { parseSkillMarkdown } from '@/lib/skill-parse';

export const runtime = 'nodejs';
export const revalidate = 3600;

/**
 * Fetch a public skill's SKILL.md from GitHub and parse it into a workflow
 * graph. Accepts the common GitHub URL shapes (raw, blob, tree/folder) and
 * normalizes them to a raw.githubusercontent.com SKILL.md URL. Restricted to
 * GitHub hosts so this can't be used to probe arbitrary hosts (SSRF).
 */

const ALLOWED_HOSTS = new Set(['github.com', 'raw.githubusercontent.com', 'www.github.com']);

/** Turn a user-supplied GitHub URL into a raw SKILL.md URL (or throw). */
function toRawSkillUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error('That does not look like a URL. Paste a link to a skill on GitHub.');
  }
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error('Only public GitHub URLs are supported right now.');
  }

  // Already a raw URL.
  if (url.hostname === 'raw.githubusercontent.com') {
    return url.pathname.toLowerCase().endsWith('.md')
      ? url.toString()
      : url.toString().replace(/\/?$/, '/SKILL.md');
  }

  // github.com/<owner>/<repo>/(blob|tree)/<branch>/<path...>
  const parts = url.pathname.split('/').filter(Boolean);
  const [owner, repo, kind, branch, ...rest] = parts;
  if (!owner || !repo) {
    throw new Error('Could not read owner/repo from that GitHub URL.');
  }

  const base = 'https://raw.githubusercontent.com';
  if (kind === 'blob' || kind === 'raw') {
    // .../blob/<branch>/<path/to/SKILL.md>
    const path = rest.join('/');
    const finalPath = path.toLowerCase().endsWith('.md') ? path : `${path}/SKILL.md`;
    return `${base}/${owner}/${repo}/${branch}/${finalPath}`;
  }
  if (kind === 'tree') {
    // .../tree/<branch>/<folder> -> folder/SKILL.md
    const folder = rest.join('/');
    return `${base}/${owner}/${repo}/${branch}/${folder ? folder + '/' : ''}SKILL.md`;
  }
  // Bare repo URL: assume default branch `main`, SKILL.md at root.
  const branchGuess = kind || 'main';
  const folder = kind ? [branch, ...rest].filter(Boolean).join('/') : '';
  return `${base}/${owner}/${repo}/${folder ? '' : branchGuess}/${folder ? folder + '/' : ''}SKILL.md`
    .replace('//SKILL.md', '/SKILL.md');
}

async function fetchText(rawUrl: string): Promise<string | null> {
  try {
    const res = await fetch(rawUrl, {
      headers: { 'User-Agent': 'vaizer-skill-inspector' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  const input = typeof body.url === 'string' ? body.url : '';
  if (!input) {
    return NextResponse.json({ error: 'Paste a GitHub URL to a skill.' }, { status: 400 });
  }

  let rawUrl: string;
  try {
    rawUrl = toRawSkillUrl(input);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Try the resolved URL, then a couple of common fallbacks for the default
  // branch (main vs master) when the user pasted a bare repo/folder link.
  const candidates = [rawUrl];
  if (rawUrl.includes('/main/')) candidates.push(rawUrl.replace('/main/', '/master/'));

  let md: string | null = null;
  let used = rawUrl;
  for (const c of candidates) {
    md = await fetchText(c);
    if (md) {
      used = c;
      break;
    }
  }

  if (!md) {
    return NextResponse.json(
      {
        error:
          'Could not find a SKILL.md there. Link to the skill folder or its SKILL.md directly.',
      },
      { status: 404 },
    );
  }

  const fallbackName = used.split('/').slice(-2)[0];
  const parsed = parseSkillMarkdown(md, fallbackName);

  return NextResponse.json({
    source: used,
    name: parsed.name,
    description: parsed.description,
    tools: parsed.tools,
    workflow: parsed.workflow,
    lowConfidence: parsed.lowConfidence,
  });
}
