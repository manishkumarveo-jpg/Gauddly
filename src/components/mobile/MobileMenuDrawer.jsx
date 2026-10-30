import React, { useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/app-context';
import './mobile.css';

export default function MobileMenuDrawer({ isOpen, onClose }) {
  const { user, signOut } = useContext(AppContext);
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    onClose();
    await signOut();
    navigate('/home');
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const initials = (displayName || user?.email || '?').slice(0, 1).toUpperCase();

  return (
    <div className="mobile-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
      <div className="mobile-drawer-sheet" ref={drawerRef} onClick={(e) => e.stopPropagation()}>
        <div>
          {/* Top Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--mobile-card-border)' }}>
            <Link to="/home" onClick={onClose} style={{ display: 'block' }}>
              <img src="/LOGO%20BLACK.png" alt="Gauddly" style={{ height: '70px', width: 'auto', filter: 'invert(1)' }} />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="mobile-header-btn"
              aria-label="Close navigation menu"
              style={{ fontSize: '24px', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>

          {/* User profile card */}
          {user ? (
            <div className="mobile-drawer-user">
              <div className="mobile-drawer-avatar" aria-hidden="true">{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--bone-white)' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ash-grey)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>
          ) : (
            <div className="mobile-drawer-user">
              <div className="mobile-drawer-avatar" aria-hidden="true">&#9770;</div>
              <div style={{ minWidth: 0 }}>
                <Link to="/login" onClick={onClose} style={{ color: 'var(--bone-white)', textDecoration: 'underline', fontSize: '15px' }}>
                  Sign in
                </Link>
                <div style={{ fontSize: '12px', color: 'var(--ash-grey)' }}>Join the Sanctum</div>
              </div>
            </div>
          )}

          {/* Main Navigation Links */}
          <nav className="mobile-drawer-nav" aria-label="Primary Mobile">
            <Link to="/home" className="mobile-drawer-link" onClick={onClose}>
              <span>Home</span>
              <span style={{ fontSize: '18px', opacity: 0.5 }}>&rarr;</span>
            </Link>
            <Link to="/store" className="mobile-drawer-link" onClick={onClose}>
              <span>Shop</span>
              <span style={{ fontSize: '18px', opacity: 0.5 }}>&rarr;</span>
            </Link>
            <Link to={user ? "/account" : "/login"} className="mobile-drawer-link" onClick={onClose}>
              <span>Account</span>
              <span style={{ fontSize: '18px', opacity: 0.5 }}>&rarr;</span>
            </Link>
            <Link to={user ? "/account?view=wishlist" : "/login?redirect=/account?view=wishlist"} className="mobile-drawer-link" onClick={onClose}>
              <span>Wishlist</span>
              <span style={{ fontSize: '18px', opacity: 0.5 }}>&rarr;</span>
            </Link>
            <Link to={user ? "/account?view=claims" : "/login?redirect=/account?view=claims"} className="mobile-drawer-link" onClick={onClose}>
              <span>Claims</span>
              <span style={{ fontSize: '18px', opacity: 0.5 }}>&rarr;</span>
            </Link>
            <Link to={user ? "/account?view=settings" : "/login?redirect=/account?view=settings"} className="mobile-drawer-link" onClick={onClose}>
              <span>Settings</span>
              <span style={{ fontSize: '18px', opacity: 0.5 }}>&rarr;</span>
            </Link>
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="mobile-drawer-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', padding: 0 }}
              >
                <span style={{ color: 'var(--ash-grey)' }}>Sign out</span>
                <span style={{ fontSize: '18px', opacity: 0.5, color: 'var(--ash-grey)' }}>&#8618;</span>
              </button>
            )}
          </nav>
        </div>

        {/* Brand & Social Footer */}
        <div className="mobile-drawer-footer">
          <div className="mobile-drawer-socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a>
            <a href="https://pinterest.com" target="_blank" rel="noreferrer">Pinterest</a>
          </div>
          <div style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ash-grey)' }}>
            GAUDDLY / DELHI
          </div>
        </div>
      </div>
    </div>
  );
}

