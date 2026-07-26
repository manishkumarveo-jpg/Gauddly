import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/home';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate(redirect);
  };

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '160px', paddingBottom: '160px' }} className="fade-in">
      <div style={{ maxWidth: '420px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h1 className="display-s" style={{ fontSize: '32px', marginBottom: '8px' }}>Enter the Sanctum</h1>
          <p className="body-s" style={{ color: 'var(--ash-grey)', fontStyle: 'italic' }}>Sign in to claim your garments.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            {isSubmitting ? 'Entering...' : 'Sign in →'}
          </button>
        </form>

        <Link to={`/signup?redirect=${encodeURIComponent(redirect)}`} className="underlined-link silver-hover" style={{ fontSize: '14px', width: 'fit-content' }}>
          New here? Create an account →
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
