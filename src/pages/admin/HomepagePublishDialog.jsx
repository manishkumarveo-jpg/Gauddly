import { useEffect, useRef } from 'react';
import { AlertIcon } from './Icons';

export default function HomepagePublishDialog({ open, changes, warnings, busy, onClose, onPublish, onFix, onOpenPreview }) {
  const ref = useRef(null);
  const safeChoice = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) { dialog.showModal(); safeChoice.current?.focus(); }
    if (!open && dialog.open) dialog.close();
  }, [open]);
  const changeCount = changes.reduce((n, group) => n + group.changes.length, 0);

  return <dialog ref={ref} className="hp-dialog" aria-labelledby="hp-publish-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <h2 id="hp-publish-title">Publish the homepage?</h2>
    <p className="hp-dialog-lead">Every visitor will see these changes straight away.</p>

    <h3 className="hp-eyebrow">What changes · {changeCount}</h3>
    {changes.length ? <ul className="hp-changes">
      {changes.map(group => <li key={group.id}>
        <span className="hp-changes-section">{group.name}</span>
        <ul>{group.changes.map((line, i) => <li key={i}>{line}</li>)}</ul>
      </li>)}
    </ul> : <p className="hp-hint">Nothing has changed since the last publication.</p>}

    {warnings.length > 0 && <>
      <h3 className="hp-eyebrow">Worth checking · {warnings.length}</h3>
      <ul className="hp-dialog-warnings">
        {warnings.map((warning, i) => <li key={i}>
          <AlertIcon aria-hidden="true" width={18} height={18} />
          <span>{warning.sectionName}: {warning.message}</span>
          <button type="button" className="hp-btn" onClick={() => onFix(warning.section, warning.field)}>Fix</button>
        </li>)}
      </ul>
    </>}

    <div className="hp-dialog-actions">
      <button type="button" className="hp-btn" ref={safeChoice} onClick={onClose}>Keep editing</button>
      <button type="button" className="hp-btn" onClick={onOpenPreview}>Open full preview</button>
      <button type="button" className="hp-btn hp-btn-primary" disabled={busy} onClick={onPublish}>{busy ? 'Publishing…' : 'Publish now'}</button>
    </div>
  </dialog>;
}
