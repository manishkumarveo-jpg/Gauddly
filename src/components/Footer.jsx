import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
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
          <Link to="/the-sanctum" className="silver-hover" style={{ color: 'var(--ash-grey)', width: 'fit-content' }}>
            The Sanctum
          </Link>
          <Link to="/codex" className="silver-hover" style={{ color: 'var(--ash-grey)', width: 'fit-content' }}>
            Codex
          </Link>
          <Link to="/episodes" className="silver-hover" style={{ color: 'var(--ash-grey)', width: 'fit-content' }}>
            Episodes
          </Link>
          <Link to="/old-world" className="silver-hover" style={{ color: 'var(--ash-grey)', width: 'fit-content' }}>
            Archive
          </Link>
        </div>

        {/* Center Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }} className="footer-center">
          <a 
            href="https://instagram.com/gauddly" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="silver-hover" 
            style={{ color: 'var(--ash-grey)' }}
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

      {/* Bottom Row */}
      <div style={{ borderTop: '1px solid rgba(200, 204, 209, 0.05)', paddingTop: '20px', textAlign: 'center', fontSize: '12px', letterSpacing: '0.05em' }}>
        Gauddly. Delhi. Made to order.
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            text-align: center;
          }
          .footer-center {
            align-items: center !important;
          }
          .footer-right {
            align-items: center !important;
          }
        }
      `}} />
    </footer>
  );
}
