import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

describe('lazy section CSS loading', () => {
  it('keeps below-the-fold section styles out of the App entrypoint', async () => {
    const app = await read('../src/App.tsx')

    expect(app).not.toContain("import './pages/LandingPage.css'")
  })

  it('loads the shared section stylesheet with each lazy page component', async () => {
    const [about, projects, contact] = await Promise.all([
      read('../src/pages/AboutPage.tsx'),
      read('../src/features/projects/ProjectPage.tsx'),
      read('../src/features/contact/ContactPage.tsx'),
    ])

    expect(about).toContain("import './LandingPage.css'")
    expect(projects).toContain("import '../../pages/LandingPage.css'")
    expect(contact).toContain("import '../../pages/LandingPage.css'")
  })
})
