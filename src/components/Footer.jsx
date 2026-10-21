import React from 'react';
import { Link } from 'react-router-dom';
import './footer.css';

const EXPLORE = [
  ['/store', 'Store'],
  ['/the-sanctum', 'The Sanctum'],
  ['/codex', 'Codex'],
  ['/episodes', 'Episodes'],
  ['/old-world', 'Archive'],
];

const CARE = [
  ['/shipping', 'Shipping'],
  ['/returns', 'Returns'],
  ['/size-care', 'Size & Care'],
  ['/contact', 'Contact'],
];

const backToTop = () => window.scrollTo({
  top: 0,
  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
});

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-lead">
        <div>
          <span className="footer-eyebrow">The Sanctum</span>
          <h2>Every garment belongs to a world.</h2>
        </div>
        <Link to="/store" className="footer-cta">Explore the collection <span aria-hidden="true">↗</span></Link>
      </div>

      <div className="footer-cols">
        <div className="footer-brand">
          <span className="footer-wordmark footer-wordmark-sm" role="img" aria-label="Gauddly" />
          <p>A house of garments.<br />Made to order in Delhi.</p>
        </div>

        <nav aria-label="Explore">
          <span className="footer-eyebrow">Explore</span>
          {EXPLORE.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
        </nav>

        <nav aria-label="Client care">
          <span className="footer-eyebrow">Client Care</span>
          {CARE.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
        </nav>

        <div className="footer-find">
          <span className="footer-eyebrow">Find Us</span>
          <a href="https://instagram.com/gauddly" target="_blank" rel="noopener noreferrer">Instagram <span aria-hidden="true">↗</span></a>
          <a href="mailto:contact@gauddly.com">contact@gauddly.com</a>
          <p className="footer-dim">Founded in Delhi.<br />Directed by Aman Kaushik.</p>
        </div>
      </div>

      <div className="footer-mark" aria-hidden="true">
        <span className="footer-wordmark footer-wordmark-lg" />
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Gauddly</span>
        <span className="footer-legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </span>
        <button type="button" onClick={backToTop}>Back to top <span aria-hidden="true">↑</span></button>
      </div>
    </footer>
  );
}
