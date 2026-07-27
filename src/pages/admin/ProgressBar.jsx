import React from 'react';

// Determinate when `percent` (0-100) is passed, e.g. real XHR upload progress.
// Otherwise indeterminate - Supabase reads/writes don't expose real percentage
// progress, so this just shows "something is happening", not a fake %.
export default function ProgressBar({ active, percent }) {
  if (!active) return null;

  const isDeterminate = percent != null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="ui-text" style={{ fontSize: '12px' }}>
          {isDeterminate ? 'Uploading' : 'Working'}
        </span>
        {isDeterminate && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--bone-white)', lineHeight: 1 }}>
            {percent}%
          </span>
        )}
      </div>

      <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(200, 204, 209, 0.15)', overflow: 'hidden' }}>
        {isDeterminate ? (
          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: 'var(--cold-silver)', transition: 'width 0.15s ease' }} />
        ) : (
          <div
            style={{
              width: '40%',
              height: '100%',
              backgroundColor: 'var(--cold-silver)',
              animation: 'admin-progress-slide 1s ease-in-out infinite',
            }}
          />
        )}
        <style>{`
          @keyframes admin-progress-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    </div>
  );
}
