import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../context/app-context';

export default function Navigation() {
  const { cart, setIsCartOpen, user } = useContext(AppContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const firstMenuLinkRef = useRef(null);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstMenuLinkRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    // Matches the breakpoint in index.css that shows the mobile menu
    const mobile = window.matchMedia('(max-width: 1100px)');
    const onResize = (e) => { if (!e.matches) setMenuOpen(false); };
    mobile.addEventListener('change', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      mobile.removeEventListener('change', onResize);
    };
  }, [menuOpen]);

  const isHome = location.pathname === '/home' || location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const links = [
    ['/store', 'Store'],
    ['/the-sanctum', 'Sanctum'],
    ['/codex', 'Codex'],
    ['/episodes', 'Episodes'],
    ['/old-world', 'Archive'],
  ];
  const accountLink = user ? ['/account', 'Account'] : ['/login', 'Sign In'];

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 var(--grid-margin-desktop)',
    zIndex: 1000,
    transition: 'background-color 0.5s var(--ease-luxury), border-bottom 0.5s ease, backdrop-filter 0.5s ease',
    backgroundColor: isHome && !isScrolled && !menuOpen
      ? 'transparent'
      : 'rgba(10, 10, 10, 0.92)',
    backdropFilter: (isScrolled || !isHome) ? 'blur(12px)' : 'none',
    WebkitBackdropFilter: (isScrolled || !isHome) ? 'blur(12px)' : 'none',
    borderBottom: (isScrolled || !isHome)
      ? '1px solid rgba(200, 204, 209, 0.12)'
      : '1px solid transparent',
  };

  return (
    <nav className="site-nav" style={navStyle}>
      {/* Left Column: Pages */}
      <div className="nav-desktop" style={{ display: 'flex', gap: '32px' }}>
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="ui-text nav-link" style={{ textDecoration: 'none', color: 'var(--ash-grey)' }}>{label}</Link>
        ))}
      </div>

      {/* Mobile: menu toggle */}
      <button
        ref={menuButtonRef}
        className="ui-text nav-burger"
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        style={{ background: 'none', border: 'none', color: 'var(--bone-white)', padding: '8px 0' }}
      >
        {menuOpen ? 'Close' : 'Menu'}
      </button>

      {/* Center: Brand Name */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <Link to="/home" style={{ display: 'block' }}>
          <img
            src="/LOGO%20BLACK.png"
            alt="Gauddly"
            style={{ height: '120px', width: 'auto', filter: 'invert(1)' }}
          />
        </Link>
      </div>

      {/* Right Column: Account + Cart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link
          to={accountLink[0]}
          className="ui-text nav-link nav-desktop"
          style={{ textDecoration: 'none', color: 'var(--ash-grey)' }}
        >
          {accountLink[1]}
        </Link>
        <button
          onClick={() => setIsCartOpen(true)}
          aria-label={`Cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
          className="ui-text nav-link btn-liquid"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--bone-white)',
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>Claims</span>
          {totalItems > 0 && (
            <span style={{
              display: 'inline-block',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: 'var(--cold-silver)',
              color: 'var(--void-black)',
              fontSize: '10px',
              fontWeight: 'bold',
              lineHeight: '18px',
              textAlign: 'center',
            }}>
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Mobile: dropdown menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="nav-mobile-menu"
          style={{
            position: 'absolute',
            top: '64px',
            left: 0,
            width: '100%',
            height: 'calc(100vh - 64px)',
            backgroundColor: 'rgba(10, 10, 10, 0.97)',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            padding: '40px var(--grid-margin-mobile)',
            animation: 'fadeInEffect 0.3s ease forwards',
          }}
        >
          {[...links, accountLink].map(([to, label], index) => (
            <Link ref={index === 0 ? firstMenuLinkRef : undefined} key={to} to={to} style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--bone-white)', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
