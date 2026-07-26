import React from 'react';

// Indeterminate progress bar - Supabase reads/writes don't expose real
// percentage progress, so this shows "something is happening", not a fake %.
export default function ProgressBar({ active }) {
  if (!active) return null;
  return (
    <div style={{ width: '100%', height: '2px', backgroundColor: 'rgba(200, 204, 209, 0.15)', overflow: 'hidden' }}>
      <div
        style={{
          width: '40%',
          height: '100%',
          backgroundColor: 'var(--cold-silver)',
          animation: 'admin-progress-slide 1s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes admin-progress-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
