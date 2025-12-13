# 7sadakonr Portfolio

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)
![Three.js](https://img.shields.io/badge/Three.js-black)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

This repository houses the source code for my personal portfolio website, engineered to demonstrate my proficiency in Front-End Development and UI/UX Design.

The application is a Single Page Application (SPA) built with **React 19** and **Vite**, featuring a modern "Glass Morphism" design language set against a dynamic, universe-themed background. It emphasizes high performance, responsiveness, and immersive user experiences through **Three.js** and **GSAP** animations.

**Live Demo:** [https://7sadakonr-portfolio.vercel.app](https://7sadakonr-portfolio.vercel.app)

## Key Features

- **Advanced UI/UX:** Implements a translucent Glass Morphism aesthetic for a modern, clean interface.
- **Dynamic Visuals:** Features a universe-themed background with animated particle systems (stars, shooting stars) powered by Three.js/CSS.
- **Interactive Elements:** Includes a custom "Liquid Glass" magnifier lens effect for detailed project inspection.
- **Responsive Architecture:** Fully optimized for desktop, tablet, and mobile devices to ensure a consistent experience across all platforms.
- **High Performance:** Built on Vite for rapid development and optimized production builds.

## Technology Stack

| Category | Technologies |
|----------|--------------|
| **Core Framework** | React 19 |
| **Build Tool** | Vite |
| **Routing** | React Router DOM |
| **Styling** | CSS3 (Custom Glass Morphism), Tailwind CSS |
| **Animation & 3D** | GSAP, Three.js |
| **Deployment** | Vercel |

## Project Structure

The project adheres to a component-based architecture for scalability and maintainability:

src/
├── assets/           # Static assets (Images, Icons)
├── components/       # Reusable UI components
│   ├── Animation/    # Animation wrappers and logic
│   ├── Loading/      # Suspense/Loading fallbacks
│   ├── Navbar/       # Navigation layout
│   └── HeroSection/  # Primary landing visuals
├── pages/            # Route components
│   ├── Home.jsx      # Landing page
│   ├── About.jsx     # Professional summary
│   ├── Project.jsx   # Project portfolio grid
│   └── Contact.jsx   # Communication channels
└── App.jsx           # Main application entry point
Getting Started
Prerequisites
Ensure you have the following installed:

Node.js (v18.0.0 or higher)

npm or yarn

Installation
Clone the repository

Bash

git clone [https://github.com/7sadakonr/7sadakonr-portfolio.git](https://github.com/7sadakonr/7sadakonr-portfolio.git)
cd 7sadakonr-portfolio
Install dependencies

Bash

npm install
Run the development server

Bash

npm run dev
Open http://localhost:5173 in your browser.

Build for Production
To create an optimized build for deployment:

Bash

npm run build
Contact
7sadakonr

GitHub: github.com/7sadakonr

Website: 7sadakonr-portfolio.vercel.app
