import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Panel } from './Panel'

describe('Panel', () => {
  it('allows custom background classes to override the muted variant background', () => {
    const html = renderToStaticMarkup(
      <Panel variant="muted" className="bg-green-500">
        Content
      </Panel>,
    )

    expect(html).toContain('bg-green-500')
    expect(html).not.toContain('bg-slate-50')
  })
})
