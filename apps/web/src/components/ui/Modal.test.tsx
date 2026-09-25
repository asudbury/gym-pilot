/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
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

  it('renders an accessible dialog and restores focus when closed', async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const onClose = vi.fn()

    act(() => {
      root!.render(
        <Modal isOpen={true} onClose={onClose} ariaLabel="Example dialog">
          <button type="button">Focusable action</button>
        </Modal>,
      )
    })

    await act(async () => {
      await Promise.resolve()
    })

    const dialog = document.getElementById('modal-dialog')
    expect(dialog?.getAttribute('role')).toBe('dialog')
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    expect(dialog?.getAttribute('aria-label')).toBe('Example dialog')

    act(() => {
      root!.render(
        <Modal isOpen={false} onClose={onClose} ariaLabel="Example dialog">
          <button type="button">Focusable action</button>
        </Modal>,
      )
    })

    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })
})
