'use client';

/**
 * A keyboard shortcut layer + command palette for the whole app. The power-user
 * surfaces (/skills, /prompts, /config, plus /hud and /watch) had no shortcuts
 * at all. This adds:
 *   - Cmd/Ctrl+K to open a searchable command palette (navigation + links).
 *   - A "leader" layer: press `g` then s/p/c/h/w/o to jump between surfaces.
 *   - `?` to open the palette focused on its help.
 *
 * The palette is a real modal dialog: role="dialog" + aria-modal, focus is
 * trapped while open, Escape closes it, focus returns to whatever was focused
 * before, and the rest of the page is marked `inert`/aria-hidden.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { nav, site } from '@/lib/site';
import { ArrowRightIcon, GitHubIcon, SearchIcon } from './icons';

type Command = {
  id: string;
  label: string;
  hint: string;
  keywords?: string;
  /** Leader key: the letter pressed after `g`. */
  leader?: string;
  run: () => void;
};

/** Elements outside the dialog to deactivate while it is open. */
function backgroundEls(): HTMLElement[] {
  if (typeof document === 'undefined') return [];
  return ['header', 'main', 'footer']
    .map((sel) => document.querySelector<HTMLElement>(sel))
    .filter((el): el is HTMLElement => el != null);
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const leaderRef = useRef(false);
  const leaderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const commands = useMemo<Command[]>(() => {
    const leaderFor: Record<string, string> = {
      '/skills': 's',
      '/prompts': 'p',
      '/config': 'c',
      '/hud': 'h',
      '/watch': 'w',
    };
    const navCommands: Command[] = nav.map((item) => ({
      id: `nav:${item.href}`,
      label: `Go to ${item.label}`,
      hint: leaderFor[item.href] ? `g ${leaderFor[item.href]}` : '',
      keywords: `${item.label} ${item.href}`,
      leader: leaderFor[item.href],
      run: () => router.push(item.href),
    }));
    return [
      {
        id: 'nav:/',
        label: 'Go to Home',
        hint: 'g o',
        keywords: 'home landing overview',
        leader: 'o',
        run: () => router.push('/'),
      },
      ...navCommands,
      {
        id: 'link:github',
        label: 'Open Vaizer on GitHub',
        hint: '',
        keywords: 'github source repository code',
        run: () => window.open(site.githubUrl, '_blank', 'noopener,noreferrer'),
      },
    ];
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q));
  }, [commands, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  const runCommand = useCallback(
    (command: Command) => {
      close();
      command.run();
    },
    [close],
  );

  // Global shortcut layer: open the palette, or navigate via the leader key.
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Toggle the palette from anywhere with Cmd/Ctrl+K.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (open) return;
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      // `?` opens the palette.
      if (e.key === '?') {
        e.preventDefault();
        setOpen(true);
        return;
      }

      // Leader: `g` then a destination key.
      if (leaderRef.current) {
        const match = commands.find((c) => c.leader === e.key.toLowerCase());
        leaderRef.current = false;
        if (leaderTimer.current) clearTimeout(leaderTimer.current);
        if (match) {
          e.preventDefault();
          match.run();
        }
        return;
      }
      if (e.key.toLowerCase() === 'g') {
        leaderRef.current = true;
        if (leaderTimer.current) clearTimeout(leaderTimer.current);
        leaderTimer.current = setTimeout(() => {
          leaderRef.current = false;
        }, 1200);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (leaderTimer.current) clearTimeout(leaderTimer.current);
    };
  }, [open, commands]);

  // Manage focus + background inertness for the open dialog.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const els = backgroundEls();
    els.forEach((el) => {
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    });
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      clearTimeout(focusTimer);
      els.forEach((el) => {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      });
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  // Keep the active option in range as the list filters.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (filtered.length ? (a + 1) % filtered.length : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (filtered.length ? (a - 1 + filtered.length) % filtered.length : 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = filtered[active];
      if (command) runCommand(command);
      return;
    }
    // Simple focus trap: only the input and the option buttons are tabbable,
    // so cycle between the input and the active option.
    if (e.key === 'Tab') {
      e.preventDefault();
      if (document.activeElement === inputRef.current) {
        const el = dialogRef.current?.querySelector<HTMLElement>('[data-active-option="true"]');
        el?.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[15vh]"
      onKeyDown={onDialogKeyDown}
    >
      <button
        type="button"
        aria-label="Close command palette"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-fg/30 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="vaizer-enter relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-autocomplete="list"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Type a command or search…"
            className="w-full bg-transparent py-3.5 text-sm text-fg outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">
            Esc
          </kbd>
        </div>

        <ul id="command-palette-list" role="listbox" aria-label="Commands" className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">No matching commands.</li>
          )}
          {filtered.map((command, i) => {
            const isActive = i === active;
            return (
              <li key={command.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  data-active-option={isActive ? 'true' : undefined}
                  onClick={() => runCommand(command)}
                  onMouseMove={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive ? 'bg-accent/10 text-accent' : 'text-fg hover:bg-surface-2'
                  }`}
                >
                  {command.id === 'link:github' ? (
                    <GitHubIcon className="h-4 w-4 shrink-0 text-muted" />
                  ) : (
                    <ArrowRightIcon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : 'text-muted'}`} />
                  )}
                  <span className="flex-1">{command.label}</span>
                  {command.hint && (
                    <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">
                      {command.hint}
                    </kbd>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 text-[11px] text-muted">
          <span>
            <kbd className="font-mono">↑↓</kbd> to navigate · <kbd className="font-mono">↵</kbd> to run
          </span>
          <span>
            <kbd className="font-mono">g</kbd> then a key to jump
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
