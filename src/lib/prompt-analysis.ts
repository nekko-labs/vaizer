/**
 * Heuristic prompt analysis.
 *
 * Pure, deterministic functions (no API calls, env-optional by construction)
 * that read a prompt and produce: a review (issues, weak points, strengths,
 * and concrete fixes), the decision points the model will face, a task
 * profile (type + complexity), per-model cost estimates and plan paths, and
 * a model recommendation driven by the user's preference (cheapest that
 * fits, highest quality, or balanced). Everything renders in the /prompts
 * workbench; the same functions could later back an API route.
 */

import { models, type Model, type ModelId } from '@/data/models';

/* ---------------------------------- types --------------------------------- */

export type Severity = 'high' | 'medium' | 'low';

export type Issue = {
  severity: Severity;
  title: string;
  detail: string;
  /** A concrete suggestion the user can apply. */
  fix: string;
};

export type TaskType = 'coding' | 'writing' | 'analysis' | 'extraction' | 'agentic' | 'conversation';
export type Complexity = 'low' | 'medium' | 'high';

export type TaskProfile = {
  type: TaskType;
  typeLabel: string;
  complexity: Complexity;
  /** Words the classifier keyed on, for transparency. */
  signals: string[];
};

export type DecisionPoint = {
  /** The fragment of the prompt that forces a choice. */
  excerpt: string;
  /** What the model will have to decide because of it. */
  decision: string;
};

export type PlanStep = {
  label: string;
  detail: string;
};

export type ModelAssessment = {
  model: Model;
  /** Estimated USD for one run (input + estimated output). */
  costPerRun: number;
  /** Estimated USD for 1,000 runs. */
  costPer1k: number;
  /** Whether this model's quality clears the task's complexity bar. */
  fits: boolean;
  /** 0-100 preference-weighted score; highest wins the recommendation. */
  score: number;
  /** How this model would work this specific prompt, step by step. */
  plan: PlanStep[];
  /** One-line summary of how its behavior differs on this prompt. */
  behavior: string;
};

export type Preference = 'cheapest' | 'balanced' | 'quality';

export type PromptAnalysis = {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  inputTokens: number;
  estOutputTokens: number;
  wordCount: number;
  profile: TaskProfile;
  issues: Issue[];
  strengths: string[];
  decisions: DecisionPoint[];
  assessments: ModelAssessment[];
  recommended: ModelId;
};

/* -------------------------------- profiling ------------------------------- */

const TYPE_SIGNALS: Record<TaskType, { label: string; words: RegExp[] }> = {
  coding: {
    label: 'Coding',
    words: [/\bcode\b/, /\bfunction\b/, /\brefactor/, /\bbug\b/, /\bapi\b/, /\btest(s|ing)?\b/, /\btypescript|python|javascript|java|sql|css|html\b/, /\bimplement/, /\bcompile|debug/],
  },
  extraction: {
    label: 'Extraction / structuring',
    words: [/\bextract/, /\bparse/, /\bjson\b/, /\bcsv\b/, /\bfields?\b/, /\bschema\b/, /\bclassif/, /\bcategori[sz]e/, /\blabel\b/],
  },
  analysis: {
    label: 'Analysis / research',
    words: [/\banaly[sz]e/, /\bcompare/, /\bevaluate/, /\bresearch/, /\bsummari[sz]e/, /\breview\b/, /\bassess/, /\breport\b/, /\bfindings?\b/],
  },
  writing: {
    label: 'Writing / content',
    words: [/\bwrite\b/, /\bdraft/, /\bblog\b/, /\bemail\b/, /\barticle/, /\bcopy\b/, /\brewrite/, /\btone\b/, /\bpost\b/],
  },
  agentic: {
    label: 'Agentic / multi-step',
    words: [/\bagent/, /\bworkflow/, /\bsteps?\b/, /\btools?\b/, /\bbrowse/, /\bsearch the web/, /\bfile(s)?\b/, /\brepo(sitory)?\b/, /\bautomate/, /\buntil\b/, /\bloop\b/, /\bdeploy/],
  },
  conversation: {
    label: 'Conversation / Q&A',
    words: [/\bexplain/, /\bwhat is/, /\bhow do(es)?\b/, /\bwhy\b/, /\bhelp me understand/, /\banswer/],
  },
};

