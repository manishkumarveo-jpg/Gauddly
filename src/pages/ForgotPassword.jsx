import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import { safeInternalPath } from '../lib/navigation';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const redirect = safeInternalPath(searchParams.get('redirect'), '/account');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const resetUrl = new URL('/reset-password', window.location.origin);
      resetUrl.searchParams.set('redirect', redirect);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: resetUrl.href });
      if (resetError) throw resetError;
      setSent(true);
    } catch (requestError) {
      setError(requestError?.status === 429 ? 'Please wait a moment before requesting another link.' : 'We could not request a reset link. Please try again shortly.');
    } finally { setBusy(false); }
  }

  return <AuthLayout>
    <span className="auth-eyebrow">Your place in the Sanctum</span>
    <h1>{sent ? 'Check your email.' : 'Forgot your password?'}</h1>
    {sent ? <div className="auth-confirmation" role="status"><p>If an account exists for that address, you’ll receive a link to choose a new password.</p><p>Check your spam folder too. Use the most recent email if you requested more than one link.</p></div> : <>
      <p className="auth-intro">Enter your account email and we’ll send a password-reset link.</p>
      <form className="auth-form" onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}>
        <div className="auth-field"><label htmlFor="reset-email">Email address</label><input id="reset-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} /></div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset link →'}</button>
      </fieldset></form>
    </>}
    <p className="auth-secondary"><Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>Back to sign in ↗</Link></p>
    <Link className="auth-store-link" to="/store">Continue exploring the store ↗</Link>
  </AuthLayout>;
}
