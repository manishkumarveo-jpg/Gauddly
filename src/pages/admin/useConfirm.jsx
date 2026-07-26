import React, { useCallback, useState } from 'react';

// Renders an on-brand confirmation modal in place of the browser's native
// confirm(). Usage mirrors window.confirm but async:
//   const [confirmDialog, requestConfirm] = useConfirm();
//   if (!(await requestConfirm('Delete this?', { danger: true }))) return;
//   ...render {confirmDialog} once, anywhere in the tree...
export function useConfirm() {
  const [state, setState] = useState(null); // { message, danger, resolve }

  const requestConfirm = useCallback((message, { danger = false } = {}) => {
    return new Promise((resolve) => setState({ message, danger, resolve }));
  }, []);

  const settle = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const dialog = !state ? null : (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 10, 10, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5000,
      }}
      onClick={() => settle(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--void-black)',
          border: '1px solid rgba(200, 204, 209, 0.3)',
          padding: '32px',
          maxWidth: '420px',
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <p className="body-m" style={{ color: 'var(--bone-white)' }}>{state.message}</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end' }}>
          <button
            data-testid="confirm-dialog-cancel"
            onClick={() => settle(false)}
            className="body-s"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ash-grey)' }}
          >
            Cancel
          </button>
          <button
            data-testid="confirm-dialog-accept"
            onClick={() => settle(true)}
            className="underlined-link"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              color: state.danger ? '#c66' : 'var(--bone-white)',
            }}
          >
            {state.danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  return [dialog, requestConfirm];
}
