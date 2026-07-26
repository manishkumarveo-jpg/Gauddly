import React from 'react';

// Styled replacement for a raw <input type=file> - a small text link that hides
// the native file picker behind it, matching the site's underlined-link look.
export default function UploadLink({ label, accept, onFile, disabled }) {
  return (
    <label
      className="underlined-link"
      style={{
        fontSize: '12px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        width: 'fit-content',
      }}
    >
      {label}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
    </label>
  );
}