function classify(text: string): TaskProfile {
  const lower = text.toLowerCase();
  let best: TaskType = 'conversation';
  let bestHits: string[] = [];
  for (const [type, cfg] of Object.entries(TYPE_SIGNALS) as [TaskType, (typeof TYPE_SIGNALS)[TaskType]][]) {
    const hits = cfg.words.filter((w) => w.test(lower)).map((w) => String(w).replace(/\\b|[/\\^$]/g, '').slice(0, 24));
    if (hits.length > bestHits.length) {
      best = type;
      bestHits = hits;
    }
  }

  const words = countWords(text);
  const reasoningWords = (lower.match(/\b(then|after|first|finally|ensure|verify|must|constraint|trade-?off|depend|unless|except)\b/g) ?? []).length;
  const structure = (text.match(/^\s*([-*#]|\d+\.)/gm) ?? []).length;
  const complexityScore = words / 80 + reasoningWords * 0.6 + structure * 0.4 + (best === 'agentic' ? 2 : 0);
  const complexity: Complexity = complexityScore >= 5 ? 'high' : complexityScore >= 2 ? 'medium' : 'low';

  return { type: best, typeLabel: TYPE_SIGNALS[best].label, complexity, signals: bestHits.slice(0, 5) };
}

/* --------------------------------- review --------------------------------- */

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function reviewPrompt(text: string, profile: TaskProfile): { issues: Issue[]; strengths: string[] } {
  const issues: Issue[] = [];
  const strengths: string[] = [];
  const lower = text.toLowerCase();
  const words = countWords(text);

  if (words < 15) {
    issues.push({
      severity: 'high',
      title: 'Very short prompt',
      detail: 'Under ~15 words the model fills the gaps with assumptions, and different models will fill them differently.',
      fix: 'Add the context the model cannot guess: what the input is, who the output is for, and what a good result looks like.',
    });
  }

  const hasFormat = /\b(json|markdown|table|bullet|list|csv|yaml|xml|format|template|schema|paragraph|slide)\b/i.test(text);
  if (!hasFormat && profile.type !== 'conversation') {
    issues.push({
      severity: 'medium',
      title: 'No output format specified',
      detail: 'The response shape is left to the model, so it will vary between runs and between models.',
      fix: 'Name the format you want ("respond as a markdown table with columns ...", "return JSON matching this schema").',
    });
  } else if (hasFormat) {
    strengths.push('Specifies an output format, which keeps responses consistent across runs and models.');
  }

  const vague = lower.match(/\b(some|a few|several|stuff|things|etc\.?|and so on|whatever|maybe|nice|good|better)\b/g) ?? [];
  if (vague.length >= 3) {
    issues.push({
      severity: 'medium',
      title: 'Vague quantifiers and hedges',
      detail: `Words like ${[...new Set(vague)].slice(0, 4).map((v) => `"${v}"`).join(', ')} leave the model to decide scope and quality bars for you.`,
      fix: 'Replace hedges with numbers and criteria: "the 3 highest-impact issues", "under 200 words", "must pass the linter".',
    });
  }

  const wantsBrief = /\b(brief|concise|short|quick|tl;?dr)\b/i.test(text);
  const wantsDeep = /\b(detailed|comprehensive|thorough|in-?depth|exhaustive|complete)\b/i.test(text);
  if (wantsBrief && wantsDeep) {
    issues.push({
      severity: 'high',
      title: 'Conflicting length instructions',
      detail: 'The prompt asks for both brevity and depth; each model resolves that conflict differently.',
      fix: 'Pick one, or split it: "a 3-sentence summary followed by a detailed appendix".',
    });
  }

  const negations = (lower.match(/\b(don'?t|do not|never|avoid|no\s+\w+)\b/g) ?? []).length;
  if (negations >= 4) {
    issues.push({
      severity: 'low',
      title: 'Negation-heavy instructions',
      detail: `${negations} "don't/never/avoid" style rules. Models follow positive instructions more reliably than lists of prohibitions.`,
      fix: 'Rephrase the most important ones positively: instead of "don\'t be verbose", say "keep each answer under 3 sentences".',
    });
  }

  const hasCriteria = /\b(success|done when|acceptance|criteria|must|should include|verify|check that|pass(es)?\b)/i.test(text);
  if (!hasCriteria && (profile.complexity !== 'low' || profile.type === 'agentic')) {
    issues.push({
      severity: 'medium',
      title: 'No success criteria',
      detail: 'Nothing tells the model (or you) how to judge whether the output is right, so weaker models will stop early.',
      fix: 'State what "done" looks like: "done when all tests pass", "must cite at least two sources per claim".',
    });
  } else if (hasCriteria) {
    strengths.push('States success criteria, which lets stronger models self-verify before answering.');
  }

  const hasExample = /\b(example|e\.g\.|for instance|like this|sample)\b/i.test(text);
  if (hasExample) {
    strengths.push('Includes an example, the single highest-leverage way to pin down format and tone.');
  } else if (profile.type === 'extraction' || profile.type === 'writing') {
    issues.push({
      severity: 'low',
      title: 'No example provided',
      detail: `${profile.typeLabel} tasks are very sensitive to format and tone; one example removes most of that variance.`,
      fix: 'Paste one input/output pair, even a rough one.',
    });
  }

  const hasRole = /\b(you are|act as|as a|role|persona)\b/i.test(text);
  if (hasRole) strengths.push('Sets a role or perspective for the model to answer from.');

  const unbounded = lower.match(/\b(all|every|everything|entire|any)\b/g) ?? [];
  if (unbounded.length >= 3 && profile.type === 'agentic') {
    issues.push({
      severity: 'medium',
      title: 'Unbounded scope',
      detail: 'Words like "all"/"every" on a multi-step task can send an agent into a much longer, costlier run than intended.',
      fix: 'Bound the work: "the 10 most recently changed files", "stop after 20 attempts and report".',
    });
  }

  if (words > 120 && (text.match(/\n/g) ?? []).length < 2) {
    issues.push({
      severity: 'low',
      title: 'Wall of text',
      detail: 'Long prompts without structure bury the important instructions in the middle, where they are most often missed.',
      fix: 'Break it into sections (context, task, constraints, output format) or a numbered list.',
    });
  } else if ((text.match(/^\s*([-*#]|\d+\.)/gm) ?? []).length >= 2) {
    strengths.push('Structured with lists or headings, so instructions are hard to miss.');
  }

  if (/—/.test(text)) {
    issues.push({
      severity: 'low',
      title: 'Em dashes in the prompt',
      detail: 'If this prompt produces user-facing text, em dashes in the prompt tend to leak into the output.',
      fix: 'Swap em dashes for commas, colons, or separate sentences.',
    });
  }

  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  return { issues, strengths };
}

/* -------------------------------- decisions ------------------------------- */

/** Find the points where the prompt forces the model to make a judgment call. */
function findDecisions(text: string, profile: TaskProfile, issues: Issue[]): DecisionPoint[] {
  const out: DecisionPoint[] = [];
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

  for (const s of sentences) {
    if (out.length >= 6) break;
    const lower = s.toLowerCase();
    const excerpt = s.length > 90 ? `${s.slice(0, 87)}...` : s;
    if (/\b(if|when|unless|depending)\b/.test(lower)) {
      out.push({ excerpt, decision: 'Evaluate the condition and branch; the model decides which side applies to your input.' });
    } else if (/\b(or|either)\b/.test(lower) && !/\bformat\b/.test(lower)) {
      out.push({ excerpt, decision: 'Choose between the alternatives; without a tiebreaker, each model may pick differently.' });
    } else if (/\b(best|most|prioriti[sz]e|important|appropriate|relevant)\b/.test(lower)) {
      out.push({ excerpt, decision: 'Rank by an unstated quality bar; the model supplies its own definition of "best".' });
    } else if (/\b(decide|choose|pick|select|judge)\b/.test(lower)) {
      out.push({ excerpt, decision: 'An explicit judgment call delegated to the model.' });
    }
  }

  if (out.length === 0) {
    out.push({
      excerpt: '(no explicit branches found)',
      decision:
        issues.length > 0
          ? 'The main decisions the model makes here come from what the prompt leaves unspecified; see the issues above.'
          : 'A straight-line task: the model mostly executes rather than decides.',
    });
  }
  return out;
}

/* ----------------------------- per-model plans ----------------------------- */

function planFor(model: Model, profile: TaskProfile, text: string): PlanStep[] {
  const steps: PlanStep[] = [];
  const depth = model.planning.depth;
  const mentionsContext = /\b(file|repo|document|data|attached|codebase|above|below)\b/i.test(text);

  steps.push({
    label: 'Read',
    detail: model.planning.approach,
  });
  if (depth >= 3 && profile.complexity !== 'low') {
    steps.push({
      label: 'Clarify intent',
      detail: 'Resolves ambiguities explicitly (or states its assumptions) instead of guessing silently.',
    });
  }
  if (mentionsContext && depth >= 2) {
    steps.push({
      label: 'Gather context',
      detail: 'Pulls in the referenced files or data before acting, so decisions are grounded.',
    });
  } else if (mentionsContext) {
    steps.push({
      label: 'Skim context',
      detail: 'Looks at referenced material only as far as needed for a direct answer.',
    });
  }
  if (depth >= 2 && profile.complexity !== 'low') {
    steps.push({
      label: 'Plan',
      detail: depth >= 4 ? 'Breaks the task into ordered sub-goals with checks between them.' : 'Sketches a short ordered plan.',
    });
  }
  steps.push({
    label: 'Execute',
    detail:
      profile.type === 'coding'
        ? 'Writes the code (and tests, if asked).'
        : profile.type === 'agentic'
          ? 'Works the steps, calling tools as needed.'
          : profile.type === 'extraction'
            ? 'Extracts and structures the requested fields.'
            : 'Produces the deliverable.',
  });
  if (depth >= 4 && profile.complexity === 'high') {
    steps.push({
      label: 'Iterate',
      detail: 'Runs its own checks and loops until the success criteria pass or it hits a hard blocker.',
    });
  }
  if (depth >= 2) {
    steps.push({ label: 'Verify', detail: model.planning.finish });
  } else {
    steps.push({ label: 'Answer', detail: model.planning.finish });
  }
  return steps;
}

function behaviorFor(model: Model, profile: TaskProfile): string {
  if (model.planning.depth === 1) {
    return profile.complexity === 'high'
      ? 'Will answer fast but is likely to miss edge cases on a task this complex.'
      : 'Answers fast; for a task this size that is usually all you need.';
  }
  if (model.planning.depth === 2) {
    return profile.complexity === 'high'
      ? 'Handles most of this well; may need a second prompt for the hardest edge cases.'
      : 'A strong default: plans just enough without over-working the task.';
  }
  if (model.planning.depth === 3) {
    return profile.complexity === 'low'
      ? 'Will do excellent work but spends more planning than this task needs.'
      : 'Plans, executes, and verifies; well matched to multi-part work.';
  }
  return profile.complexity === 'high'
    ? 'Built for exactly this: deep planning, self-verification, and long autonomy.'
    : 'Maximum rigor; overkill for a task this size unless correctness is critical.';
}

/* ------------------------------ recommendation ----------------------------- */

const OUTPUT_BASE: Record<TaskType, number> = {
  conversation: 300,
  extraction: 400,
  analysis: 900,
  writing: 900,
  coding: 1400,
  agentic: 2600,
};
const COMPLEXITY_MULT: Record<Complexity, number> = { low: 0.6, medium: 1, high: 1.8 };
const QUALITY_BAR: Record<Complexity, number> = { low: 2.5, medium: 3.8, high: 4.5 };

export function analyzePrompt(text: string, preference: Preference): PromptAnalysis {
  const profile = classify(text);
  const { issues, strengths } = reviewPrompt(text, profile);
  const decisions = findDecisions(text, profile, issues);

  const inputTokens = Math.max(1, Math.ceil(text.length / 4));
  const estOutputTokens = Math.round(OUTPUT_BASE[profile.type] * COMPLEXITY_MULT[profile.complexity]);

  const bar = QUALITY_BAR[profile.complexity];
  const costs = models.map((m) => (inputTokens / 1e6) * m.inputPer1M + (estOutputTokens / 1e6) * m.outputPer1M);
  const maxCost = Math.max(...costs);

  const raw = new Map<ModelId, number>();
  const assessments: ModelAssessment[] = models.map((m, i) => {
    const costPerRun = costs[i];
    const fits = m.quality + 0.15 >= bar;
    // For "quality", rank by capability directly; otherwise trade quality
    // against normalized cost. The unclamped score picks the winner (clamping
    // first would let two strong models tie at 100); the clamp is display-only.
    const qualityScore = preference === 'quality' ? m.quality / 5 : Math.min(m.quality / bar, 1.25);
    const costScore = 1 - costPerRun / maxCost;
    const weights =
      preference === 'cheapest'
        ? { q: 0.35, c: 0.65 }
        : preference === 'quality'
          ? { q: 0.92, c: 0.08 }
          : { q: 0.6, c: 0.4 };
    let score = (weights.q * qualityScore + weights.c * costScore) * 100;
    if (!fits) score -= preference === 'cheapest' ? 25 : 45;
    raw.set(m.id, score);
    return {
      model: m,
      costPerRun,
      costPer1k: costPerRun * 1000,
      fits,
      score: Math.round(Math.max(0, Math.min(100, score))),
      plan: planFor(m, profile, text),
      behavior: behaviorFor(m, profile),
    };
  });

  const recommended = [...assessments].sort((a, b) => (raw.get(b.model.id) ?? 0) - (raw.get(a.model.id) ?? 0))[0].model.id;

  const penalty = issues.reduce((acc, i) => acc + (i.severity === 'high' ? 22 : i.severity === 'medium' ? 12 : 5), 0);
  const bonus = Math.min(strengths.length * 4, 12);
  const score = Math.max(5, Math.min(100, 92 - penalty + bonus));
  const grade = score >= 85 ? 'A' : score >= 68 ? 'B' : score >= 50 ? 'C' : 'D';

  return {
    score,
    grade,
    inputTokens,
    estOutputTokens,
    wordCount: countWords(text),
    profile,
    issues,
    strengths,
    decisions,
    assessments,
    recommended,
  };
}
