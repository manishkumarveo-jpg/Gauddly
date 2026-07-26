import React, { useEffect, useState } from 'react';
import { supabase, mediaUrl } from '../../lib/supabase';
import { uploadToR2 } from './uploadToR2';
import { inputStyle, cardStyle, iconButtonStyle, primaryButtonStyle } from './adminStyles';
import { PencilIcon, TrashIcon } from './Icons';
import UploadLink from './UploadLink';
import Pagination from './Pagination';
import ProgressBar from './ProgressBar';
import { useConfirm } from './useConfirm';

const PAGE_SIZE = 6;
const emptyDraft = { id: '', name: '', hero_r2_key: '', passage: '', sort_order: 0 };

export default function AdminCastes() {
  const [castes, setCastes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [uploadError, setUploadError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmDialog, requestConfirm] = useConfirm();

  const load = () => {
    supabase.from('castes').select('*').order('sort_order').then(({ data }) => setCastes(data || []));
  };

  useEffect(load, []);

  const totalPages = Math.max(1, Math.ceil(castes.length / PAGE_SIZE));
  const pageItems = castes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const startEdit = (c) => { setEditingId(c.id); setDraft({ ...c }); };
  const startNew = () => { setEditingId('new'); setDraft(emptyDraft); };
  const cancelEdit = () => { setEditingId(null); setDraft(emptyDraft); };

  const saveEdit = async () => {
    const isNew = editingId === 'new';
    if (!(await requestConfirm(isNew ? `Create caste "${draft.name}"?` : `Save changes to "${draft.name}"?`))) return;

    setIsBusy(true);
    const payload = { ...draft, sort_order: Number(draft.sort_order) };
    if (isNew) {
      const { error } = await supabase.from('castes').insert(payload);
      if (error) { setIsBusy(false); return alert(error.message); }
    } else {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('castes').update(rest).eq('id', editingId);
      if (error) { setIsBusy(false); return alert(error.message); }
    }
    setIsBusy(false);
    cancelEdit();
    load();
  };

  const deleteCaste = async (c) => {
    const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('caste_id', c.id);
    if (count > 0) return alert(`This caste has ${count} product(s). Reassign or delete them first.`);
    if (!(await requestConfirm(`Delete caste "${c.name}"?`, { danger: true }))) return;
    setIsBusy(true);
    const { error } = await supabase.from('castes').delete().eq('id', c.id);
    setIsBusy(false);
    if (error) return alert(error.message);
    load();
  };

  const handleUpload = async (casteId, file) => {
    setUploadError('');
    setIsBusy(true);
    try {
      const key = `castes/${casteId}/${Date.now()}-${file.name}`;
      await uploadToR2(key, file);
      await supabase.from('castes').update({ hero_r2_key: key }).eq('id', casteId);
      load();
    } catch (err) {
      setUploadError(err.message);
    }
    setIsBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="display-s">Castes</h1>
          <p className="body-s" style={{ maxWidth: '520px', marginTop: '8px' }}>
            Manage the caste tiers of the Sanctum.
          </p>
        </div>
        <button style={primaryButtonStyle} onClick={startNew}>+ New Caste</button>
      </div>

      <ProgressBar active={isBusy} />

      {editingId === 'new' && (
        <div style={cardStyle}>
          <CasteForm draft={draft} setDraft={setDraft} onSave={saveEdit} onCancel={cancelEdit} isNew />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {pageItems.map((c, i) => (
          <div key={c.id} style={cardStyle}>
            {editingId === c.id ? (
              <CasteForm draft={draft} setDraft={setDraft} onSave={saveEdit} onCancel={cancelEdit} />
            ) : (
              <>
                <div className="ui-text" style={{ fontSize: '10px' }}>ID: CST-{String((page - 1) * PAGE_SIZE + i + 1).padStart(3, '0')}</div>
                <div style={{ height: '160px', backgroundColor: '#151515' }}>
                  {c.hero_r2_key && (
                    <img src={mediaUrl(c.hero_r2_key)} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>{c.name}</strong>
                <p className="body-s" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.passage}
                </p>
                <UploadLink label="Upload hero image →" accept="image/*" onFile={(file) => handleUpload(c.id, file)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div>
                    <div className="ui-text" style={{ fontSize: '9px' }}>Sort Order</div>
                    <div className="body-s" style={{ color: 'var(--bone-white)' }}>{String(c.sort_order).padStart(2, '0')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={iconButtonStyle} onClick={() => startEdit(c)}><PencilIcon width={14} height={14} /></button>
                    <button style={iconButtonStyle} onClick={() => deleteCaste(c)}><TrashIcon width={14} height={14} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalCount={castes.length} pageSize={PAGE_SIZE} />

      {uploadError && <span className="body-s">Upload failed: {uploadError}</span>}
      {confirmDialog}
    </div>
  );
}

function CasteForm({ draft, setDraft, onSave, onCancel, isNew }) {
  const set = (field) => (e) => setDraft({ ...draft, [field]: e.target.value });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isNew && <label className="body-s">Slug (id) <input style={inputStyle} value={draft.id} onChange={set('id')} placeholder="e.g. nimbus" /></label>}
      <label className="body-s">Name <input style={inputStyle} value={draft.name} onChange={set('name')} /></label>
      <label className="body-s">Sort order <input type="number" style={inputStyle} value={draft.sort_order} onChange={set('sort_order')} /></label>
      <label className="body-s">Passage <textarea style={{ ...inputStyle, minHeight: '60px' }} value={draft.passage || ''} onChange={set('passage')} /></label>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button style={primaryButtonStyle} onClick={onSave}>Save</button>
        <button style={{ ...primaryButtonStyle, border: '1px solid var(--ash-grey)', color: 'var(--ash-grey)' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
