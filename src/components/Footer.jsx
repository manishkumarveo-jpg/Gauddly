import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const BRAND = 'GAUDDLY'.split('');

export default function Footer() {
  const brandRef  = useRef(null);
  const [revealed, setRevealed] = useState(false);

  // IntersectionObserver — letter drop-in when footer enters view
  useEffect(() => {
    const el = brandRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <footer
      style={{
        backgroundColor: 'var(--void-black)',
        borderTop: '1px solid rgba(200, 204, 209, 0.1)',
        padding: '80px var(--grid-margin-desktop) 40px var(--grid-margin-desktop)',
        color: 'var(--ash-grey)',
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '40px',
          marginBottom: '60px',
        }}
        className="footer-grid"
      >
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/store"       className="silver-hover" style={{ color: 'var(--ash-grey)', width: 'fit-content', transition: 'color 0.3s ease' }}>Store</Link>
          <Link to="/the-sanctum" className="silver-hover" style={{ color: 'var(--ash-grey)', width: 'fit-content', transition: 'color 0.3s ease' }}>The Sanctum</Link>
          <Link to="/codex"       className="silver-hover" style={{ color: 'var(--ash-grey)', width: 'fit-content', transition: 'color 0.3s ease' }}>Codex</Link>
          <Link to="/episodes"    className="silver-hover" style={{ color: 'var(--ash-grey)', width: 'fit-content', transition: 'color 0.3s ease' }}>Episodes</Link>
          <Link to="/old-world"   className="silver-hover" style={{ color: 'var(--ash-grey)', width: 'fit-content', transition: 'color 0.3s ease' }}>Archive</Link>
        </div>

        {/* Center Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }} className="footer-center">
          <a
            href="https://instagram.com/gauddly"
            target="_blank"
            rel="noopener noreferrer"
            className="silver-hover"
            style={{ color: 'var(--ash-grey)', transition: 'color 0.3s ease' }}
          >
            Instagram
          </a>
          <span style={{ color: 'var(--ash-grey)' }}>contact@gauddly.com</span>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }} className="footer-right">
          <span>Founded in Delhi.</span>
          <span>Directed by Aman Kaushik.</span>
        </div>
      </div>

      {/* Animated Brand Name — letter drop-in */}
      <div
        ref={brandRef}
        style={{
          textAlign: 'center',
          marginBottom: '40px',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'inline-flex', gap: '2px' }}>
          {BRAND.map((letter, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(48px, 8vw, 96px)',
                fontWeight: 300,
                color: 'var(--ash-grey)',
                letterSpacing: '0.12em',
                display: 'inline-block',
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(-28px)',
                transition: `opacity 0.55s var(--ease-luxury) ${i * 55}ms, transform 0.55s var(--ease-luxury) ${i * 55}ms`,
                willChange: 'opacity, transform',
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div
        style={{
          borderTop: '1px solid rgba(200, 204, 209, 0.05)',
          paddingTop: '20px',
          textAlign: 'center',
          fontSize: '12px',
          letterSpacing: '0.05em',
        }}
      >
        Gauddly. Delhi. Made to order.
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            text-align: center;
          }
          .footer-center { align-items: center !important; }
          .footer-right   { align-items: center !important; }
        }
      `}} />
    </footer>
  );
}
