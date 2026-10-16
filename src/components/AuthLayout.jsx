import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../lib/supabase';
import './auth.css';

const defaultImage = 'products/dust-robe/1785227982380-Jeans_with_skeletal_bone_appliqu-_202607281348.jpeg';

export default function AuthLayout({ children }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <div className="auth-page">
    <div className="auth-layout">
      <figure className="auth-editorial">
        {imageFailed ? <div className="auth-image-fallback"><span>Gauddly</span><p>A house of garments.</p></div> : <picture>
          <source media="(max-width: 800px)" srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
          <img src={mediaUrl(import.meta.env.VITE_AUTH_IMAGE_URL || defaultImage)} alt="Gauddly white flared denim with blue appliqué, photographed in a stone cloister" fetchPriority="high" decoding="async" onError={() => setImageFailed(true)} />
        </picture>}
        <figcaption><span>GAUDDLY / DELHI</span><span>A house of garments.</span></figcaption>
      </figure>
      <section className="auth-content">{children}</section>
    </div>
    <footer className="auth-footer"><span>© {new Date().getFullYear()} Gauddly</span><nav aria-label="Account support"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="mailto:contact@gauddly.com">Contact</a></nav></footer>
  </div>;
}

export function PasswordField({ id, label = 'Password', value, onChange, autoComplete = 'current-password', minLength, describedBy }) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-field"><label htmlFor={id}>{label}</label><div className="auth-password">
    <input id={id} name={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} required minLength={minLength} value={value} onChange={onChange} placeholder={autoComplete === 'new-password' ? 'Enter a new password' : 'Enter your password'} aria-describedby={describedBy} />
    <button type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(current => !current)}>{visible ? 'Hide' : 'Show'}</button>
  </div></div>;
}
