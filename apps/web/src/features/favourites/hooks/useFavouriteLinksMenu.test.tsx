/** @vitest-environment jsdom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HOME_FILTER_KEY } from '../../../constants/storageKeys'
import { useFavouriteLinksMenu } from './useFavouriteLinksMenu'

describe('useFavouriteLinksMenu', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    window.sessionStorage.clear()
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  it('persists home filters and reports menu open state changes', () => {
    const onMenuOpenChange = vi.fn()
    let latest: ReturnType<typeof useFavouriteLinksMenu> | undefined

    function Harness() {
      latest = useFavouriteLinksMenu({ onMenuOpenChange })
      return null
    }

    act(() => {
      root.render(
        <MemoryRouter>
          <Harness />
        </MemoryRouter>,
      )
    })

    act(() => {
      latest?.setHomeFilters((current) => ({
        ...current,
        searchTerm: 'bench',
      }))
    })

    expect(window.sessionStorage.getItem(HOME_FILTER_KEY)).toContain('bench')

    act(() => {
      latest?.setMenuOpen(true)
    })

    expect(onMenuOpenChange).toHaveBeenCalledWith(true)
  })
})
