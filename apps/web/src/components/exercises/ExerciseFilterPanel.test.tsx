import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExerciseFilterPanel } from './ExerciseFilterPanel';

describe('ExerciseFilterPanel', () => {
  it('renders a plain search input with a clear action when usePlainInput is enabled', () => {
    const html = renderToStaticMarkup(
      <ExerciseFilterPanel
        draftSearchTerm="bench"
        selectedCategory={null}
        categories={['All', 'Chest']}
        normalizedCategory={null}
        showExerciseImages={false}
        onSearchChange={() => {}}
        onSelectExercise={() => {}}
        onCategoryChange={() => {}}
        onToggleImages={() => {}}
        usePlainInput
      />,
    )

    expect(html).toContain('type="search"')
    expect(html).toContain('bench')
    expect(html).toContain('Clear')
  })
})
