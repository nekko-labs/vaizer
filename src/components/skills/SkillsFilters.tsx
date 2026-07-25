'use client';

import { categoryLabels, type SkillCategory } from '@/data/skills';
import { chipClass } from './helpers';

/** Category chip row for the browsable catalog. */
export function SkillsFilters({
  categories,
  category,
  setCategory,
}: {
  categories: SkillCategory[];
  category: SkillCategory | 'all';
  setCategory: (c: SkillCategory | 'all') => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter the catalog by category">
      <button type="button" onClick={() => setCategory('all')} className={chipClass(category === 'all')}>
        All categories
      </button>
      {categories.map((c) => (
        <button key={c} type="button" onClick={() => setCategory(c)} className={chipClass(category === c)}>
          {categoryLabels[c]}
        </button>
      ))}
    </div>
  );
}
