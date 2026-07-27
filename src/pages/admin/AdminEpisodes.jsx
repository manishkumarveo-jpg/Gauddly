import React, { useEffect, useMemo, useState } from 'react';
import { supabase, mediaUrl } from '../../lib/supabase';
import { uploadToR2, safeFileName, deleteFromR2 } from './uploadToR2';
import { inputStyle, cardStyle, iconButtonStyle, primaryButtonStyle } from './adminStyles';
import { PencilIcon, TrashIcon } from './Icons';
import UploadLink from './UploadLink';
import Pagination from './Pagination';
import ProgressBar from './ProgressBar';
import { useConfirm } from './useConfirm';
import { useToast } from './useToast';

const STATUSES = ['released', 'awaiting', 'sealed'];
const PAGE_SIZE = 6;
const emptyDraft = { id: '', num: '', title: '', status: 'awaiting', still_r2_key: '', video_r2_key: '', description: '', director_note: '', release_date: '', sort_order: 0 };

const mediaDeleteButtonStyle = {
  ...iconButtonStyle,
  position: 'absolute',
  top: '8px',
  right: '8px',
  padding: '6px',
  backgroundColor: 'rgba(10, 10, 10, 0.85)',
};

export default function AdminEpisodes() {
  const [episodes, setEpisodes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [isBusy, setIsBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmDialog, requestConfirm] = useConfirm();
  const [toast, showToast] = useToast();

  const load = () => {
    supabase.from('episodes').select('*').order('sort_order').then(({ data }) => setEpisodes(data || []));
  };

  useEffect(load, []);

  const filtered = useMemo(
    () => episodes.filter((ep) => statusFilter === 'all' || ep.status === statusFilter),
    [episodes, statusFilter]
  );
  useEffect(() => setPage(1), [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const startEdit = (ep) => { setEditingId(ep.id); setDraft({ ...ep, release_date: ep.release_date || '' }); };
  const startNew = () => { setEditingId('new'); setDraft(emptyDraft); };
  const cancelEdit = () => { setEditingId(null); setDraft(emptyDraft); };

  const saveEdit = async () => {
    const isNew = editingId === 'new';
    if (!(await requestConfirm(isNew ? `Create episode "${draft.title}"?` : `Save changes to "${draft.title}"?`))) return;

    setIsBusy(true);
    const payload = { ...draft, sort_order: Number(draft.sort_order), release_date: draft.release_date || null };
    if (isNew) {
      const { error } = await supabase.from('episodes').insert(payload);
      if (error) { setIsBusy(false); return alert(error.message); }
    } else {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('episodes').update(rest).eq('id', editingId);
      if (error) { setIsBusy(false); return alert(error.message); }
    }
    setIsBusy(false);
    cancelEdit();
    load();
  };

  const deleteEpisode = async (ep) => {
    if (!(await requestConfirm(`Delete episode "${ep.title}"?`, { danger: true }))) return;
    setIsBusy(true);
    const { error } = await supabase.from('episodes').delete().eq('id', ep.id);
    setIsBusy(false);
    if (error) return alert(error.message);
    load();
  };

  const updateStatus = async (ep, status) => {
    if (!(await requestConfirm(`Change "${ep.title}" release state to "${status}"?`))) return;
    setIsBusy(true);
    await supabase.from('episodes').update({ status }).eq('id', ep.id);
    setIsBusy(false);
    load();
  };

  const handleUpload = async (episodeId, field, file) => {
    const label = field === 'video_r2_key' ? 'Video' : 'Still image';
    setIsBusy(true);
    setUploadProgress(0);
    try {
      const key = `episodes/${episodeId}/${Date.now()}-${safeFileName(file.name)}`;
      await uploadToR2(key, file, setUploadProgress);
      await supabase.from('episodes').update({ [field]: key }).eq('id', episodeId);
      load();
      showToast(`${label} uploaded.`);
    } catch (err) {
      showToast(`${label} upload failed: ${err.message}`, { danger: true, duration: 8000 });
    }
    setUploadProgress(null);
    setIsBusy(false);
  };

  const clearMedia = async (ep, field) => {
    const label = field === 'video_r2_key' ? 'video' : 'still image';
    const key = ep[field];
    if (!(await requestConfirm(`Remove the ${label} for "${ep.title}"? This deletes the file permanently.`, { danger: true }))) return;
    setIsBusy(true);
    try {
      if (key) await deleteFromR2(key);
      const { error } = await supabase.from('episodes').update({ [field]: null }).eq('id', ep.id);
      if (error) throw new Error(error.message);
      load();
      showToast(`Removed ${label}.`);
    } catch (err) {
      showToast(`Failed to remove ${label}: ${err.message}`, { danger: true });
    }
    setIsBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="display-s">Episodes</h1>
          <p className="ui-text" style={{ marginTop: '8px' }}>Curating the cinematic narrative architecture</p>
        </div>
        <button style={primaryButtonStyle} onClick={startNew}>+ New Episode</button>
      </div>

      <ProgressBar active={isBusy} percent={uploadProgress} />

      <label className="body-s" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
        Release state
        <select style={{ ...inputStyle, width: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      {editingId === 'new' && (
        <div style={cardStyle}>
          <EpisodeForm draft={draft} setDraft={setDraft} onSave={saveEdit} onCancel={cancelEdit} isNew />
        </div>
      )}

      {pageItems.map((ep) => (
        <div key={ep.id} style={{ ...cardStyle, flexDirection: 'row', alignItems: 'center' }}>
          {editingId === ep.id ? (
            <EpisodeForm draft={draft} setDraft={setDraft} onSave={saveEdit} onCancel={cancelEdit} />
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '56px', width: '100px', flexShrink: 0 }}>{ep.num}</div>

              <div style={{ width: '200px', aspectRatio: '16/9', backgroundColor: '#151515', flexShrink: 0, position: 'relative' }}>
                {ep.still_r2_key && (
                  <>
                    <img src={mediaUrl(ep.still_r2_key)} alt={ep.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => clearMedia(ep, 'still_r2_key')} title="Remove still image" style={mediaDeleteButtonStyle}>
                      <TrashIcon width={12} height={12} />
                    </button>
                  </>
                )}
              </div>

              <div style={{ flex: 1, padding: '0 24px', minWidth: 0 }}>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '22px', display: 'block' }}>{ep.title}</strong>
                {ep.release_date && <span className="body-s">{new Date(ep.release_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                <div style={{ marginTop: '10px', display: 'flex', gap: '20px' }}>
                  <UploadLink label={ep.still_r2_key ? 'Replace still →' : 'Upload still →'} accept="image/*" onFile={(file) => handleUpload(ep.id, 'still_r2_key', file)} />
                  <UploadLink label={ep.video_r2_key ? 'Replace video →' : 'Upload video →'} accept="video/*" onFile={(file) => handleUpload(ep.id, 'video_r2_key', file)} />
                </div>

                {ep.video_r2_key && (
                  <div style={{ width: '200px', aspectRatio: '16/9', backgroundColor: '#000', position: 'relative', marginTop: '12px' }}>
                    <video
                      src={mediaUrl(ep.video_r2_key)}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button onClick={() => clearMedia(ep, 'video_r2_key')} title="Remove video" style={mediaDeleteButtonStyle}>
                      <TrashIcon width={12} height={12} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <div className="ui-text" style={{ fontSize: '9px' }}>Release State</div>
                <select style={{ ...inputStyle, width: '140px' }} value={ep.status} onChange={(e) => updateStatus(ep, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
                <button style={iconButtonStyle} onClick={() => startEdit(ep)}><PencilIcon width={14} height={14} /></button>
                <button style={iconButtonStyle} onClick={() => deleteEpisode(ep)}><TrashIcon width={14} height={14} /></button>
              </div>
            </>
          )}
        </div>
      ))}

      {filtered.length === 0 && <span className="body-s">No episodes match this filter.</span>}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalCount={filtered.length} pageSize={PAGE_SIZE} />

      {confirmDialog}
      {toast}
    </div>
  );
}

function EpisodeForm({ draft, setDraft, onSave, onCancel, isNew }) {
  const set = (field) => (e) => setDraft({ ...draft, [field]: e.target.value });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {isNew && <label className="body-s">Slug (id) <input style={inputStyle} value={draft.id} onChange={set('id')} placeholder="e.g. 04" /></label>}
      <label className="body-s">Num <input style={inputStyle} value={draft.num} onChange={set('num')} /></label>
      <label className="body-s">Title <input style={inputStyle} value={draft.title} onChange={set('title')} /></label>
      <div style={{ display: 'flex', gap: '16px' }}>
        <label className="body-s" style={{ flex: 1 }}>
          Status
          <select style={inputStyle} value={draft.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="body-s" style={{ flex: 1 }}>Release date <input type="date" style={inputStyle} value={draft.release_date} onChange={set('release_date')} /></label>
        <label className="body-s" style={{ flex: 1 }}>Sort order <input type="number" style={inputStyle} value={draft.sort_order} onChange={set('sort_order')} /></label>
      </div>
      <label className="body-s">Description <textarea style={{ ...inputStyle, minHeight: '60px' }} value={draft.description || ''} onChange={set('description')} /></label>
      <label className="body-s">Director note <textarea style={{ ...inputStyle, minHeight: '60px' }} value={draft.director_note || ''} onChange={set('director_note')} /></label>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button style={primaryButtonStyle} onClick={onSave}>Save</button>
        <button style={{ ...primaryButtonStyle, border: '1px solid var(--ash-grey)', color: 'var(--ash-grey)' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
