import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout, { PasswordField } from '../components/AuthLayout';
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

  return <AuthLayout>
    <span className="auth-eyebrow">Your place in the Sanctum</span>
    <h1>{phase === 'done' ? 'Password updated.' : 'A fresh start.'}</h1>
    {phase === 'checking' && <p className="auth-intro" role="status">Checking your reset link…</p>}
    {phase === 'invalid' && <div className="auth-confirmation"><p role="alert">Open the link in your reset email to continue. If it has expired or has already been used, request a new one.</p><Link className="auth-submit" to={`/forgot-password?redirect=${encodeURIComponent(redirect)}`}>Request a new link →</Link></div>}
    {phase === 'done' && <div className="auth-confirmation"><p role="status">Your new password is saved. Use it next time you sign in.</p><Link className="auth-submit" to={redirect}>Continue →</Link></div>}
    {phase === 'ready' && <>
      <p className="auth-intro">Choose a new password for your Gauddly account.</p>
      <form className="auth-form" onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}>
        <PasswordField id="new-password" label="New password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={8} describedBy="password-guidance" />
        <p className="auth-hint" id="password-guidance">Use at least 8 characters.</p>
        <PasswordField id="confirm-password" label="Confirm password" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save new password →'}</button>
      </fieldset></form>
    </>}
    <p className="auth-secondary"><Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>Back to sign in ↗</Link></p>
  </AuthLayout>;
}
