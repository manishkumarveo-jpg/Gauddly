import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout, { PasswordField, PasswordChecklist } from '../components/AuthLayout';
import { passwordChecks, isStrongPassword } from '../lib/password';
import { supabase } from '../lib/supabase';
import { safeInternalPath } from '../lib/navigation';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const redirect = safeInternalPath(searchParams.get('redirect'), '/account');
  const [phase, setPhase] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setPhase(current => current === 'done' ? current : session ? 'ready' : 'invalid');
    });
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (active) setPhase(sessionError || !data.session ? 'invalid' : 'ready');
    }).catch(() => { if (active) setPhase('invalid'); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (busy || phase !== 'ready') return;
    setError('');
    if (!isStrongPassword(password)) { setError('Your password does not meet all of the requirements below.'); return; }
    if (password !== confirmation) { setError('The passwords do not match. Please check both fields.'); return; }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      setConfirmation('');
      setPhase('done');
    } catch (updateError) {
      setError(updateError?.message || 'Your password could not be updated. Please try again.');
    } finally { setBusy(false); }
  }

  const done = phase === 'done';
  return <AuthLayout
    image={done ? '/auth/password-updated.jpg' : '/auth/reset-password.jpg'}
    alt={done ? 'A hooded figure walking through a sunlit cloister' : 'A figure in a grey hooded Gauddly jacket, head bowed'}
  >
    <span className="auth-eyebrow">{done ? 'All set' : 'Secure access'}</span>
    <h1>{done ? 'Password updated.' : 'Set a new password.'}</h1>
    {phase === 'checking' && <p className="auth-intro" role="status">Checking your reset link…</p>}
    {phase === 'invalid' && <div className="auth-confirmation"><p role="alert">Open the link in your reset email to continue. If it has expired or has already been used, request a new one.</p><Link className="auth-submit" to={`/forgot-password?redirect=${encodeURIComponent(redirect)}`}>Request a new link →</Link></div>}
    {done && <div className="auth-confirmation">
      <p role="status">Your password has been successfully changed.</p>
      <div className="auth-icon" aria-hidden="true" style={{ marginTop: '28px' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </div>
      <Link className="auth-submit" to={redirect}>Continue →</Link>
    </div>}
    {phase === 'ready' && <>
      <p className="auth-intro">Choose a strong password to keep your account secure.</p>
      <form className="auth-form" onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}>
        <PasswordField id="new-password" label="New password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={8} describedBy="password-guidance" />
        <PasswordField id="confirm-password" label="Confirm password" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} />
        <PasswordChecklist id="password-guidance" checks={passwordChecks(password)} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Reset password →'}</button>
      </fieldset></form>
    </>}
    {!done && <p className="auth-secondary"><Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>Back to sign in ↗</Link></p>}
  </AuthLayout>;
}
