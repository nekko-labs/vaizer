'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  layoutWorkflow,
  type LaidOutNode,
  type SkillNodeKind,
  type SkillWorkflow as SkillWorkflowGraph,
} from '@/data/skills';

/**
 * The skill workflow visualizer: an n8n / Make-style node canvas that shows the
 * steps a skill runs through, next to a side panel that walks the run in order.
 * Clicking a node (on the canvas or in the list) explains that step, what its
 * kind means, and where it branches or loops. Ported from the Open Paw desktop
 * app so the marketplace and the app speak one visual language for skills.
 */

/** Per-node-kind visual identity for the canvas. */
const KIND: Record<SkillNodeKind, { color: string; glyph: string; label: string }> = {
  trigger: { color: '#f59e0b', glyph: '⚡', label: 'Trigger' },
  context: { color: '#6f9bff', glyph: '▤', label: 'Context' },
  agent: { color: '#a78bfa', glyph: '✦', label: 'Agent' },
  tool: { color: '#4ec98a', glyph: '⚙', label: 'Tool' },
  decision: { color: '#fbbf24', glyph: '◆', label: 'Decision' },
  loop: { color: '#f472b6', glyph: '↻', label: 'Loop' },
  output: { color: '#34d399', glyph: '✓', label: 'Output' },
};

/** What each node kind means; teaching copy for the explainer panel. */
const KIND_EXPLAIN: Record<SkillNodeKind, string> = {
  trigger: 'Where the run starts: the /command you type (plus any arguments) kicks the skill off.',
  context: 'Gathers what the agent needs before it reasons: files, diffs, search results, inputs.',
  agent: 'A model reasoning step: the agent reads what it has, thinks, and decides or writes something.',
  tool: 'A concrete action in the world: editing a file, running a command, calling git or an API.',
  decision: 'A branch: the agent checks a condition and the run follows the matching labelled arrow.',
  loop: 'A repeating step: work keeps cycling through here until a later check says it is done.',
  output: 'The deliverable: what you get back when the run finishes.',
};

/** Human notes about a node's branches and loops ("free → Vet brand", "loops back…"). */
function describeEdges(nodeId: string, workflow: SkillWorkflowGraph): string[] {
  const byId = new Map(workflow.nodes.map((n) => [n.id, n]));
  const notes: string[] = [];
  for (const e of workflow.edges) {
    if (e.from === nodeId) {
      const to = byId.get(e.to);
      if (!to) continue;
      if (e.back) notes.push(`${e.label ? `${e.label}: ` : ''}loops back to “${to.label}”`);
      else if (e.label) notes.push(`${e.label} → “${to.label}”`);
    } else if (e.to === nodeId && e.back) {
      const from = byId.get(e.from);
      if (from) notes.push(`repeats after “${from.label}”`);
    }
  }
  return notes;
}

