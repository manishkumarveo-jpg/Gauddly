import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { passwordChecks, isStrongPassword } from '../../lib/password';
import { PasswordChecklist } from '../../components/AuthLayout';
import { PageHeader } from './shared';

const NOTIFICATIONS = [
  ['order_updates', 'Order updates', 'Emails about your orders and deliveries.'],
  ['promotions', 'Promotions & offers', 'New collections and exclusive releases.'],
];

export default function SettingsView({ user }) {
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMessage, setPwMessage] = useState(null); // { ok, text }
  const [prefs, setPrefs] = useState(null);
  const [prefsError, setPrefsError] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('notification_prefs').eq('id', user.id).single()
      .then(({ data, error }) => {
        if (error) setPrefsError('Your preferences could not be loaded.');
        else setPrefs(data.notification_prefs || {});
      });
  }, [user.id]);

  async function changePassword(event) {
    event.preventDefault();
    setPwMessage(null);
    if (!isStrongPassword(pw.next)) return setPwMessage({ ok: false, text: 'The new password does not meet all of the requirements.' });
    if (pw.next !== pw.confirm) return setPwMessage({ ok: false, text: 'The new passwords do not match.' });
    setPwBusy(true);
    // Supabase does not ask for the old password, so confirm it by signing in with it first
    const { error: checkError } = await supabase.auth.signInWithPassword({ email: user.email, password: pw.current });
    if (checkError) {
      setPwBusy(false);
      return setPwMessage({ ok: false, text: 'Your current password is incorrect.' });
    }
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwBusy(false);
    if (error) return setPwMessage({ ok: false, text: error.message || 'Your password could not be updated.' });
    setPw({ current: '', next: '', confirm: '' });
    setPwMessage({ ok: true, text: 'Password updated.' });
  }

  async function togglePref(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setPrefsError('');
    const { error } = await supabase.from('profiles').update({ notification_prefs: next }).eq('id', user.id);
    if (error) {
      setPrefs(prefs);
      setPrefsError('That change could not be saved. Please try again.');
    }
  }

  const pwField = (key, label, autoComplete) => (
    <div className="ac-field">
      <label htmlFor={`pw-${key}`}>{label}</label>
      <input id={`pw-${key}`} className="ac-input" type="password" required autoComplete={autoComplete} value={pw[key]} onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))} />
    </div>
  );

  return <>
    <PageHeader title="Account Settings" intro="Manage your account preferences and security." />

    <div className="ac-settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <form className="ac-card ac-edit" onSubmit={changePassword} aria-labelledby="ac-pw">
          <h2 id="ac-pw" className="ac-h2">Change password</h2>
          {pwField('current', 'Current password', 'current-password')}
          {pwField('next', 'New password', 'new-password')}
          {pwField('confirm', 'Confirm new password', 'new-password')}
          <PasswordChecklist id="ac-pw-rules" checks={passwordChecks(pw.next)} />
          {pwMessage && <p className={pwMessage.ok ? 'ac-badge ac-badge--ok' : 'ac-error'} role={pwMessage.ok ? 'status' : 'alert'}>{pwMessage.text}</p>}
          <button className="ac-primary" disabled={pwBusy}>{pwBusy ? 'Updating…' : 'Update password →'}</button>
        </form>

        <section className="ac-card" aria-labelledby="ac-notify">
          <h2 id="ac-notify" className="ac-h2">Notifications</h2>
          <div className="ac-rows">
            {NOTIFICATIONS.map(([key, title, text]) => (
              <div key={key}>
                <div><div id={`pref-${key}`}>{title}</div><div className="ac-note">{text}</div></div>
                <button type="button" role="switch" className="ac-switch" aria-labelledby={`pref-${key}`} aria-checked={Boolean(prefs?.[key])} disabled={!prefs} onClick={() => togglePref(key)} />
              </div>
            ))}
          </div>
          {prefsError && <p className="ac-error" role="alert">{prefsError}</p>}
        </section>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section className="ac-card" aria-labelledby="ac-security">
          <h2 id="ac-security" className="ac-h2">Security</h2>
          <div className="ac-rows">
            <div>
              <div style={{ minWidth: 0 }}><div>Email verification</div><div className="ac-note ac-ellipsis">{user.email}</div></div>
              {user.email_confirmed_at ? <span className="ac-badge ac-badge--ok">✓ Verified</span> : <span className="ac-badge">Not verified</span>}
            </div>
            <div>
              <div><div>Mobile number</div><div className="ac-note">{user.user_metadata?.phone ? `+91 ${user.user_metadata.phone}` : 'Not added'}</div></div>
              <span className="ac-badge">Used for delivery</span>
            </div>
          </div>
        </section>

        <section className="ac-card" aria-labelledby="ac-privacy">
          <h2 id="ac-privacy" className="ac-h2">Privacy</h2>
          <div className="ac-rows">
            <div><div><div>Data &amp; privacy</div><div className="ac-note">How we collect and use your data.</div></div><Link to="/privacy" className="ac-link">View policy →</Link></div>
            <div><div><div>Terms of service</div><div className="ac-note">Read our terms and conditions.</div></div><Link to="/terms" className="ac-link">View terms →</Link></div>
          </div>
        </section>
      </div>
    </div>
  </>;
}
