/**
 * Client-side prompt storage.
 *
 * Prompts live in localStorage so the library works with zero setup and no
 * account (matching the site's env-optional rule). Each prompt keeps a
 * version history: saving snapshots the current content, so you can iterate
 * on wording and roll back. The same shapes are designed to move server-side
 * (Supabase) later without changing the workbench UI.
 */

export type PromptVersion = {
  v: number;
  content: string;
  savedAt: string; // ISO
  note?: string;
};

export type StoredPrompt = {
  id: string;
  name: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  versions: PromptVersion[];
};

const KEY = 'vaizer.prompts.v1';

const SEEDS: Array<Pick<StoredPrompt, 'name' | 'content' | 'tags'>> = [
  {
    name: 'PR review agent',
    tags: ['coding', 'agentic'],
    content: `You are a senior code reviewer. Review the attached diff for correctness bugs first, then style.

1. Read the diff and the surrounding files it touches.
2. Report every issue you find, including ones you are uncertain about. For each: file, line, severity (high/medium/low), and a one-sentence fix.
3. Done when every changed file has been covered. Respond as a markdown table.`,
  },
  {
    name: 'Support ticket summarizer',
    tags: ['extraction'],
    content: `Extract from the support ticket below: customer name, product, severity, and a one-sentence summary of the problem. Return JSON with keys name, product, severity, summary. If a field is missing, use null.

Example output: {"name": "Kai", "product": "Getsu", "severity": "high", "summary": "Sync fails on first login."}`,
  },
  {
    name: 'Weekly changelog writer',
    tags: ['writing'],
    content: `Write a changelog for this week from the commit list I paste. Keep it short and friendly. Group by feature area.`,
  },
];

function now(): string {
  return new Date().toISOString();
}

function uid(): string {
  return `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function read(): StoredPrompt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StoredPrompt[];
  } catch {
    /* corrupted storage: fall through to seeding */
  }
  const seeded = SEEDS.map((s) => {
    const t = now();
    return { id: uid(), ...s, createdAt: t, updatedAt: t, versions: [{ v: 1, content: s.content, savedAt: t, note: 'Initial version' }] };
  });
  write(seeded);
  return seeded;
}

function write(prompts: StoredPrompt[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prompts));
  } catch {
    /* storage full or unavailable: the session still works in-memory */
  }
}

export function listPrompts(): StoredPrompt[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createPrompt(name: string, content = ''): StoredPrompt {
  const t = now();
  const p: StoredPrompt = {
    id: uid(),
    name: name.trim() || 'Untitled prompt',
    content,
    tags: [],
    createdAt: t,
    updatedAt: t,
    versions: [],
  };
  write([...read(), p]);
  return p;
}

/** Update working content (autosave); does not create a version. */
export function updatePrompt(id: string, patch: Partial<Pick<StoredPrompt, 'name' | 'content' | 'tags'>>): StoredPrompt | undefined {
  const all = read();
  const p = all.find((x) => x.id === id);
  if (!p) return undefined;
  Object.assign(p, patch, { updatedAt: now() });
  write(all);
  return p;
}

/** Snapshot the current content as a new immutable version. */
export function saveVersion(id: string, note?: string): StoredPrompt | undefined {
  const all = read();
  const p = all.find((x) => x.id === id);
  if (!p) return undefined;
  const v = (p.versions[p.versions.length - 1]?.v ?? 0) + 1;
  p.versions.push({ v, content: p.content, savedAt: now(), note });
  p.updatedAt = now();
  write(all);
  return p;
}

export function restoreVersion(id: string, v: number): StoredPrompt | undefined {
  const all = read();
  const p = all.find((x) => x.id === id);
  const ver = p?.versions.find((x) => x.v === v);
  if (!p || !ver) return undefined;
  p.content = ver.content;
  p.updatedAt = now();
  write(all);
  return p;
}

export function deletePrompt(id: string): void {
  write(read().filter((x) => x.id !== id));
}
