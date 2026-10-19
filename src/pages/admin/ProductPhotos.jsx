import { useState } from 'react';
import { mediaUrl } from '../../lib/supabase';
import { moveItem } from '../../lib/homepage';
import { PHOTO_MAX_MB, PHOTO_TYPES } from '../../lib/products';

// The old uploader filled descriptions with the product's address (e.g. "dust-robe"); treat those as missing.
const placeholderAlt = alt => !alt?.trim() || /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(alt.trim());

// A compact grid of thumbnails; the selected photo is edited in one panel underneath.
// Photos are edited locally and written on Save; uploads go to storage straight away so they can be previewed.
export default function ProductPhotos({ photos, onChange, onUpload, onBroken, disabled }) {
  const [selectedUid, setSelectedUid] = useState(photos[0]?.uid ?? null);
  const [dragFrom, setDragFrom] = useState(null);
  const [dropping, setDropping] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const index = Math.max(0, photos.findIndex(p => p.uid === selectedUid));
  const selected = photos[index];
  const undescribed = photos.filter(p => !p.uploading && !p.broken && placeholderAlt(p.alt)).length;
  const missing = photos.filter(p => p.broken).length;

  const move = (from, to) => {
    const next = moveItem(photos, from, to);
    if (next === photos) return;
    onChange(next);
    setAnnouncement(to === 0 ? 'Photo set as cover.' : `Photo moved to position ${to + 1} of ${photos.length}.`);
  };
  const update = patch => onChange(photos.map(p => (p.uid === selected.uid ? { ...p, ...patch } : p)));
  const remove = () => {
    const next = photos.filter(p => p.uid !== selected.uid);
    onChange(next);
    setSelectedUid(next[Math.min(index, next.length - 1)]?.uid ?? null);
    setAnnouncement('Photo removed. It is deleted from storage when you save.');
  };
  const pick = files => { if (files?.length) onUpload([...files]); };
  const hasFiles = event => event.dataTransfer.types.includes('Files');

  return <div className={dropping ? 'pe-photos is-dropping' : 'pe-photos'}
    onDragOver={event => { if (hasFiles(event)) { event.preventDefault(); setDropping(true); } }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDropping(false); }}
    onDrop={event => { if (!hasFiles(event)) return; event.preventDefault(); setDropping(false); pick(event.dataTransfer.files); }}>

    <div className="pe-photos-head">
      <span className="hp-hint">{photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'} · the first is the cover · drag to reorder` : 'No photos yet. The first photo you add becomes the cover.'}</span>
      {(missing > 0 || undescribed > 0) && <span className="hp-hint is-warning">{[missing && `${missing} missing`, undescribed && `${undescribed} without a description`].filter(Boolean).join(' · ')}</span>}
    </div>

    <ol className="pe-tiles">
      {photos.map((photo, i) => <li key={photo.uid}
        className={dragFrom === i ? 'is-dragging' : ''}
        draggable={!disabled && !photo.uploading}
        onDragStart={event => { setDragFrom(i); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', photo.uid); }}
        onDragOver={event => { if (dragFrom !== null) event.preventDefault(); }}
        onDrop={event => { if (dragFrom === null) return; event.preventDefault(); event.stopPropagation(); move(dragFrom, i); setDragFrom(null); }}
        onDragEnd={() => setDragFrom(null)}>
        <button type="button" className={['pe-tile', photo.broken && 'is-broken'].filter(Boolean).join(' ')} aria-pressed={selected?.uid === photo.uid}
          aria-label={`Photo ${i + 1}${i === 0 ? ', cover' : ''}${photo.broken ? ', file missing' : ''}${photo.uploading ? ', uploading' : ''}${photo.alt ? `: ${photo.alt}` : ''}`}
          onClick={() => setSelectedUid(photo.uid)}>
          {photo.uploading ? <span className="pe-tile-state"><progress value={photo.progress ?? 0} max="100" />{photo.progress ?? 0}%</span>
            : photo.broken ? <span className="pe-tile-state is-warning">Missing</span>
              : <img src={mediaUrl(photo.r2_key)} alt="" loading="lazy" draggable={false} onError={() => onBroken(photo.uid)} />}
          <span className="pe-tile-badge" aria-hidden="true">{i === 0 ? 'Cover' : i + 1}</span>
        </button>
      </li>)}
      <li>
        <label className="pe-tile pe-tile-add">
          <span aria-hidden="true">+</span>
          <span>Add photos</span>
          <input type="file" className="sr-only" multiple accept={PHOTO_TYPES.join(',')} disabled={disabled} onChange={event => { pick(event.target.files); event.target.value = ''; }} />
        </label>
      </li>
    </ol>
    <p className="hp-hint">Or drop image files anywhere here. JPG, PNG, WebP or AVIF, up to {PHOTO_MAX_MB} MB each.</p>

    {selected && !selected.uploading && <div className="pe-photo-detail" aria-label={`Photo ${index + 1} settings`} role="group">
      <div className="pe-photo-large">
        {selected.broken ? <span className="pe-tile-state is-warning">File missing<small>{selected.r2_key}</small></span> : <img src={mediaUrl(selected.r2_key)} alt="" />}
      </div>
      <div className="pe-photo-fields">
        <span className="pe-photo-title">{index === 0 ? 'Cover photo' : `Photo ${index + 1} of ${photos.length}`}</span>
        {selected.broken
          ? <p className="hp-hint is-warning">This photo's file does not exist, so the store shows an empty frame. Remove it and add the real photo.</p>
          : <div className="hp-field">
            <label htmlFor="pe-photo-alt">Description for screen readers</label>
            <input id="pe-photo-alt" placeholder="e.g. Front view of white flared jeans" value={selected.alt || ''} disabled={disabled} aria-describedby="pe-photo-alt-hint" onChange={event => update({ alt: event.target.value })} />
            <span id="pe-photo-alt-hint" className={placeholderAlt(selected.alt) ? 'hp-hint is-warning' : 'hp-hint'}>{placeholderAlt(selected.alt) ? 'Describe what the photo shows; the current text is a placeholder.' : 'One short sentence about what the photo shows.'}</span>
          </div>}
        <div className="pe-row">
          <button type="button" className="hp-btn" disabled={disabled || index === 0} onClick={() => move(index, index - 1)}>← Earlier</button>
          <button type="button" className="hp-btn" disabled={disabled || index === photos.length - 1} onClick={() => move(index, index + 1)}>Later →</button>
          {index > 0 && !selected.broken && <button type="button" className="hp-btn" disabled={disabled} onClick={() => move(index, 0)}>Make cover</button>}
          <button type="button" className="hp-btn pa-danger" disabled={disabled} onClick={remove}>Remove</button>
        </div>
      </div>
    </div>}
    <p className="sr-only" role="status">{announcement}</p>
  </div>;
}
