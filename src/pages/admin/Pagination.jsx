import React from 'react';
import { buttonStyle } from './adminStyles';

export default function Pagination({ page, totalPages, onPageChange, totalCount, pageSize }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
      <span className="body-s">
        {from}–{to} of {totalCount}
      </span>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          style={{ ...buttonStyle, fontSize: '13px', opacity: page === 1 ? 0.3 : 1 }}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Prev
        </button>
        <span className="body-s">Page {page} of {totalPages}</span>
        <button
          style={{ ...buttonStyle, fontSize: '13px', opacity: page === totalPages ? 0.3 : 1 }}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
