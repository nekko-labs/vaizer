import type { Metadata } from 'next';
import { PromptWorkbench } from '@/components/PromptWorkbench';
import { Reveal } from '@/components/motion';

export const metadata: Metadata = {
  title: 'Prompts',
  description:
    'Write, store, and version your prompts, and analyze each one: issues and weak points, the decisions it hands to the model, cost per model, and which model should run it.',
};

export default function PromptsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Reveal as="header" load className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Prompt workbench</h1>
        <p className="mt-3 text-lg text-muted">
          Write and version prompts, then see what they will actually do:{' '}
          <span className="text-fg">the weak points, the decisions the model makes for you, what each model would cost, and which one should
          run it</span>. Analysis is instant and runs entirely in your browser.
        </p>
      </Reveal>

      <Reveal load delay={0.1} className="mt-8">
        <PromptWorkbench />
      </Reveal>
    </div>
  );
}
