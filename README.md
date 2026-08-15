<div align="center">

# 7sadakonr Portfolio

### Interactive Frontend Portfolio

A responsive universe-themed portfolio focused on custom interface design, smooth navigation, and performance-conscious rendering.

[![Live Website](https://img.shields.io/badge/Live_Website-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](https://7sadakonr.xyz)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)

</div>

---

## Overview

This repository contains the source code for **7sadakonr.xyz**. The site is built with React and TypeScript and uses custom CSS effects rather than a 3D rendering library or GSAP.

The current implementation combines route-based page loading, Lenis smooth scrolling, responsive glass-style components, custom background effects, a command menu, and a contact form powered by EmailJS.

---

## Features

- Responsive multi-page portfolio interface
- Universe-inspired aurora, firefly, and shooting-star effects
- Glass-style surfaces and navigation components
- Global command menu with keyboard shortcuts
- Lenis-powered smooth scrolling
- Interactive project cards and image magnifier
- Contact form delivery through EmailJS
- Route-based lazy loading and code splitting
- Optimized image assets and WebP conversion workflow
- Production minification with Terser
- Vercel Analytics integration

---

## Verified Technology Stack

| Category | Technology | Current Usage |
|---|---|---|
| UI | React 19.1 | Components and interactive interface |
| Language | TypeScript | Typed components, pages, and utilities |
| Build Tool | Vite 7.0.4 | Development server and production builds |
| Routing | React Router 7.7 | Client-side routes and navigation |
| Smooth Scrolling | Lenis 1.3.25 | Smooth scrolling and scroll control |
| Contact Form | EmailJS Browser 4.4 | Sending messages from the contact page |
| Styling | Custom CSS | Glass effects, responsive layouts, and animations |
| Image Tooling | Sharp 0.35 | Local image conversion and optimization script |
| Build Optimization | Terser 5.44 | Production JavaScript minification |
| Analytics | Vercel Analytics | Website usage analytics |
| Deployment | Vercel | Production hosting |

The current project does **not** use GSAP or Three.js.

---

## Application Sections

| Section | Purpose |
|---|---|
| Home | Hero presentation, visual effects, and primary navigation |
| About | Personal introduction, skills, and résumé access |
| Projects | Project showcase with interactive cards and media |
| Contact | Contact information and EmailJS message form |

---

## Performance Implementation

- Route components are loaded lazily
- React, React DOM, React Router, and Lenis are split into reusable vendor chunks
- Production console statements and debugger calls are removed by Terser
- Project images are available in optimized WebP formats; run `npm run images:convert` after updating their PNG sources
- Animated components include performance-conscious rendering behavior

---

## Installation

### Prerequisites

- Node.js 18 or newer
- npm

### Setup

```bash
git clone https://github.com/7sadakonr/7sadakonr-portfolio.git
cd 7sadakonr-portfolio
npm install
npm run dev
```

Open `http://localhost:5173` in a browser.

### EmailJS configuration

Create a `.env` file when using the contact form locally and provide the EmailJS values expected by the application:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create an optimized production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## Project Structure

```text
src/
├── assets/          # Images, résumé, icons, and other media
├── components/      # Reusable interface and animation components
├── pages/           # Home, About, Projects, and Contact pages
├── App.tsx          # Routing and lazy-loaded page composition
├── main.tsx         # React application entry point
└── vite-env.d.ts    # Vite environment-variable types
```

---

## License

- Source code: MIT License
- Personal content and assets: CC BY-NC-SA 4.0

Developed by [@7sadakonr](https://github.com/7sadakonr)
