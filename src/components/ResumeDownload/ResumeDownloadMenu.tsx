import { useEffect, useId, useRef, useState } from 'react'
import { Liquid } from 'liquid-gooey'
import resumeEnglish from '../../assets/resume/Jetsadakorn_Muangwichit_Resume_EN.pdf'
import resumeThai from '../../assets/resume/Jetsadakorn_Muangwichit_Resume_TH.pdf'
import './ResumeDownloadMenu.css'

type ResumeLanguage = 'th' | 'en'

type ResumeDownloadMenuProps = {
  variant: 'footer' | 'hero'
}

const resumeOptions: Record<ResumeLanguage, { label: string; href: string }> = {
  th: {
    label: 'ภาษาไทย',
    href: resumeThai
  },
  en: {
    label: 'English',
    href: resumeEnglish
  }
}

const ResumeDownloadMenu = ({ variant }: ResumeDownloadMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const renderOption = (language: ResumeLanguage, hero = false) => {
    const option = resumeOptions[language]

    return (
      <a
        key={language}
        href={option.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`resume-download-menu__option${hero ? ' resume-download-menu__option--hero' : ''}`}
        tabIndex={hero && !isOpen ? -1 : undefined}
        aria-hidden={hero && !isOpen ? true : undefined}
        onClick={() => closeMenu()}
      >
        {option.label}
      </a>
    )
  }

  if (variant === 'hero') {
    return (
      <div className={`resume-download-menu resume-download-menu--hero${isOpen ? ' is-open' : ''}`} ref={rootRef}>
        <Liquid
          id={menuId}
          className="resume-download-menu__liquid"
          blur={6}
          contrast={18}
          fill="var(--resume-liquid-surface)"
          shadow="0 14px 30px rgba(0, 0, 0, 0.28)"
          aria-label="Choose resume language"
        >
          <Liquid.Item
            className="resume-download-menu__liquid-item resume-download-menu__liquid-item--thai"
            x={isOpen ? -82 : 0}
            y={isOpen ? -90 : 0}
            transition="bouncy"
          >
            {renderOption('th', true)}
          </Liquid.Item>
          <Liquid.Item
            className="resume-download-menu__liquid-item resume-download-menu__liquid-item--english"
            x={isOpen ? 82 : 0}
            y={isOpen ? -90 : 0}
            transition="bouncy"
            delay={40}
          >
            {renderOption('en', true)}
          </Liquid.Item>
          <Liquid.Item className="resume-download-menu__liquid-item resume-download-menu__liquid-item--trigger">
            <button
              ref={triggerRef}
              type="button"
              className="resume-download-menu__trigger resume-download-menu__trigger--hero"
              aria-expanded={isOpen}
              aria-controls={menuId}
              onClick={() => setIsOpen((open) => !open)}
            >
              <svg className="resume-download-menu__download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>Download Resume</span>
            </button>
          </Liquid.Item>
        </Liquid>
      </div>
    )
  }

  return (
    <div className={`resume-download-menu resume-download-menu--${variant}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="resume-download-menu__trigger"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        Resume
      </button>
      {isOpen && (
        <div className="resume-download-menu__options" id={menuId} aria-label="Choose resume language">
          {renderOption('th')}
          {renderOption('en')}
        </div>
      )}
    </div>
  )
}

export default ResumeDownloadMenu
