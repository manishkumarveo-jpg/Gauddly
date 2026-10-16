import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { safeInternalPath } from '../lib/navigation';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeInternalPath(searchParams.get('redirect'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setIsSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      navigate(redirect);
    } else {
      // Email confirmation is required before a session is issued
      setNeedsConfirmation(true);
    }
  };

  if (needsConfirmation) {
    return (
      <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '160px', textAlign: 'center' }} className="fade-in">
        <h1 className="display-s" style={{ fontSize: '32px' }}>Check your email.</h1>
        <p className="body-s" style={{ color: 'var(--ash-grey)', marginTop: '16px' }}>Confirm your address, then sign in.</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '160px', paddingBottom: '160px' }} className="fade-in">
      <div style={{ maxWidth: '420px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h1 className="display-s" style={{ fontSize: '32px', marginBottom: '8px' }}>Join the Sanctum</h1>
          <p className="body-s" style={{ color: 'var(--ash-grey)', fontStyle: 'italic' }}>Create an account to claim garments and track your orders.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <input
            type="text"
            required
            placeholder="full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
            className="silver-hover system-cursor-override"
          />
          <input
            type="email"
            required
            placeholder="email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            className="silver-hover system-cursor-override"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            className="silver-hover system-cursor-override"
          />

          {error && (
            <span className="body-s" style={{ color: 'var(--ash-grey)' }}>{error}</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="underlined-link silver-hover"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--bone-white)',
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              cursor: 'pointer',
              outline: 'none',
              paddingBottom: '4px',
              width: 'fit-content',
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create account →'}
          </button>
        </form>

        <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="underlined-link silver-hover" style={{ fontSize: '14px', width: 'fit-content' }}>
          Already have an account? Sign in →
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        input::placeholder {
          color: var(--ash-grey) !important;
          opacity: 0.5;
          font-style: italic;
        }
      `}} />
    </div>
  );
}

const inputStyle = {
  background: 'none',
  border: 'none',
  borderBottom: '1px solid var(--cold-silver)',
  color: 'var(--bone-white)',
  fontFamily: 'var(--font-body)',
  fontSize: '18px',
  padding: '6px 0',
  outline: 'none',
};
