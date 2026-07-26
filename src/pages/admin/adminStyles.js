export const inputStyle = {
  background: 'none',
  border: 'none',
  borderBottom: '1px solid var(--cold-silver)',
  color: 'var(--bone-white)',
  fontFamily: 'var(--font-body)',
  fontSize: '16px',
  padding: '6px 0',
  outline: 'none',
  width: '100%',
};

export const buttonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--bone-white)',
  fontFamily: 'var(--font-display)',
  fontSize: '18px',
  cursor: 'pointer',
  padding: '4px 0',
};

export const rowStyle = {
  border: '1px solid rgba(200, 204, 209, 0.15)',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

export const cardStyle = {
  border: '1px solid rgba(200, 204, 209, 0.15)',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

export const kpiCardStyle = {
  border: '1px solid rgba(200, 204, 209, 0.15)',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  padding: '24px',
  flex: 1,
  minWidth: '200px',
};

// Filled = high emphasis (published/released), Outline = low emphasis (draft/unpublished)
export const badgeStyle = (filled) => ({
  display: 'inline-block',
  fontFamily: 'var(--font-body)',
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '4px 10px',
  border: '1px solid var(--cold-silver)',
  backgroundColor: filled ? 'var(--bone-white)' : 'transparent',
  color: filled ? 'var(--void-black)' : 'var(--ash-grey)',
});

export const pillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: 'var(--bone-white)',
  border: '1px solid rgba(200, 204, 209, 0.15)',
  borderRadius: '999px',
  padding: '8px 16px',
};

export const iconButtonStyle = {
  background: 'none',
  border: '1px solid rgba(200, 204, 209, 0.15)',
  color: 'var(--ash-grey)',
  cursor: 'pointer',
  padding: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const primaryButtonStyle = {
  background: 'none',
  border: '1px solid var(--bone-white)',
  color: 'var(--bone-white)',
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '12px 20px',
  cursor: 'pointer',
};
