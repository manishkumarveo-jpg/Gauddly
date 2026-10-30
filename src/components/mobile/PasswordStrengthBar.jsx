import React from 'react';
import { passwordChecks } from '../../lib/password';
import './mobile.css';

export default function PasswordStrengthBar({ password }) {
  if (!password) return null;

  const checks = passwordChecks(password);
  const metCount = checks.filter((c) => c.ok).length;

  let level = 'weak';
  let label = 'Weak';

  if (metCount === 2) {
    level = 'medium';
    label = 'Medium';
  } else if (metCount === 3) {
    level = 'strong';
    label = 'Strong';
  }

  return (
    <div className="pw-strength-bar" role="status" aria-label={`Password strength: ${label}`}>
      <div className={`pw-strength-segment is-${level}`} />
      <div className={`pw-strength-segment ${metCount >= 2 ? `is-${level}` : ''}`} />
      <div className={`pw-strength-segment ${metCount === 3 ? `is-${level}` : ''}`} />
      <span className="pw-strength-label" style={{
        color: level === 'strong' ? '#10b981' : level === 'medium' ? '#f59e0b' : '#ef4444'
      }}>
        {label}
      </span>
    </div>
  );
}

