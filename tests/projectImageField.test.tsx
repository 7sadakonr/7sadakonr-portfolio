import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProjectImageField from '../src/features/admin/components/ProjectImageField'

describe('ProjectImageField', () => {
  it('explains the supported file size and recommended image dimensions', () => {
    render(<ProjectImageField currentUrl={null} onChange={() => undefined} />)

    expect(screen.getByText('Project cover preview')).toBeTruthy()
    expect(screen.getByText(/recommended: 1600 × 900 px \(16:9\)/i)).toBeTruthy()
    expect(screen.getByText(/maximum 5 MB/i)).toBeTruthy()
  })
})
