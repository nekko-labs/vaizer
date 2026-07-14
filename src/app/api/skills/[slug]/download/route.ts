import JSZip from 'jszip';
import { getSkillBySlug, isInstallable } from '@/data/skills';

export const runtime = 'nodejs';

/**
 * Streams a `.zip` of an installable skill's plugin folder, fetched from the
 * marketplace repo on GitHub at request time and cached at the CDN edge.
 *
 * Only skills with an install command (nekko-official + community) are
 * downloadable; curated entries link to their upstream source instead. The
 * repo/branch/path are parsed from the skill's `sourceUrl`, so this works for
 * any skill hosted in a `github.com/<owner>/<repo>/tree/<branch>/<path>` layout.
 */

type GhTreeItem = { path: string; type: string };

const GH_TREE_URL = (o: string, r: string, b: string) =>
  `https://api.github.com/repos/${o}/${r}/git/trees/${b}?recursive=1`;
const GH_RAW_URL = (o: string, r: string, b: string, p: string) =>
  `https://raw.githubusercontent.com/${o}/${r}/${b}/${p}`;

function parseSource(url: string) {
  const m = url.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+?)\/?$/,
  );
  if (!m) return null;
  return { owner: m[1], repo: m[2], branch: m[3], dir: m[4] };
}

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'User-Agent': 'vaizer',
    Accept: 'application/vnd.github+json',
  };
  // Optional: lifts the 60 req/hr unauthenticated limit if configured.
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill || !isInstallable(skill) || !skill.sourceUrl) {
    return new Response('Skill not found or not downloadable', { status: 404 });
  }

  const src = parseSource(skill.sourceUrl);
  if (!src) {
    return new Response('Skill source is not a downloadable GitHub folder', {
      status: 404,
    });
  }

  // One API call lists every path in the repo; we keep the plugin subtree.
  const treeRes = await fetch(GH_TREE_URL(src.owner, src.repo, src.branch), {
    headers: ghHeaders(),
    next: { revalidate: 3600 },
  });
  if (!treeRes.ok) {
    return new Response('Could not reach the skills repository', { status: 502 });
  }
  const tree = (await treeRes.json()) as { tree?: GhTreeItem[] };
  const prefix = `${src.dir}/`;
  const files = (tree.tree ?? []).filter(
    (t) => t.type === 'blob' && t.path.startsWith(prefix),
  );
  if (files.length === 0) {
    return new Response('Skill files not found', { status: 404 });
  }

  const zip = new JSZip();
  const root = zip.folder(slug)!;
  try {
    await Promise.all(
      files.map(async (f) => {
        const rawRes = await fetch(
          GH_RAW_URL(src.owner, src.repo, src.branch, f.path),
          { headers: { 'User-Agent': 'vaizer' }, next: { revalidate: 3600 } },
        );
        if (!rawRes.ok) throw new Error(`failed to fetch ${f.path}`);
        root.file(f.path.slice(prefix.length), await rawRes.arrayBuffer());
      }),
    );
  } catch {
    return new Response('Failed to assemble the skill archive', { status: 502 });
  }

  const body = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}.zip"`,
      // Cache the assembled zip at the edge so GitHub is hit rarely.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
