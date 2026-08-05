/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Header } from './Header'

describe('Header', () => {
  let container: HTMLDivElement | null = null
  let root: Root | null = null

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    container?.remove()
    container = null
    root = null
  })

  it('keeps the mobile menu visible while its toggle button is clicked', () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    const onToggleMobileMenu = vi.fn()

    act(() => {
      root!.render(
        <MemoryRouter>
          <Header
            appName="Gym"
            desktopMenuItems={[]}
            tabletMenuItems={[]}
            mobileMenuItems={[]}
            mobileMenuOpen={true}
            user={null}
            onAuthClick={() => undefined}
            onToggleMobileMenu={onToggleMobileMenu}
          />
        </MemoryRouter>,
      )
    })

    const toggleButton = container.querySelector(
      'button[data-mobile-menu-toggle]',
    )

    expect(toggleButton).not.toBeNull()

    act(() => {
      toggleButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(container.querySelector('.fixed')).not.toBeNull()
  })
})
