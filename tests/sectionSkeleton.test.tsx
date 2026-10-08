import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SectionSkeleton from '../src/components/LazySection/SectionSkeleton'

vi.mock('../src/pages/LandingPage.css', () => ({}))
vi.mock('../src/components/GithubCalendar/GithubCalendar.css', () => ({}))

describe('SectionSkeleton', () => {
  afterEach(cleanup)

  it('builds the projects skeleton from the real layout classes', async () => {
    const { container } = render(<SectionSkeleton id="projects" phase="visible" />)

    expect(screen.getByRole('status', { name: 'Loading Projects section' })).not.toBeNull()
    await vi.waitFor(() => expect(container.querySelector('.projects-layout')).not.toBeNull())
    expect(container.querySelector('.project-hero')).not.toBeNull()
    expect(container.querySelectorAll('.project-card-wrapper')).toHaveLength(3)
  })

  it('reserves the heading with hidden real text instead of animating it', async () => {
    const { container } = render(<SectionSkeleton id="projects" phase="visible" />)

    await vi.waitFor(() => expect(container.querySelector('.project-hero')).not.toBeNull())
    expect(container.querySelector<HTMLElement>('.project-hero')?.style.visibility).toBe('hidden')
  })

  it('exposes the phase so CSS can fade it', () => {
    render(<SectionSkeleton id="contact" phase="leaving" />)
    expect(screen.getByRole('status').getAttribute('data-phase')).toBe('leaving')
  })

  it('mirrors the line sidebar structure so items sit at the real offsets', async () => {
    const { container } = render(<SectionSkeleton id="projects" phase="visible" />)

    await vi.waitFor(() => expect(container.querySelector('.projects-sidebar')).not.toBeNull())
    expect(container.querySelectorAll('.projects-sidebar .line-sidebar__item')).toHaveLength(4)
    expect(container.querySelectorAll('.projects-sidebar .line-sidebar__marker')).toHaveLength(4)
    expect(container.querySelector('.projects-sidebar .skeleton-sidebar-detail')).not.toBeNull()
  })

  it('renders About bento cards as filled ghosts without duplicate ids', async () => {
    const { container } = render(<SectionSkeleton id="about" phase="visible" />)

    await vi.waitFor(() => expect(container.querySelector('.bento-main')).not.toBeNull())
    expect(container.querySelectorAll('.bento-card.skeleton-ghost')).toHaveLength(3)
    expect(container.querySelector('.bento-github .github-calendar-activity-skeleton')).not.toBeNull()
    expect(container.querySelectorAll('.bento-github .github-calendar-stat-skeleton')).toHaveLength(3)
    expect(container.querySelector('[id]')).toBeNull()
  })
})