export function SkillWorkflow({ workflow }: { workflow: SkillWorkflowGraph }) {
  const [selId, setSelId] = useState<string | null>(null);
  useEffect(() => setSelId(null), [workflow]);

  const layout = useMemo(() => layoutWorkflow(workflow), [workflow]);
  const ordered = useMemo(
    () => [...layout.nodes].sort((a, b) => a.layer - b.layer || a.row - b.row),
    [layout],
  );
  const selNode = ordered.find((n) => n.id === selId) ?? null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold tracking-tight">Workflow</p>
        <Legend />
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Canvas */}
        <div
          className="min-w-0 flex-1 overflow-x-auto p-5"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg) 55%, transparent)',
            backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          <WorkflowCanvas
            workflow={workflow}
            selectedId={selId}
            onSelect={(id) => setSelId(id === selId ? null : id)}
          />
        </div>

        {/* Explainer panel */}
        <aside className="shrink-0 border-t border-border p-4 lg:w-72 lg:border-l lg:border-t-0">
          {selNode ? (
            <div>
              <button
                className="text-xs text-muted hover:text-fg"
                onClick={() => setSelId(null)}
              >
                ← All steps
              </button>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg" style={{ color: KIND[selNode.kind].color }}>
                  {KIND[selNode.kind].glyph}
                </span>
                <h3 className="text-base font-semibold">{selNode.label}</h3>
              </div>
              <span
                className="mt-2 inline-block rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium"
                style={{ color: KIND[selNode.kind].color }}
              >
                {KIND[selNode.kind].label} step
              </span>
              {selNode.detail && <p className="mt-3 text-sm text-subtle">{selNode.detail}</p>}
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {KIND_EXPLAIN[selNode.kind]}
              </p>
              {describeEdges(selNode.id, workflow).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Where it goes
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {describeEdges(selNode.id, workflow).map((n, i) => (
                      <li key={i} className="text-sm text-subtle">
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                How this skill runs
              </h3>
              <p className="mt-1 text-xs text-muted">
                Click any step, here or on the canvas, to see what it does.
              </p>
              <ol className="mt-3 space-y-1.5">
                {ordered.map((n, i) => (
                  <li key={n.id}>
                    <button
                      className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-2"
                      onClick={() => setSelId(n.id)}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                        style={{ background: KIND[n.kind].color }}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{n.label}</span>
                        <span className="block text-xs text-muted">
                          {n.detail || KIND[n.kind].label}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Legend() {
  const kinds: SkillNodeKind[] = ['trigger', 'context', 'agent', 'tool', 'decision', 'loop', 'output'];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {kinds.map((k) => (
        <span key={k} className="flex items-center gap-1 text-[11px] text-muted">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: KIND[k].color }} />
          {KIND[k].label}
        </span>
      ))}
    </div>
  );
}

/** n8n / Make-style node-graph rendering of a skill's workflow. */
function WorkflowCanvas({
  workflow,
  selectedId,
  onSelect,
}: {
  workflow: SkillWorkflowGraph;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const layout = useMemo(() => layoutWorkflow(workflow), [workflow]);
  const { nodes, edges, width, height, nodeW, nodeH } = layout;
  const pos = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <div className="relative" style={{ width, height, minWidth: width }}>
      <svg width={width} height={height} className="absolute inset-0" style={{ overflow: 'visible' }}>
        <defs>
          <marker
            id="dojo-wf-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const { d, lx, ly } = edgePath(a, b, nodeW, nodeH, e.back);
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={1.5}
                strokeDasharray={e.back ? '4 4' : undefined}
                markerEnd="url(#dojo-wf-arrow)"
                opacity={e.back ? 0.7 : 0.9}
              />
              {e.label && (
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  className="select-none"
                  style={{ fontSize: 10, fill: 'var(--subtle)' }}
                >
                  <tspan dy="-2">{e.label}</tspan>
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {nodes.map((n) => (
        <NodeCard
          key={n.id}
          node={n}
          w={nodeW}
          h={nodeH}
          selected={selectedId === n.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function NodeCard({
  node,
  w,
  h,
  selected,
  onSelect,
}: {
  node: LaidOutNode;
  w: number;
  h: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const k = KIND[node.kind];
  return (
    <button
      className="absolute flex flex-col justify-center overflow-hidden rounded-xl border border-border bg-surface px-3 py-2 text-left shadow-sm transition hover:border-accent"
      style={{
        left: node.x,
        top: node.y,
        width: w,
        height: h,
        borderLeft: `3px solid ${k.color}`,
        cursor: onSelect ? 'pointer' : 'default',
        boxShadow: selected ? `0 0 0 2px ${k.color}` : undefined,
      }}
      title={node.detail}
      onClick={() => onSelect?.(node.id)}
    >
      <div className="flex items-center gap-1.5">
        <span style={{ color: k.color }}>{k.glyph}</span>
        <span className="truncate text-[13px] font-medium leading-tight">{node.label}</span>
      </div>
      {node.detail && <p className="mt-0.5 truncate text-[11px] text-muted">{node.detail}</p>}
    </button>
  );
}

/** Bezier path between two node boxes; forward edges go right, back edges loop under. */
function edgePath(a: LaidOutNode, b: LaidOutNode, w: number, h: number, back?: boolean) {
  if (back) {
    const sx = a.x + w / 2;
    const sy = a.y + h;
    const tx = b.x + w / 2;
    const ty = b.y + h;
    const dip = Math.max(sy, ty) + 46;
    return {
      d: `M ${sx} ${sy} C ${sx} ${dip}, ${tx} ${dip}, ${tx} ${ty}`,
      lx: (sx + tx) / 2,
      ly: dip - 6,
    };
  }
  const sx = a.x + w;
  const sy = a.y + h / 2;
  const tx = b.x;
  const ty = b.y + h / 2;
  const dx = Math.max(28, (tx - sx) / 2);
  return {
    d: `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`,
    lx: (sx + tx) / 2,
    ly: (sy + ty) / 2 - 4,
  };
}
