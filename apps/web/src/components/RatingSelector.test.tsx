import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RatingSelector } from './RatingSelector'

describe('RatingSelector', () => {
  it('marks the selected value as pressed and leaves the rest unpressed', () => {
    const markup = renderToStaticMarkup(
      <RatingSelector value={3} onChange={() => undefined} />,
    )

    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(markup).toContain('aria-pressed="false"')
  })
})
