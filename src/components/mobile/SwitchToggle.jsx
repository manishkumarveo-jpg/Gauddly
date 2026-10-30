import React from 'react';
import './mobile.css';

export default function SwitchToggle({ id, checked, onChange, label, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--mobile-card-border)' }}>
      <div style={{ paddingRight: '16px' }}>
        <label htmlFor={id} style={{ fontSize: '15px', color: 'var(--bone-white)', fontWeight: 400, cursor: 'pointer', display: 'block' }}>
          {label}
        </label>
        {description && (
          <div style={{ fontSize: '13px', color: 'var(--ash-grey)', marginTop: '2px' }}>
            {description}
          </div>
        )}
      </div>
      <label className="mobile-switch" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <span className="mobile-switch-slider" />
      </label>
    </div>
  );
}

