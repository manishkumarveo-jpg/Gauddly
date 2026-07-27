import React, { useCallback, useRef, useState } from 'react';

// On-brand toast for async action feedback (upload success/failure, etc).
// Usage mirrors useConfirm:
//   const [toastEl, showToast] = useToast();
//   showToast('Video uploaded.');
//   showToast('Upload failed: ...', { danger: true });
//   ...render {toastEl} once, anywhere in the tree...
export function useToast() {
  const [toast, setToast] = useState(null); // { message, danger }
  const timerRef = useRef(null);

  const showToast = useCallback((message, { danger = false, duration = 5000 } = {}) => {
    clearTimeout(timerRef.current);
    setToast({ message, danger });
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const toastElement = !toast ? null : (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        backgroundColor: 'var(--void-black)',
        border: `1px solid ${toast.danger ? '#c66' : 'var(--cold-silver)'}`,
        padding: '16px 20px',
        maxWidth: '380px',
        zIndex: 6000,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      <span className="body-s" style={{ color: toast.danger ? '#c66' : 'var(--bone-white)' }}>
        {toast.message}
      </span>
    </div>
  );

  return [toastElement, showToast];
}
