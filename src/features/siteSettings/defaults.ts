import type { SiteSettings } from './types'

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  displayName: 'Jetsadakorn',
  heroSubtitle: 'A passionate Computer Science Student exploring the intersection of technology and creativity. Currently focused on web development, UI/UX design, and building meaningful digital experiences.',
  bioParagraph1: "I'm a Computer Science student with a deep passion for creating elegant solutions to complex problems. My journey in tech started with curiosity about how things work, and has evolved into a commitment to building innovative digital experiences.",
  bioParagraph2: "When I'm not coding, you can find me exploring new design trends, learning about emerging technologies, or working on personal projects that challenge me to grow. I believe in the power of continuous learning and pushing boundaries.",
  currentFocus: 'Currently focused on full-stack web development and creating user-centric interfaces that are both beautiful and functional.',
  contactHeading: "Let's Connect",
  contactDescription: 'Have a project in mind, a question, or just want to say hi? Feel free to reach out!',
  contactLinks: [
    { id: 'email-main', type: 'email', label: '7sadakonr@gmail.com', value: '7sadakonr@gmail.com', url: 'mailto:7sadakonr@gmail.com', isVisible: true },
    { id: 'github-main', type: 'github', label: 'GitHub', value: '7sadakonr', url: 'https://github.com/7sadakonr', isVisible: true },
  ],
  resumeEnUrl: '/resume/Jetsadakorn_Muangwichit_Resume_EN.pdf',
  resumeEnStoragePath: null,
  resumeThUrl: '/resume/Jetsadakorn_Muangwichit_Resume_TH.pdf',
  resumeThStoragePath: null,
  updatedAt: null,
}

