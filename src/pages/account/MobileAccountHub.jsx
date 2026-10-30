import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './shared';
import { ICONS } from './icons';

export default function MobileAccountHub({
  user,
  displayName,
  initials,
  isAdmin,
  onSelectView,
  onSignOut,
}) {
  const VIEWS = [
    { id: 'profile', label: 'Profile & Addresses', icon: 'user' },
    { id: 'orders', label: 'Orders', icon: 'bag' },
    { id: 'claims', label: 'Claims', icon: 'shield' },
    { id: 'wishlist', label: 'Wishlist', icon: 'heart' },
    { id: 'settings', label: 'Account Settings', icon: 'gear' },
  ];

  return (
    <div className="mobile-account-hub show-on-mobile" style={{ width: '100%', padding: '0 0 40px' }}>
      {/* User summary card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px 0',
        borderBottom: '1px solid var(--mobile-card-border)',
        marginBottom: '24px',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '1px solid var(--cold-silver)',
          backgroundColor: '#161616',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          color: 'var(--bone-white)',
        }} aria-hidden="true">
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            color: 'var(--bone-white)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {displayName || 'Your Account'}
          </h2>
          <div style={{
            fontSize: '13px',
            color: 'var(--ash-grey)',
            marginTop: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {user.email}
          </div>
        </div>
      </div>

      {/* Title & subtitle */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          color: 'var(--bone-white)',
          fontWeight: 400,
          margin: 0,
        }}>
          Your Account
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ash-grey)', marginTop: '4px' }}>
          Manage your details, addresses and orders.
        </p>
      </div>

      {/* Nav Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {VIEWS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectView(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              backgroundColor: 'var(--mobile-card-bg)',
              border: '1px solid var(--mobile-card-border)',
              borderRadius: '12px',
              color: 'var(--bone-white)',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ color: 'var(--ash-grey)', display: 'flex', alignItems: 'center' }}>
                <Icon size={18}>{ICONS[icon]}</Icon>
              </span>
              <span>{label}</span>
            </div>
            <span style={{ color: 'var(--ash-grey)', fontSize: '18px' }}>&rsaquo;</span>
          </button>
        ))}

        {isAdmin && (
          <Link
            to="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              backgroundColor: 'var(--mobile-card-bg)',
              border: '1px solid var(--mobile-card-border)',
              borderRadius: '12px',
              color: 'var(--bone-white)',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ color: 'var(--ash-grey)', display: 'flex', alignItems: 'center' }}>
                <Icon size={18}>{ICONS.gear}</Icon>
              </span>
              <span>Admin Studio</span>
            </div>
            <span style={{ color: 'var(--ash-grey)', fontSize: '18px' }}>&rsaquo;</span>
          </Link>
        )}
      </div>

      {/* Sanctum Editorial Teaser Banner */}
      <div style={{
        marginTop: '28px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--mobile-card-border)',
        position: 'relative',
        height: '160px',
        backgroundColor: '#161616',
      }}>
        <img
          src="/auth/password-updated.jpg"
          alt="Gauddly Sanctum Drop"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, transparent 30%, rgba(10, 10, 10, 0.95) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '16px',
        }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--cold-silver)' }}>
            The Sanctum
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--bone-white)', marginTop: '2px' }}>
            New Drop Relics
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={onSignOut}
        style={{
          width: '100%',
          marginTop: '20px',
          padding: '14px 18px',
          backgroundColor: 'transparent',
          border: '1px solid var(--mobile-card-border)',
          borderRadius: '12px',
          color: 'var(--ash-grey)',
          fontFamily: 'var(--font-body)',
          fontSize: '15px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <Icon size={16}>{ICONS.signout}</Icon>
        <span>Sign out</span>
      </button>

      {/* Need Help link */}
      <div style={{
        marginTop: '32px',
        padding: '18px',
        borderRadius: '12px',
        backgroundColor: 'rgba(200, 204, 209, 0.04)',
        border: '1px solid var(--mobile-card-border)',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--bone-white)' }}>Need help?</div>
        <div style={{ fontSize: '13px', color: 'var(--ash-grey)', marginTop: '4px' }}>
          Our team is here for you. <Link to="/contact" style={{ color: 'var(--bone-white)', textDecoration: 'underline' }}>Contact Support &rarr;</Link>
        </div>
      </div>
    </div>
  );
}

