import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useContactForm } from '../src/features/contact/hooks/useContactForm'

describe('useContactForm', () => {
  it('reports an error without attempting delivery when EmailJS configuration is unavailable', async () => {
    const sendEmail = vi.fn()
    const { result } = renderHook(() => useContactForm({ config: null, sendEmail }))
    const form = document.createElement('form')
    Object.defineProperty(result.current.form, 'current', { configurable: true, value: form })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(sendEmail).not.toHaveBeenCalled()
    expect(result.current.submitStatus).toBe('error')
    expect(result.current.isSubmitting).toBe(false)
  })
})
