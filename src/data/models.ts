/**
 * The model catalog behind prompt analysis.
 *
 * Typed, static data about the Claude model family: pricing, context, and
 * coarse quality/speed ratings that the analyzer uses to recommend a model
 * for a prompt (by preference: cheapest that fits, best quality, or balanced)
 * and to sketch how each model would plan its way through the same prompt.
 * Prices are USD per million tokens (sticker prices as of 2026-07).
 */

export type ModelId =
  | 'claude-fable-5'
  | 'claude-opus-4-8'
  | 'claude-sonnet-5'
  | 'claude-haiku-4-5';

export type Model = {
  id: ModelId;
  name: string;
  /** Short positioning line shown on the compare cards. */
  blurb: string;
  /** USD per 1M input tokens. */
  inputPer1M: number;
  /** USD per 1M output tokens. */
  outputPer1M: number;
  /** Context window, tokens. */
  context: number;
  /** Max output tokens per request. */
  maxOutput: number;
  /** Coarse capability rating, 1-5. Drives the fit-vs-complexity check. */
  quality: number;
  /** Coarse latency rating, 1-5 (5 = fastest to first useful answer). */
  speed: number;
  /**
   * How this model tends to work a prompt. Feeds the per-model plan paths:
   * depth = how many planning/verification steps it inserts, and the two
   * style lines describe its default behavior at the start and end of a run.
   */
  planning: {
    depth: 1 | 2 | 3 | 4;
    approach: string;
    finish: string;
  };
};

export const models: Model[] = [
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    blurb: 'Fastest and cheapest; best for simple, high-volume tasks.',
    inputPer1M: 1,
    outputPer1M: 5,
    context: 200_000,
    maxOutput: 64_000,
    quality: 3,
    speed: 5,
    planning: {
      depth: 1,
      approach: 'Reads the prompt once and answers directly, with little or no explicit planning.',
      finish: 'Returns the first complete answer; will not self-review unless told to.',
    },
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    blurb: 'Near-Opus quality on coding and agentic work at Sonnet cost.',
    inputPer1M: 3,
    outputPer1M: 15,
    context: 1_000_000,
    maxOutput: 128_000,
    quality: 4.3,
    speed: 4,
    planning: {
      depth: 2,
      approach: 'Sketches a short plan when the task has parts, then executes it in order.',
      finish: 'Runs a quick self-check against the stated requirements before answering.',
    },
  },
  {
    id: 'claude-opus-4-8',
    name: 'Claude Opus 4.8',
    blurb: 'The most capable Opus; strong long-horizon and knowledge work.',
    inputPer1M: 5,
    outputPer1M: 25,
    context: 1_000_000,
    maxOutput: 128_000,
    quality: 4.7,
    speed: 3,
    planning: {
      depth: 3,
      approach: 'Restates intent, gathers the context it needs, and plans before acting.',
      finish: 'Verifies the result against the prompt and flags anything it had to assume.',
    },
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    blurb: 'The most capable model; deepest reasoning, longest autonomy.',
    inputPer1M: 10,
    outputPer1M: 50,
    context: 1_000_000,
    maxOutput: 128_000,
    quality: 5,
    speed: 2,
    planning: {
      depth: 4,
      approach: 'Builds a full mental model of the task first: context, constraints, and what "done" means.',
      finish: 'Sets up its own checks, iterates until they pass, then reports what was verified.',
    },
  },
];

export const modelById = (id: ModelId): Model => models.find((m) => m.id === id)!;

export function formatUsd(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(5)}`;
}
