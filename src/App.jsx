import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
import Navbar from './components/Navbar/Navbar'
import Loading from './components/Loading/Loading.jsx'
import SmoothFollower from './components/SmoothFollower/SmoothFollower.jsx'

// Lazy load components for code splitting
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Project = lazy(() => import('./pages/Project'))
const Contact = lazy(() => import('./pages/Contact'))

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const loadingStartRef = useRef(Date.now());
  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    const minLoadingTime = 2500;
    const fadeOutDuration = 1000;

    // Function to trigger fade out
    const triggerFadeOut = () => {
      setFadeOut(true);

      // Use requestAnimationFrame for more reliable animation on iOS
      fadeTimerRef.current = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsLoading(false);
        });
      }, fadeOutDuration);
    };

    // Calculate remaining time based on when loading started
    const elapsed = Date.now() - loadingStartRef.current;
    const remaining = Math.max(0, minLoadingTime - elapsed);

    timerRef.current = setTimeout(triggerFadeOut, remaining);

    // Handle visibility change for iOS (when app comes back from background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - loadingStartRef.current;
        if (elapsed >= minLoadingTime && isLoading && !fadeOut) {
          // If we've been loading long enough, trigger fade out immediately
          if (timerRef.current) clearTimeout(timerRef.current);
          triggerFadeOut();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoading, fadeOut]);

  // Prevent iOS pull-to-refresh
  useEffect(() => {
    let lastTouchY = 0;

    const handleTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // If at top of page and pulling down, prevent default
      if (scrollTop <= 0 && touchY > lastTouchY) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <Router>
      <Analytics />
      <SmoothFollower />
      {isLoading && <Loading fadeOut={fadeOut} />}
      <Navbar />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/project" element={<Project />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App