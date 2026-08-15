import todoListImg from '../../../assets/img/todo_list_real.webp'
import portfolioImg from '../../../assets/img/portfolio_real_new.webp'
import fileTransferImg from '../../../assets/img/zendix_real.webp'

export interface ProjectItem {
  id: number
  title: string
  description: string
  tech: readonly string[]
  image: string | null
  liveUrl: string
  githubUrl: string
  gradient?: string
}

export const PROJECTS: readonly ProjectItem[] = [
  { id: 1, title: 'Todo-List', description: 'A full-stack task management application with secure JWT authentication, complete CRUD operations, and a dashboard featuring productivity analytics with Recharts. Users can manage tasks with advanced filtering by status and enjoy a responsive UI with smooth animations.', tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express', 'Prisma', 'PostgreSQL', 'JWT'], image: todoListImg, liveUrl: 'https://7sadakonr-todo-list.vercel.app', githubUrl: 'https://github.com/7sadakonr/Todo-List' },
  { id: 2, title: 'Portfolio Website', description: 'A modern, responsive portfolio website showcasing my work and skills. Features include smooth animations, glass morphism UI design, universe-themed backgrounds with twinkling stars and shooting stars, interactive image magnifier, and mobile-optimized experience.', tech: ['React', 'Vite', 'TypeScript', 'Lenis', 'CSS'], image: portfolioImg, liveUrl: 'https://7sadakonr-portfolio.vercel.app', githubUrl: 'https://github.com/7sadakonr/7sadakonr-portfolio' },
  { id: 3, title: 'Zendix File Transfer', description: 'Zendix is a peer-to-peer file and clipboard sharing web app. Transfer files and text directly between devices without uploading to the cloud.', tech: ['React', 'Vite', 'Tailwind CSS', 'Zustand', 'PeerJS (WebRTC)', 'React Router'], image: fileTransferImg, liveUrl: 'https://zendix-file.vercel.app/', githubUrl: 'https://github.com/7sadakonr/Zendix-Filetransfer-Web-App' },
  { id: 4, title: 'Nyeta', description: 'Nyeta is a real-time visual assistance platform for the visually impaired. It integrates WebRTC for volunteer calling and Llama 3.2 Vision AI for automated visual queries via an accessible, voice-controlled UI.', tech: ['Next.js', 'Tailwind CSS', 'Pusher', 'PeerJS', 'Llama 3.2 Vision', 'Groq API'], image: null, liveUrl: 'https://nyeta.vercel.app', githubUrl: 'https://github.com/7sadakonr/Nyeta', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
]
