import Link from 'next/link';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { ArrowRightIcon } from '@/components/icons';
import { VaizerMark } from '@/components/Logo';

/**
 * Marketing home. One scroll to grasp the pitch (agent and prompt management,
 * made visible) and route into the features: the skills workflow visualizer,
 * the prompt workbench, prompt config, the agent HUD, and the loop monitor.
 * Hand-built mini-previews carry each idea before you click through.
 */

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      {/* Hero */}
      <section className="grid items-center gap-12 pb-16 pt-20 sm:pt-28 lg:min-h-[70vh] lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="text-center lg:text-left">
          <Reveal load>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <VaizerMark className="h-4 w-4 text-accent" />
              Agent &amp; prompt management, made visible
            </span>
          </Reveal>
          <Reveal load delay={0.08}>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-accent">See</span>, shape, and{' '}
              <span className="text-signal">steer</span> your agents.
            </h1>
          </Reveal>
          <Reveal load delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-lg font-medium leading-relaxed text-muted lg:mx-0">
              Agents run on skills and prompts, then work mostly out of sight.
              Vaizer makes the whole loop legible: read a skill before you run
              it, analyze and version the prompts behind it, control what each
              environment serves, and watch every session from one HUD.
            </p>
          </Reveal>
          <Reveal load delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/prompts"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-fg transition-transform hover:-translate-y-0.5"
              >
                Analyze a prompt
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/hud"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-fg transition-colors hover:border-accent"
              >
                Open the HUD
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal load spring delay={0.2} className="flex justify-center lg:justify-end">
          <HeroGraph />
        </Reveal>
      </section>

      {/* What Vaizer covers */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted">
            One place to manage your agents
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <FeatureCard
              eyebrow="Skills"
              title="Break down any skill into a workflow"
              body="Skills are Markdown and tools; their real behavior is buried in prose. Vaizer renders any skill as a node graph, trigger to output, so you can read what it does and where it branches before you trust it with your machine. Browse the catalog, or paste any public skill and break it down."
              href="/skills"
              cta="Explore skills"
              preview={<WorkflowPreview />}
            />
          </Reveal>

          <Reveal delay={0.08}>
            <FeatureCard
              eyebrow="Prompts"
              title="Write, version, and analyze your prompts"
              body="A prompt library with history, plus instant analysis: the weak points and how to fix them, the decisions the prompt quietly hands to the model, what a run costs on each model, and which model should run it, tuned to whether you want the cheapest fit or the highest quality."
              href="/prompts"
              cta="Open the workbench"
              preview={<PromptPreview />}
            />
          </Reveal>

          <Reveal>
            <FeatureCard
              eyebrow="Config"
              title="Feature-flag your prompt config"
              body="The LaunchDarkly workflow, pointed at prompts. Toggle what each environment serves, promote a prompt from development to production without a deploy, and cache or invalidate served prompts on your schedule."
              href="/config"
              cta="See prompt config"
              preview={<ConfigPreview />}
            />
          </Reveal>

          <Reveal delay={0.08}>
            <FeatureCard
              eyebrow="HUD"
              title="Run every session from one command center"
              body="Long overnight loops and quick chats, side by side, with progress and spend per session. Self-running agents stay quiet while they work; the attention queue surfaces the few that actually need a human. For a single long run, the Watch view replays it as a journey toward the goal."
              href="/hud"
              cta="Open the HUD"
              preview={<HudPreview />}
            />
          </Reveal>
        </div>

        {/* Watch banner */}
        <Reveal className="mt-6">
          <Link
            href="/watch"
            className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">Watch</span>
              <h3 className="mt-1 text-lg font-semibold tracking-tight">Follow one long run as a journey toward victory</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Milestones on a path, a marker that advances, attempts that win or fail. Is it making progress? One glance.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <TrackPreview />
            </div>
          </Link>
        </Reveal>
      </section>

      {/* How it fits */}
      <section className="mt-24">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Built on one idea: agents are legible.
          </h2>
        </Reveal>
        <Stagger className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              n: '01',
              t: 'Read before you run',
              d: 'Every skill becomes a graph you can click through, and every prompt gets a review: what it will do, what it leaves to chance, and what it costs.',
            },
            {
              n: '02',
              t: 'Change without deploying',
              d: 'Prompts are config, not code. Version them, flag them per environment, and invalidate caches when you say so.',
            },
            {
              n: '03',
              t: 'Watch the momentum',
              d: 'The HUD shows every session and who needs you; Watch replays one long run as a path of milestones and attempts.',
            },
          ].map((item) => (
            <StaggerItem key={item.n}>
              <div className="h-full rounded-2xl border border-border bg-surface p-6">
                <div className="font-mono text-sm text-accent">{item.n}</div>
                <h3 className="mt-3 text-lg font-semibold">{item.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.d}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Closing CTA */}
      <section className="mt-24 pb-8 text-center">
        <Reveal>
          <VaizerMark className="mx-auto h-12 w-12 text-accent" />
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Stop guessing what your agents are doing.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-medium leading-relaxed text-muted">
            Analyze the prompt, flag the config, and keep every session in view.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/prompts"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-fg transition-transform hover:-translate-y-0.5"
            >
              Analyze a prompt
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/hud"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-fg transition-colors hover:border-accent"
            >
              Open the HUD
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function FeatureCard({
  eyebrow,
  title,
  body,
  href,
  cta,
  preview,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  preview: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="border-b border-border bg-bg/40 p-5">{preview}</div>
      <div className="flex flex-1 flex-col p-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent">
          {eyebrow}
        </span>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{body}</p>
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover"
        >
          {cta}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------ mini previews ----------------------------- */

/** Hero node graph: a compact static version of the workflow canvas. */
function HeroGraph() {
  const nodes = [
    { x: 12, y: 70, c: '#b45309', label: '/command' },
    { x: 118, y: 30, c: '#2563eb', label: 'context' },
    { x: 118, y: 110, c: '#7c3aed', label: 'agent' },
    { x: 224, y: 70, c: '#a16207', label: 'decide' },
    { x: 330, y: 30, c: '#0f766e', label: 'tool' },
    { x: 330, y: 110, c: '#db2777', label: 'loop' },
    { x: 436, y: 70, c: '#15803d', label: 'output' },
  ];
  const edges: Array<[number, number, boolean]> = [
    [0, 1, false],
    [0, 2, false],
    [1, 3, false],
    [2, 3, false],
    [3, 4, false],
    [3, 5, false],
    [4, 6, false],
    [5, 3, true],
  ];
  const cy = (n: (typeof nodes)[number]) => n.y + 16;
  return (
    <div
      className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface/80 p-4 shadow-2xl"
      style={{
        backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      <svg viewBox="0 0 516 156" className="h-auto w-full">
        <defs>
          <marker id="hero-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" />
          </marker>
        </defs>
        {edges.map(([a, b, back], i) => {
          const na = nodes[a];
          const nb = nodes[b];
          if (back) {
            const sx = na.x + 40;
            const tx = nb.x + 40;
            return (
              <path
                key={i}
                d={`M ${sx} ${na.y + 32} C ${sx} ${na.y + 78}, ${tx} ${nb.y + 78}, ${tx} ${nb.y + 32}`}
                fill="none"
                stroke="var(--muted)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.7"
                markerEnd="url(#hero-arrow)"
              />
            );
          }
          return (
            <path
              key={i}
              d={`M ${na.x + 80} ${cy(na)} C ${na.x + 100} ${cy(na)}, ${nb.x - 20} ${cy(nb)}, ${nb.x} ${cy(nb)}`}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="1.5"
              opacity="0.85"
              markerEnd="url(#hero-arrow)"
            />
          );
        })}
        {nodes.map((n, i) => (
          <g key={i}>
            <rect
              x={n.x}
              y={n.y}
              width="80"
              height="32"
              rx="8"
              fill="var(--surface-2)"
              stroke="var(--border)"
            />
            <rect x={n.x} y={n.y} width="3" height="32" rx="1.5" fill={n.c} />
            <circle cx={n.x + 14} cy={cy(n)} r="3.5" fill={n.c} />
            <text x={n.x + 24} y={cy(n) + 3.5} fontSize="10" fill="var(--subtle)" fontFamily="var(--font-mono)">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Compact workflow strip for the Skills feature card. */
function WorkflowPreview() {
  const steps = [
    { c: '#b45309', label: 'trigger' },
    { c: '#2563eb', label: 'context' },
    { c: '#7c3aed', label: 'reason' },
    { c: '#0f766e', label: 'tool' },
    { c: '#15803d', label: 'output' },
  ];
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs"
            style={{ borderLeft: `3px solid ${s.c}` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: s.c }} />
            <span className="font-mono text-subtle">{s.label}</span>
          </span>
          {i < steps.length - 1 && <span className="text-muted">→</span>}
        </div>
      ))}
    </div>
  );
}

/** Prompt-analysis strip for the Prompts feature card. */
function PromptPreview() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-surface-2">
        <span className="text-lg font-bold text-accent">B</span>
        <span className="font-mono text-[9px] text-muted">74/100</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {[
          ['bg-[#dc2626]', 'Conflicting length instructions'],
          ['bg-[#b45309]', 'No success criteria'],
          ['bg-signal', 'Pick: Sonnet 5 · $0.014 per run'],
        ].map(([dot, label]) => (
          <div key={label} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span className="truncate font-mono text-[10px] text-subtle">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Flag-toggle strip for the Config feature card. */
function ConfigPreview() {
  const rows: Array<[string, boolean, boolean, boolean]> = [
    ['system-prompt.greeting', true, true, true],
    ['policy.escalation-v2', true, true, false],
    ['style.tone-experiment', true, false, true],
  ];
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_repeat(3,34px)] items-center gap-1 px-2.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
        <span>flag</span>
        <span className="text-center">dev</span>
        <span className="text-center">stg</span>
        <span className="text-center">prod</span>
      </div>
      {rows.map(([key, ...envs]) => (
        <div key={key as string} className="grid grid-cols-[1fr_repeat(3,34px)] items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
          <span className="truncate font-mono text-[10px] text-subtle">{key}</span>
          {(envs as boolean[]).map((on, i) => (
            <span key={i} className={`mx-auto h-3 w-6 rounded-full ${on ? 'bg-accent' : 'bg-border'} relative`}>
              <span className={`absolute top-0.5 h-2 w-2 rounded-full bg-surface ${on ? 'right-0.5' : 'left-0.5'}`} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Fleet strip for the HUD feature card. */
function HudPreview() {
  const rows: Array<{ name: string; status: string; dot: string; pct: number }> = [
    { name: 'DB migration loop', status: 'running', dot: 'bg-signal', pct: 64 },
    { name: 'Dependency audit', status: 'needs you', dot: 'bg-[#dc2626]', pct: 80 },
    { name: 'Chat: billing spec', status: 'running', dot: 'bg-signal', pct: 55 },
  ];
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.dot}`} />
          <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-subtle">{r.name}</span>
          <span className="hidden font-mono text-[9px] text-muted sm:block">{r.status}</span>
          <span className="h-1 w-14 shrink-0 overflow-hidden rounded-full bg-border">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${r.pct}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Path-to-victory strip for the Watch feature card. */
function TrackPreview() {
  const stops = [
    { done: true, label: 'setup' },
    { done: true, label: 'first pass' },
    { current: true, label: 'fix errors' },
    { label: 'tests green' },
    { win: true, label: 'ship' },
  ];
  return (
    <div className="relative flex items-center justify-between">
      <div className="absolute left-3 right-3 top-3 h-0.5 bg-border" />
      <div className="absolute left-3 top-3 h-0.5 bg-signal" style={{ width: '45%' }} />
      {stops.map((s) => (
        <div key={s.label} className="relative flex flex-col items-center gap-2">
          <span
            className={`h-6 w-6 rounded-full border-2 ${
              s.win
                ? 'border-signal bg-signal/20'
                : s.done
                  ? 'border-signal bg-signal'
                  : s.current
                    ? 'vaizer-pulse border-accent bg-accent'
                    : 'border-border bg-surface'
            }`}
          />
          <span className="text-[10px] font-medium text-muted">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
