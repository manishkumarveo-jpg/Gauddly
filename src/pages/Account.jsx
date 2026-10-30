import { useContext, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '../context/app-context';
import { supabase } from '../lib/supabase';
import { Icon } from './account/shared';
import { ICONS } from './account/icons';
import ProfileView from './account/ProfileView';
import OrdersView from './account/OrdersView';
import ClaimsView from './account/ClaimsView';
import WishlistView from './account/WishlistView';
import SettingsView from './account/SettingsView';
import MobileAccountHub from './account/MobileAccountHub';
import { useIsMobile } from '../lib/useIsMobile';
import './account/account.css';

const VIEWS = [
  ['profile', 'Profile & Addresses', 'user'],
  ['orders', 'Orders', 'bag'],
  ['claims', 'Claims', 'shield'],
  ['wishlist', 'Wishlist', 'heart'],
  ['settings', 'Account Settings', 'gear'],
];

export default function Account() {
  const { session, user, sessionLoaded, isAdmin, signOut } = useContext(AppContext);
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasSelectedView = searchParams.has('view');
  const view = VIEWS.some(([id]) => id === searchParams.get('view')) ? searchParams.get('view') : 'profile';
  const [fullName, setFullName] = useState('');
  const signOutDialog = useRef(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name').eq('id', user.id).single()
      .then(({ data }) => setFullName(data?.full_name || ''));
  }, [user]);

  if (sessionLoaded && !session) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(`/account?view=${view}`)}`} replace />;
  }
  if (!user) return null;

  const show = (id, extra = {}) => setSearchParams({ view: id, ...extra });

  const handleSignOut = async () => {
    signOutDialog.current?.close();
    await signOut();
    navigate('/home');
  };

  const displayName = fullName || user.user_metadata?.full_name || '';
  const initials = (displayName || user.email || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: isMobile ? '80px' : '120px', paddingBottom: '120px' }} className="fade-in">
      {isMobile && !hasSelectedView ? (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
          <MobileAccountHub
            user={user}
            displayName={displayName}
            initials={initials}
            isAdmin={isAdmin}
            onSelectView={(v) => show(v)}
            onSignOut={() => signOutDialog.current?.showModal()}
          />
        </div>
      ) : (
        <div className="ac-layout">
          {!isMobile && (
            <aside className="ac-side">
              <div className="ac-who">
                <div className="ac-avatar" aria-hidden="true">{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>{displayName || 'Your account'}</div>
                  <div className="body-s ac-ellipsis" style={{ fontSize: '13px' }}>{user.email}</div>
                </div>
              </div>
              <nav className="ac-nav" aria-label="Account">
                {VIEWS.map(([id, label, icon]) => (
                  <button key={id} type="button" className={view === id ? 'is-active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => show(id)}>
                    <Icon>{ICONS[icon]}</Icon>{label}
                  </button>
                ))}
                {isAdmin && <Link to="/admin"><Icon>{ICONS.gear}</Icon>Admin dashboard</Link>}
              </nav>
              <button type="button" className="ac-logout" onClick={() => signOutDialog.current?.showModal()}>
                <Icon>{ICONS.signout}</Icon>Sign out
              </button>
            </aside>
          )}

          <main className="ac-main">
            {view === 'profile' && <ProfileView user={user} fullName={displayName} onNameSaved={setFullName} />}
            {view === 'orders' && <OrdersView user={user} onRaiseClaim={(orderId) => show('claims', { order: orderId })} />}
            {view === 'claims' && <ClaimsView user={user} preselectedOrder={searchParams.get('order')} />}
            {view === 'wishlist' && <WishlistView user={user} />}
            {view === 'settings' && <SettingsView user={user} />}

            <nav className="ac-footer" aria-label="Policies">
              <Link to="/shipping">Shipping Policy</Link>
              <Link to="/returns">Returns &amp; Made-to-Order</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--ash-grey)' }}>Need help? <Link to="/contact" style={{ color: 'var(--bone-white)', textDecoration: 'underline' }}>Contact us →</Link></span>
            </nav>
          </main>
        </div>
      )}

      <dialog ref={signOutDialog} className="ac-dialog" aria-labelledby="ac-signout-title">
        <div className="ac-round"><Icon size={26}>{ICONS.signout}</Icon></div>
        <h2 id="ac-signout-title" className="ac-h2">Sign out of your account?</h2>
        <p className="body-s" style={{ marginTop: '12px' }}>You’ll need to sign in again to see your orders and saved details.</p>
        <div className="ac-dialog-actions">
          <button type="button" className="ac-primary" onClick={handleSignOut}>Sign out</button>
          <button type="button" className="ac-btn" onClick={() => signOutDialog.current?.close()} autoFocus>Cancel</button>
        </div>
      </dialog>
    </div>
  );
}
