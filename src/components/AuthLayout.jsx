import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../lib/supabase';
import { useIsMobile } from '../lib/useIsMobile';
import './auth.css';
import './mobile/mobile.css';

const defaultImage = 'products/dust-robe/1785227982380-Jeans_with_skeletal_bone_appliqu-_202607281348.jpeg';

// Each auth page passes its own photo from public/auth/; sign-in keeps the R2 default
export default function AuthLayout({ children, image, alt, showMobileHero = true }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isMobile = useIsMobile(768);
  const resolvedImage = image || mediaUrl(import.meta.env.VITE_AUTH_IMAGE_URL || defaultImage);

  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* Desktop Editorial Column */}
        <figure className="auth-editorial">
          {imageFailed ? (
            <div className="auth-image-fallback">
              <span>Gauddly</span>
              <p>A house of garments.</p>
            </div>
          ) : (
            <picture>
              <source media="(max-width: 800px)" srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
              <img
                src={resolvedImage}
                alt={image ? alt : 'Gauddly white flared denim with blue appliqué, photographed in a stone cloister'}
                fetchPriority="high"
                decoding="async"
                onError={() => setImageFailed(true)}
              />
            </picture>
          )}
          <figcaption>
            <span>GAUDDLY / DELHI</span>
            <span>A house of garments.</span>
          </figcaption>
        </figure>

        {/* Content Column */}
        <section className="auth-content">
          {/* Mobile Hero Photo Card (ONLY on mobile screens <= 768px) */}
          {isMobile && showMobileHero && !imageFailed && (
            <div className="mobile-auth-hero">
              <img
                src={resolvedImage}
                alt={alt || "Gauddly Sanctum"}
                onError={() => setImageFailed(true)}
              />
              <div className="mobile-auth-hero-overlay">
                <span className="mobile-auth-hero-tag">A House of Garments</span>
              </div>
            </div>
          )}
          {children}
        </section>
      </div>

      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} Gauddly</span>
        <nav aria-label="Account support">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="mailto:contact@gauddly.com">Contact</a>
        </nav>
      </footer>
    </div>
  );
}

export function PasswordChecklist({ checks, id }) {
  return (
    <ul className="auth-rules" id={id} aria-label="Password requirements">
      {checks.map((c) => (
        <li key={c.id} className={c.ok ? 'is-met' : ''}>
          <span aria-hidden="true">{c.ok ? '✓' : '·'}</span>
          {c.text}
          <span className="sr-only">{c.ok ? ' (met)' : ' (not met)'}</span>
        </li>
      ))}
    </ul>
  );
}

export function PasswordField({ id, label = 'Password', value, onChange, autoComplete = 'current-password', minLength, describedBy }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={onChange}
          placeholder={autoComplete === 'new-password' ? 'Enter a new password' : 'Enter your password'}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
