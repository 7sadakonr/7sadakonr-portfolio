import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('homepage shows a short preloader while still discovering its hero image from HTML', async () => {
  const [app, hero, html, preloader] = await Promise.all([
    read('../src/App.tsx'),
    read('../src/pages/HeroPage.tsx'),
    read('../index.html'),
    read('../src/components/Preloader/Preloader.tsx'),
  ])

  assert.match(app, /components\/Preloader\/Preloader/)
  assert.match(app, /isPreloaderVisible/)
  assert.match(app, /<Preloader onComplete=/)
  assert.doesNotMatch(preloader, /warmCriticalRuntime/)
  assert.match(preloader, /MIN_VISIBLE_MS = 600/)
  assert.match(hero, /onCriticalReady/)
  assert.match(hero, /<picture>/)
  assert.match(hero, /fetchPriority="high"/)
  assert.match(html, /rel="preload"[\s\S]*imagesrcset=/)
  assert.match(html, /hero-160\.avif/)
})

test('noncritical runtime warm-up does not block the hero', async () => {
  const [app, runtime, lazySection] = await Promise.all([
    read('../src/App.tsx'),
    read('../src/utils/runtimeWarmup.ts'),
    read('../src/components/LazySection/LazySection.tsx'),
  ])

  assert.doesNotMatch(runtime, /warmCriticalRuntime/)
  assert.match(app, /const isInteractive = isCriticalReady && !isPreloaderVisible/)
  assert.match(app, /canLoad=\{isInteractive\}/)
  assert.match(lazySection, /canLoad\?: boolean/)
})
