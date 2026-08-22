import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(resolve(process.cwd(), path), 'utf8')

describe('Contact card animation', () => {
  it('keeps Contact text reveal while rendering form and info cards immediately', async () => {
    const [page, form, info] = await Promise.all([
      read('src/features/contact/ContactPage.tsx'),
      read('src/features/contact/components/ContactForm.tsx'),
      read('src/features/contact/components/ContactInfo.tsx'),
    ])

    expect(page).toContain('TextReveal')
    expect(form).not.toContain('AnimatedContent')
    expect(info).not.toContain('AnimatedContent')
  })
})
