import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { safeInternalPath } from '../lib/navigation';
import AuthLayout, { PasswordField } from '../components/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeInternalPath(searchParams.get('redirect'));
  const destinationQuery = `redirect=${encodeURIComponent(redirect)}`;

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      // Admins always land on the dashboard, unless they were sent here from a specific admin page
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single();
      navigate(profile?.is_admin && !redirect.startsWith('/admin') ? '/admin' : redirect, { replace: true });
    } catch (signInError) {
      setError(signInError?.code === 'invalid_credentials' ? 'The email or password is incorrect. Please try again.' : signInError?.message || 'We could not sign you in. Please check your connection and try again.');
    } finally { setBusy(false); }
  }

  return <AuthLayout>
    <span className="auth-eyebrow">Your place in the Sanctum</span>
    <h1>Welcome back.</h1>
    <p className="auth-intro">Sign in to view your claims and manage your details.</p>
    <form className="auth-form" onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}>
      <div className="auth-field"><label htmlFor="login-email">Email address</label><input id="login-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} /></div>
      <PasswordField id="login-password" value={password} onChange={event => setPassword(event.target.value)} />
      <Link className="auth-forgot" to={`/forgot-password?${destinationQuery}`}>Forgot password?</Link>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in →'}</button>
    </fieldset></form>
    <p className="auth-secondary">New to Gauddly? <Link to={`/signup?${destinationQuery}`}>Create an account ↗</Link></p>
    <Link className="auth-store-link" to="/store">Continue exploring the store ↗</Link>
  </AuthLayout>;
}
