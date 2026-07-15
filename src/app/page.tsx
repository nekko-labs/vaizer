import Link from 'next/link';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { ArrowRightIcon } from '@/components/icons';
import { VaizerMark } from '@/components/Logo';

/**
 * Marketing home. One scroll to grasp the pitch (see how your agents work and
 * what they are focused on) and route into the two features: the skills
 * workflow visualizer and the agent-loop monitor. Two hand-built mini-previews
 * carry the idea before you click through.
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
              Agent observability, made readable
            </span>
          </Reveal>
          <Reveal load delay={0.08}>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              See how your agents, skills, and harness
              <br />
              <span className="text-accent">works</span> and what they&apos;re{' '}
              <span className="text-signal">focused on</span>.
            </h1>
          </Reveal>
          <Reveal load delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-lg font-medium leading-relaxed text-muted lg:mx-0">
              Agents run skills, branch on decisions, and grind through long
              loops, mostly out of sight. Vaizer turns that black box into
              something you can read and watch: the shape of a skill before you
              run it, and the progress of a loop while it runs.
            </p>
          </Reveal>
          <Reveal load delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/skills"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-fg transition-transform hover:-translate-y-0.5"
              >
                Explore skills
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/watch"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-fg transition-colors hover:border-accent"
              >
                Watch a run
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal load spring delay={0.2} className="flex justify-center lg:justify-end">
          <HeroGraph />
        </Reveal>
      </section>

      {/* What Vaizer sees */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted">
            Two ways to see
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Feature 1: skills visualizer */}
          <Reveal>
            <FeatureCard
              eyebrow="Skills"
              title="Break down any skill into a workflow"
              body="Skills are Markdown and tools; their real behavior is buried in prose. Vaizer renders any skill as a node graph, trigger to output, so you can read what it does and where it branches before you trust it with your machine. Browse the catalog, or paste a public skill (like Anthropic's official ones) and break it down."
              href="/skills"
              cta="Explore skills"
              preview={<WorkflowPreview />}
            />
          </Reveal>

          {/* Feature 2: watch */}
          <Reveal delay={0.08}>
            <FeatureCard
              eyebrow="Watch"
              title="Watch a long loop reach the goal"
              body="Long autonomous runs are a wall of logs or nothing at all. Vaizer reframes a loop as a journey toward victory: milestones on a path, a marker that advances, attempts that win or fail. Keep it open and answer the only question that matters, is it making progress, at a glance."
              href="/watch"
              cta="Watch a run"
              preview={<TrackPreview />}
            />
          </Reveal>
        </div>
      </section>

      {/* How it fits */}
      <section className="mt-24">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Built on one idea: You can visualize anything.
          </h2>
        </Reveal>
        <Stagger className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              n: '01',
              t: 'Read before you run',
              d: 'Every skill becomes a graph you can click through, step by step, with plain-English explanations of triggers, tools, decisions, and loops.',
            },
            {
              n: '02',
              t: 'Any public skill',
              d: 'Point Vaizer at a GitHub URL. It fetches the SKILL.md, parses it, and draws the same workflow, even for skills that are not in our catalog.',
            },
            {
              n: '03',
              t: 'Watch the momentum',
              d: 'A run is a goal, a path of milestones, and a stream of attempts. Vaizer shows how far along it is and what it just tried.',
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
            Stop guessing what your agent is doing.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-medium leading-relaxed text-muted">
            Start with a skill breakdown, then keep a run in view.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/skills/inspect"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-fg transition-transform hover:-translate-y-0.5"
            >
              Break down a skill
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/watch"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-fg transition-colors hover:border-accent"
            >
              Watch a run
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
    { x: 12, y: 70, c: '#f59e0b', label: '/command' },
    { x: 118, y: 30, c: '#6f9bff', label: 'context' },
    { x: 118, y: 110, c: '#a78bfa', label: 'agent' },
    { x: 224, y: 70, c: '#fbbf24', label: 'decide' },
    { x: 330, y: 30, c: '#4ec98a', label: 'tool' },
    { x: 330, y: 110, c: '#f472b6', label: 'loop' },
    { x: 436, y: 70, c: '#34d399', label: 'output' },
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
    { c: '#f59e0b', label: 'trigger' },
    { c: '#6f9bff', label: 'context' },
    { c: '#a78bfa', label: 'reason' },
    { c: '#4ec98a', label: 'tool' },
    { c: '#34d399', label: 'output' },
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
