import logo from '../../assets/img/logo.svg'
import ResumeDownloadMenu from '../ResumeDownload/ResumeDownloadMenu'
import './Footer.css'

const Footer = () => (
  <footer className="site-footer" aria-label="Site footer">
    <div className="site-footer__inner">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <a className="site-footer__brand-link" href="#home" aria-label="Back to home">
            <img className="site-footer__logo" src={logo} alt="7SADAKONR logo" loading="lazy" decoding="async" />
          </a>
          <p className="site-footer__intro">Computer Science student building thoughtful web experiences.</p>
          <p className="site-footer__copyright">© {new Date().getFullYear()} 7SADAKONR. All rights reserved.</p>
          <p className="site-footer__attribution">
            Uicons by <a href="https://www.flaticon.com/uicons" target="_blank" rel="noopener noreferrer">Flaticon</a>
          </p>
        </div>

        <nav className="site-footer__links" aria-label="Footer navigation">
          <section className="site-footer__column">
            <h2>Navigate</h2>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About me</a></li>
              <li><a href="#projects">Projects</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </section>
          <section className="site-footer__column">
            <h2>Selected work</h2>
            <ul>
              <li><a href="#project-0">Todo List</a></li>
              <li><a href="#project-1">Portfolio</a></li>
              <li><a href="#project-2">Zendix</a></li>
              <li><a href="#projects">All projects</a></li>
            </ul>
          </section>
          <section className="site-footer__column">
            <h2>Connect</h2>
            <ul>
              <li><a href="https://github.com/7sadakonr" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="mailto:7sadakonr@gmail.com">7sadakonr@gmail.com</a></li>
              <li><ResumeDownloadMenu variant="footer" /></li>
            </ul>
          </section>
          <section className="site-footer__column">
            <h2>Available for</h2>
            <ul>
              <li><a href="mailto:7sadakonr@gmail.com?subject=Project%20inquiry">Web projects</a></li>
              <li><a href="mailto:7sadakonr@gmail.com?subject=Collaboration">Collaboration</a></li>
              <li><a href="mailto:7sadakonr@gmail.com?subject=Hello">Say hello</a></li>
            </ul>
          </section>
        </nav>
      </div>
      <p className="site-footer__wordmark" aria-hidden="true">7SADAKONR</p>
    </div>
  </footer>
)

export default Footer
