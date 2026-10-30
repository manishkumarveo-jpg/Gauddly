import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { safeInternalPath } from '../lib/navigation';
import { passwordChecks, isStrongPassword } from '../lib/password';
import AuthLayout, { PasswordField, PasswordChecklist } from '../components/AuthLayout';
import PasswordStrengthBar from '../components/mobile/PasswordStrengthBar';

const RESEND_WAIT = 45; // seconds; Supabase rate-limits confirmation emails

export default function Signup() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(''); // set once the confirmation email is on its way
  const [wait, setWait] = useState(0);
  const [resendNote, setResendNote] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeInternalPath(searchParams.get('redirect'));
  const destinationQuery = `redirect=${encodeURIComponent(redirect)}`;
  const checks = passwordChecks(form.password);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const update = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (!isStrongPassword(form.password)) {
      setError('Your password does not meet all of the requirements below.');
      return;
    }
    setBusy(true);
    try {
      const email = form.email.trim();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: { full_name: form.fullName.trim(), phone: form.phone },
          emailRedirectTo: new URL(`/login?${destinationQuery}`, window.location.origin).href,
        },
      });
      if (signUpError) throw signUpError;
      // Supabase hides an already-registered email: no error, no mail, and an empty identities list
      if (data.user?.identities?.length === 0) {
        setError('This email is already registered. Sign in instead.');
        return;
      }
      if (data.session) {
        navigate(redirect, { replace: true });
        return;
      }
      setSentTo(email);
      setWait(RESEND_WAIT);
    } catch (signUpError) {
      setError(signUpError?.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : signUpError?.message || 'We could not create your account. Please try again.');
    } finally { setBusy(false); }
  }

  async function resend() {
    setResendNote('');
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: sentTo });
    if (resendError) {
      setResendNote(resendError.status === 429 ? 'Please wait a little longer before resending.' : 'We could not resend the email. Please try again.');
      return;
    }
    setResendNote('A new link is on its way.');
    setWait(RESEND_WAIT);
  }

  if (sentTo) {
    return <AuthLayout image="/auth/verify-email.jpg" alt="Gauddly embroidered on black cloth">
      <span className="auth-eyebrow">Verify your email</span>
      <h1>Check your inbox.</h1>
      <p className="auth-intro">We’ve sent a verification link to<br /><strong className="auth-strong">{sentTo}</strong></p>
      <div className="auth-icon" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="5" width="18" height="14" /><path d="M3 6l9 7 9-7" /></svg>
      </div>
      <p className="auth-hint" style={{ fontSize: '16px' }}>Didn’t receive the email? Check your spam folder too.</p>
      <p className="auth-resend">
        <button type="button" className="auth-text-button" disabled={wait > 0} onClick={resend}>Resend email</button>
        {wait > 0 && <span className="auth-hint"> · in 00:{String(wait).padStart(2, '0')}</span>}
      </p>
      {resendNote && <p className="auth-hint" role="status">{resendNote}</p>}
      <button type="button" className="auth-text-button" onClick={() => { setSentTo(''); setResendNote(''); }}>Use a different email</button>
    </AuthLayout>;
  }

  return <AuthLayout image="/auth/create-account.jpg" alt="A figure in a black Gauddly jacket and wide trousers in a stone colonnade">
    <span className="auth-eyebrow">Join the Sanctum</span>
    <h1>Create your account.</h1>
    <p className="auth-intro">Be the first to know about new drops, exclusive releases and more.</p>
    <form className="auth-form" onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}>
      <div className="auth-field"><label htmlFor="signup-name">Full name</label><input id="signup-name" name="name" autoComplete="name" required placeholder="Your name" value={form.fullName} onChange={update('fullName')} /></div>
      <div className="auth-field"><label htmlFor="signup-email">Email address</label><input id="signup-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com" value={form.email} onChange={update('email')} /></div>
      <div className="auth-field"><label htmlFor="signup-phone">Mobile number</label>
        <div className="auth-phone"><span aria-hidden="true">+91</span><input id="signup-phone" name="phone" type="tel" autoComplete="tel-national" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} title="10-digit mobile number" required placeholder="98765 43210" value={form.phone} onChange={update('phone')} /></div>
      </div>
      <PasswordField id="signup-password" value={form.password} onChange={update('password')} autoComplete="new-password" minLength={8} describedBy="signup-rules" />
      <PasswordStrengthBar password={form.password} />
      <PasswordChecklist id="signup-rules" checks={checks} />
      <label className="auth-check">
        <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</span>
      </label>
      {error && <p className="auth-error" role="alert">{error}{error.includes('already registered') && <> <Link to={`/login?${destinationQuery}`}>Sign in →</Link></>}</p>}
      <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account →'}</button>
    </fieldset></form>
    <p className="auth-secondary">Already have an account? <Link to={`/login?${destinationQuery}`}>Sign in →</Link></p>
  </AuthLayout>;
}
