import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase, mediaUrl } from '../../lib/supabase';
import {
  CRAFT_LABELS, DEFAULT_SIZES, FILM_MAX_MB, FILM_TYPES, PHOTO_MAX_MB, PHOTO_TYPES,
  canPublish, joinCraft, parseCraft, publishChecks, shapeProduct, slugify, sortSizes,
} from '../../lib/products';
import { uploadToR2, safeFileName, deleteFromR2 } from './uploadToR2';
import { deleteProduct, isStorageKey } from './productAdmin';
import { useConfirm } from './useConfirm';
import { useToast } from './useToast';
import ProductPhotos from './ProductPhotos';
import ProductSizes from './ProductSizes';
import PreviewFrame from './PreviewFrame';
import './homepage-editor.css';
import './products-admin.css';

const PREVIEW_PATH = '/admin/products/preview';
const ORIGIN = window.location.origin;
const EMPTY = { id: '', name: '', caste_id: '', num: '', price: '', sku: '', passage: '', craft: [], sort_order: '0', is_published: false, video_r2_key: '' };
const SECTIONS = [['basics', 'Basics'], ['story', 'Story'], ['photos', 'Photos'], ['film', 'Film'], ['sizes', 'Sizes & stock'], ['visibility', 'Visibility']];
// The address hash (#pe-photos) opens a section directly.
const sectionFromHash = () => { const id = window.location.hash.replace('#pe-', ''); return SECTIONS.some(([key]) => key === id) ? id : 'basics'; };
const SUMMARY_LENGTH = 180; // the product page shows this much of the description under the price
const post = (target, message) => { if (target && !target.closed) target.postMessage(message, ORIGIN); };
let uidCounter = 0;
const uid = () => `p${Date.now().toString(36)}${(uidCounter += 1)}`;
const fileName = key => decodeURIComponent((key || '').split('/').pop()).replace(/^\d{10,}-/, '');

function toState(row) {
  return {
    // Inputs hold text, so numbers are stored as strings too; otherwise an untouched form would look edited.
    form: {
      id: row.id, name: row.name || '', caste_id: row.caste_id || '', num: row.num || '', price: row.price == null ? '' : String(row.price), sku: row.sku || '',
      passage: row.passage || '', craft: parseCraft(row.craft), sort_order: String(row.sort_order ?? 0), is_published: Boolean(row.is_published), video_r2_key: row.video_r2_key || '',
    },
    sizes: [...(row.product_sizes || [])].map(({ size, in_stock }) => ({ size, in_stock })).sort(sortSizes),
    photos: [...(row.product_images || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(image => ({ uid: uid(), id: image.id, r2_key: image.r2_key, alt: image.alt || '' })),
  };
}
// What counts as an edit: broken/uploading flags are display state, not content.
const snapshot = ({ form, sizes, photos }) => JSON.stringify({ form, sizes, photos: photos.map(({ id, r2_key, alt }) => ({ id, r2_key, alt })) });

function Field({ id, label, hint, children }) {
  return <div className="hp-field">
    <label htmlFor={id}>{label}</label>
    {children}
    {hint && <span className="hp-hint" id={`${id}-hint`}>{hint}</span>}
  </div>;
}

export default function AdminProductEditor() {
  const { productId } = useParams();
  const isNew = !productId;
  const navigate = useNavigate();
  const [original, setOriginal] = useState(null); // the saved row, with sizes and photos
  const [form, setForm] = useState(EMPTY);
  const [sizes, setSizes] = useState(() => DEFAULT_SIZES.map(size => ({ size, in_stock: true })));
  const [photos, setPhotos] = useState([]);
  const [saved, setSaved] = useState(null);
  const [castes, setCastes] = useState([]);
  const [slugEdited, setSlugEdited] = useState(false);
  const [state, setState] = useState(isNew ? 'ready' : 'loading'); // loading | ready | missing
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [error, setError] = useState('');
  const [deleteName, setDeleteName] = useState('');
  const [device, setDevice] = useState('desktop');
  const [view, setView] = useState('edit');
  const [section, setSection] = useState(sectionFromHash);
  const sessionUploads = useRef(new Set()); // storage keys uploaded here and not yet saved
  const frameRef = useRef(null);
  const popupRef = useRef(null);
  const latestView = useRef(null);
  const [confirmDialog, requestConfirm] = useConfirm();
  const [toast, showToast] = useToast();

  const load = useCallback(async () => {
    if (isNew) { setSaved(snapshot({ form: EMPTY, sizes: DEFAULT_SIZES.map(size => ({ size, in_stock: true })), photos: [] })); return; }
    setState('loading');
    const { data, error: loadError } = await supabase.from('products')
      .select('*, castes(name), product_sizes(size, in_stock), product_images(id, r2_key, sort_order, alt)')
      .eq('id', productId).maybeSingle();
    if (loadError) { setError(`This garment could not load: ${loadError.message}`); setState('ready'); return; }
    if (!data) { setState('missing'); return; }
    const next = toState(data);
    setOriginal(data); setForm(next.form); setSizes(next.sizes); setPhotos(next.photos); setSaved(snapshot(next));
    sessionUploads.current = new Set();
    setState('ready');
  }, [isNew, productId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { supabase.from('castes').select('id, name').order('sort_order').then(({ data }) => setCastes(data || [])); }, []);

  const dirty = saved !== null && snapshot({ form, sizes, photos }) !== saved;
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const setName = value => setForm(current => ({ ...current, name: value, id: isNew && !slugEdited ? slugify(value) : current.id }));
  const readyPhotos = photos.filter(p => !p.uploading);
  const checks = publishChecks(form, sizes, readyPhotos);
  const missing = checks.filter(c => c.required && !c.ok);
  const casteName = id => (id === 'old-world' ? 'Old World archive' : castes.find(c => c.id === id)?.name || '');

  // Live preview: the real product page drawn from what is on screen now.
  const previewProduct = useMemo(() => shapeProduct({
    ...form, price: Number(form.price) || 0, craft: joinCraft(form.craft), castes: { name: casteName(form.caste_id) || 'The Sanctum' },
    product_images: readyPhotos.filter(p => !p.broken).map((p, index) => ({ r2_key: p.r2_key, alt: p.alt, sort_order: index })),
    product_sizes: sizes,
  }, mediaUrl), [form, sizes, photos, castes]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { latestView.current = previewProduct; });
  useEffect(() => {
    const timer = setTimeout(() => [frameRef.current?.contentWindow, popupRef.current].forEach(w => post(w, { type: 'pp-product', product: previewProduct })), 150);
    return () => clearTimeout(timer);
  }, [previewProduct]);
  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== ORIGIN || event.data?.type !== 'pp-ready') return;
      if (event.source !== frameRef.current?.contentWindow && event.source !== popupRef.current) return;
      post(event.source, { type: 'pp-product', product: latestView.current });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  const openPreviewTab = () => {
    popupRef.current = window.open(PREVIEW_PATH, 'gauddly-product-preview');
    if (!popupRef.current) showToast('Your browser blocked the new tab. Allow pop-ups for this site and try again.', { danger: true });
  };

  const uploadFile = async (file, types, maxMb, onProgress) => {
    if (!types.includes(file.type) || file.size > maxMb * 1024 * 1024) throw new Error(`${file.name}: choose a ${types.map(t => t.split('/')[1].toUpperCase()).join(', ')} file up to ${maxMb} MB.`);
    const key = `products/${form.id || 'new'}/${Date.now()}-${safeFileName(file.name)}`;
    setUploads(n => n + 1);
    try { await uploadToR2(key, file, onProgress); } finally { setUploads(n => n - 1); }
    sessionUploads.current.add(key);
    return key;
  };
  const uploadPhotos = files => {
    setError('');
    files.forEach(async file => {
      const temp = uid();
      setPhotos(list => [...list, { uid: temp, r2_key: '', alt: '', uploading: true, progress: 0 }]);
      try {
        const key = await uploadFile(file, PHOTO_TYPES, PHOTO_MAX_MB, progress => setPhotos(list => list.map(p => (p.uid === temp ? { ...p, progress } : p))));
        setPhotos(list => list.map(p => (p.uid === temp ? { uid: temp, r2_key: key, alt: '' } : p)));
      } catch (err) {
        setPhotos(list => list.filter(p => p.uid !== temp));
        setError(err.message);
      }
    });
  };
  const [filmProgress, setFilmProgress] = useState(null);
  const uploadFilm = async file => {
    if (!file) return;
    setError(''); setFilmProgress(0);
    try { set('video_r2_key', await uploadFile(file, FILM_TYPES, FILM_MAX_MB, setFilmProgress)); } catch (err) { setError(err.message); }
    finally { setFilmProgress(null); }
  };

  // Uploaded here but never saved: remove from storage so nothing is left behind.
  const dropUnsavedUploads = async keep => {
    const stale = [...sessionUploads.current].filter(key => !keep.has(key));
    sessionUploads.current = new Set();
    await Promise.allSettled(stale.map(deleteFromR2));
  };

  const save = async () => {
    setError('');
    const problems = [];
    if (!form.name.trim()) problems.push('Add a name.');
    if (!form.caste_id) problems.push('Choose a caste.');
    if (isNew && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.id)) problems.push('The page address can use lower-case letters, numbers and hyphens only.');
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) problems.push('Enter a price of ₹0 or more.');
    if (form.is_published && !canPublish(checks)) problems.push(`To publish, it still needs: ${missing.map(c => c.text.toLowerCase()).join(', ')}. Or switch it to draft.`);
    if (uploads) problems.push('Wait for uploads to finish.');
    if (problems.length) { setError(problems.join(' ')); return; }

    setBusy(true);
    const id = isNew ? form.id : productId;
    const row = {
      name: form.name.trim(), caste_id: form.caste_id, num: form.num.trim() || null, price: Number(form.price), sku: form.sku.trim() || null,
      passage: form.passage, craft: joinCraft(form.craft), sort_order: Number(form.sort_order) || 0, is_published: form.is_published, video_r2_key: form.video_r2_key || null,
    };
    const fail = message => { throw new Error(message); };
    let created = false; // the new row exists, so a retry must edit it rather than create it again
    try {
      // A new garment starts as a draft and goes live only once its sizes and photos are stored.
      const { error: rowError } = isNew ? await supabase.from('products').insert({ id, ...row, is_published: false }) : await supabase.from('products').update(row).eq('id', id);
      if (rowError) fail(rowError.code === '23505' ? `A garment already uses the address “${id}”. Choose another.` : rowError.message);
      created = isNew;

      const before = original?.product_sizes || [];
      const removedSizes = before.filter(s => !sizes.some(n => n.size === s.size)).map(s => s.size);
      const addedSizes = sizes.filter(s => !before.some(b => b.size === s.size));
      const changedSizes = sizes.filter(s => before.some(b => b.size === s.size && b.in_stock !== s.in_stock));
      if (removedSizes.length) { const { error: e } = await supabase.from('product_sizes').delete().eq('product_id', id).in('size', removedSizes); if (e) fail(e.message); }
      if (addedSizes.length) { const { error: e } = await supabase.from('product_sizes').insert(addedSizes.map(s => ({ product_id: id, ...s }))); if (e) fail(e.message); }
      for (const s of changedSizes) { const { error: e } = await supabase.from('product_sizes').update({ in_stock: s.in_stock }).eq('product_id', id).eq('size', s.size); if (e) fail(e.message); }

      const beforePhotos = original?.product_images || [];
      const removedPhotos = beforePhotos.filter(image => !photos.some(p => p.id === image.id));
      if (removedPhotos.length) { const { error: e } = await supabase.from('product_images').delete().in('id', removedPhotos.map(image => image.id)); if (e) fail(e.message); }
      const added = readyPhotos.map((p, index) => ({ ...p, index })).filter(p => !p.id);
      if (added.length) { const { error: e } = await supabase.from('product_images').insert(added.map(p => ({ product_id: id, r2_key: p.r2_key, alt: p.alt || null, sort_order: p.index }))); if (e) fail(e.message); }
      for (const [index, p] of readyPhotos.entries()) {
        const was = p.id && beforePhotos.find(image => image.id === p.id);
        if (was && (was.sort_order !== index || (was.alt || '') !== p.alt)) { const { error: e } = await supabase.from('product_images').update({ sort_order: index, alt: p.alt || null }).eq('id', p.id); if (e) fail(e.message); }
      }
      if (isNew && row.is_published) { const { error: e } = await supabase.from('products').update({ is_published: true }).eq('id', id); if (e) fail(e.message); }

      // Files leave storage only once the rows that used them are gone.
      const keep = new Set([...readyPhotos.map(p => p.r2_key), form.video_r2_key]);
      const orphaned = [...removedPhotos.map(image => image.r2_key), original?.video_r2_key !== form.video_r2_key && original?.video_r2_key].filter(key => isStorageKey(key) && !keep.has(key));
      await Promise.allSettled(orphaned.map(deleteFromR2));
      sessionUploads.current = new Set();

      showToast(isNew ? 'Garment created.' : 'Changes saved.');
      if (isNew) navigate(`/admin/products/${id}`, { replace: true }); else await load();
    } catch (err) {
      setError(`${err.message}${isNew && !created ? '' : ' Some changes may have been saved; the page has been reloaded to show what is stored.'}`);
      if (created) {
        // Uploads may already be referenced by saved photos, so they are kept rather than deleted.
        sessionUploads.current = new Set();
        navigate(`/admin/products/${id}`, { replace: true });
      } else if (!isNew) await load();
    } finally { setBusy(false); }
  };

  const discard = async () => {
    if (dirty && !(await requestConfirm('Discard your unsaved changes?'))) return;
    await dropUnsavedUploads(new Set());
    if (isNew) navigate('/admin/products'); else load();
  };
  const back = async () => {
    if (dirty && !(await requestConfirm('Leave without saving? Your changes will be lost.'))) return;
    await dropUnsavedUploads(new Set());
    navigate('/admin/products');
  };
  const remove = async () => {
    setBusy(true); setError('');
    try {
      const { failedFiles } = await deleteProduct(original);
      await dropUnsavedUploads(new Set());
      navigate('/admin/products', { state: { message: `Deleted “${original.name}”.${failedFiles.length ? ` ${failedFiles.length} file(s) could not be removed from storage.` : ''}` } });
    } catch (err) { setError(err.message); setBusy(false); }
  };
  const openSection = id => {
    setSection(id);
    window.history.replaceState(null, '', `#pe-${id}`);
  };
  const togglePublished = next => {
    if (next && !canPublish(checks)) { setError(`To publish, it still needs: ${missing.map(c => c.text.toLowerCase()).join(', ')}.`); return; }
    setError('');
    set('is_published', next);
  };

  if (state === 'loading') return <p className="hp-hint" role="status">Loading garment…</p>;
  if (state === 'missing') return <div className="hp-editor"><p className="hp-banner is-danger" role="alert">This garment does not exist. It may have been deleted.</p><Link to="/admin/products">← Back to products</Link></div>;

  const summaryLength = form.passage.length;
  const notes = {
    basics: form.name && form.caste_id && Number(form.price) > 0 ? '' : 'Needs details',
    story: form.passage ? '' : 'No description',
    photos: photos.some(p => p.broken) ? 'Photo missing' : readyPhotos.length ? `${readyPhotos.length} photo${readyPhotos.length === 1 ? '' : 's'}` : 'No photos',
    film: form.video_r2_key ? '1 film' : 'None',
    sizes: sizes.length ? `${sizes.filter(s => s.in_stock).length} of ${sizes.length} in stock` : 'No sizes',
    visibility: form.is_published ? 'Published' : 'Draft',
  };
  const warnNote = id => ['Needs details', 'Photo missing', 'No sizes'].includes(notes[id]) || (id === 'photos' && notes.photos === 'No photos');
  const locked = busy || uploads > 0;

  return <div className="hp-editor pe">
    <header className="hp-topbar">
      <button type="button" className="hp-btn hp-btn-quiet" onClick={back}>← Products</button>
      <div className="hp-title"><span className="hp-eyebrow">{isNew ? 'New garment' : 'Garment'}</span><h1>{form.name || 'Untitled garment'}</h1></div>
      {!isNew && <span className={original?.is_published ? 'pa-status is-live' : 'pa-status'}>{original?.is_published ? 'Published' : 'Draft'}</span>}
      <p className={`hp-status is-${dirty ? 'warn' : 'ok'}`} role="status"><span className="hp-status-dot" aria-hidden="true" />{dirty ? 'Unsaved changes' : isNew ? 'Not created yet' : 'All changes saved'}</p>
      <div className="hp-actions">
        {(dirty || isNew) && <button type="button" className="hp-btn hp-btn-quiet" onClick={discard} disabled={locked}>{isNew ? 'Cancel' : 'Discard'}</button>}
        <button type="button" className="hp-btn hp-btn-primary" onClick={save} disabled={locked || (!dirty && !isNew)}>{busy ? 'Saving…' : isNew ? 'Create garment' : 'Save changes'}</button>
      </div>
    </header>
    {error && <p className="hp-banner is-danger" role="alert">{error}</p>}
    {uploads > 0 && <p className="hp-banner" role="status">Uploading… saving is paused until uploads finish.</p>}

    <div className="hp-viewtabs" role="tablist" aria-label="Editor view">
      <button type="button" role="tab" aria-selected={view === 'edit'} onClick={() => setView('edit')}>Edit</button>
      <button type="button" role="tab" aria-selected={view === 'preview'} onClick={() => setView('preview')}>Preview</button>
    </div>
    <div className="hp-body" data-view={view}>
      <nav className="hp-sections pe-nav" aria-label="Garment sections">
        <ol>{SECTIONS.map(([id, name]) => <li key={id}><button type="button" aria-current={section === id ? 'step' : undefined} aria-controls={`pe-${id}`} onClick={() => openSection(id)}>
          <span>{name}</span><span className={warnNote(id) ? 'hp-section-meta is-warning' : 'hp-section-meta'}>{notes[id]}</span>
        </button></li>)}</ol>
      </nav>

      <div className="hp-form pe-form">
        <section id="pe-basics" aria-labelledby="pe-basics-title" hidden={section !== 'basics'}>
          <h2 id="pe-basics-title">Basics</h2>
          <Field id="pe-name" label="Name"><input id="pe-name" value={form.name} onChange={event => setName(event.target.value)} /></Field>
          {isNew
            ? <Field id="pe-id" label="Page address" hint={`The garment's page will be /the-${form.caste_id || 'caste'}/${form.id || '…'}. It cannot be changed later.`}>
              <input id="pe-id" value={form.id} aria-describedby="pe-id-hint" onChange={event => { setSlugEdited(true); set('id', slugify(event.target.value)); }} />
            </Field>
            : <p className="hp-hint">Page address: /the-{form.caste_id}/{form.id}</p>}
          <div className="pe-grid">
            <Field id="pe-caste" label="Caste">
              <select id="pe-caste" value={form.caste_id} onChange={event => set('caste_id', event.target.value)}>
                <option value="">Choose a caste</option>
                {castes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                {form.caste_id === 'old-world' && !castes.some(c => c.id === 'old-world') && <option value="old-world">Old World archive</option>}
              </select>
            </Field>
            <Field id="pe-num" label="Piece number" hint="Optional, e.g. I or 04."><input id="pe-num" value={form.num} aria-describedby="pe-num-hint" onChange={event => set('num', event.target.value)} /></Field>
            <Field id="pe-price" label="Price (₹)"><input id="pe-price" inputMode="numeric" value={form.price} onChange={event => set('price', event.target.value.replace(/[^\d.]/g, ''))} /></Field>
            <Field id="pe-sku" label="SKU" hint="Optional."><input id="pe-sku" value={form.sku} aria-describedby="pe-sku-hint" onChange={event => set('sku', event.target.value)} /></Field>
          </div>
          <Field id="pe-order" label="Position in the store" hint="Lower numbers appear first within the caste."><input id="pe-order" type="number" value={form.sort_order} aria-describedby="pe-order-hint" onChange={event => set('sort_order', event.target.value)} /></Field>
        </section>

        <section id="pe-story" aria-labelledby="pe-story-title" hidden={section !== 'story'}>
          <h2 id="pe-story-title">Story</h2>
          <div className="hp-field">
            <div className="hp-field-head"><label htmlFor="pe-passage">Description</label><span className={summaryLength > SUMMARY_LENGTH ? 'hp-count is-over' : 'hp-count'}>{summaryLength} / {SUMMARY_LENGTH}</span></div>
            <textarea id="pe-passage" rows={4} value={form.passage} aria-describedby="pe-passage-hint" onChange={event => set('passage', event.target.value)} />
            <span className="hp-hint" id="pe-passage-hint">The first {SUMMARY_LENGTH} characters show under the price; the whole text appears further down the page.</span>
          </div>
          <div className="pe-craft">
            <span className="hp-field-head"><span>Garment details &amp; care</span></span>
            <span className="hp-hint">Each line appears separately under “Garment details &amp; care”.</span>
            {form.craft.map((line, index) => <div className="pe-craft-line" key={index}>
              <label className="sr-only" htmlFor={`pe-craft-label-${index}`}>Heading for line {index + 1}</label>
              <select id={`pe-craft-label-${index}`} value={line.label} onChange={event => set('craft', form.craft.map((l, i) => (i === index ? { ...l, label: event.target.value } : l)))}>
                <option value="">General note</option>
                {CRAFT_LABELS.map(label => <option key={label} value={label}>{label}</option>)}
              </select>
              <label className="sr-only" htmlFor={`pe-craft-text-${index}`}>Text for line {index + 1}</label>
              <textarea id={`pe-craft-text-${index}`} rows={2} value={line.text} onChange={event => set('craft', form.craft.map((l, i) => (i === index ? { ...l, text: event.target.value } : l)))} />
              <button type="button" className="hp-btn hp-icon-btn" aria-label={`Remove line ${index + 1}`} onClick={() => set('craft', form.craft.filter((_, i) => i !== index))}>✕</button>
            </div>)}
            <button type="button" className="hp-btn pe-add" onClick={() => set('craft', [...form.craft, { label: CRAFT_LABELS.find(label => !form.craft.some(l => l.label === label)) || '', text: '' }])}>+ Add a line</button>
          </div>
        </section>

        <section id="pe-photos" aria-labelledby="pe-photos-title" hidden={section !== 'photos'}>
          <h2 id="pe-photos-title">Photos</h2>
          <ProductPhotos photos={photos} onChange={setPhotos} onUpload={uploadPhotos} onBroken={key => setPhotos(list => list.map(p => (p.uid === key ? { ...p, broken: true } : p)))} disabled={busy} />
        </section>

        <section id="pe-film" aria-labelledby="pe-film-title" hidden={section !== 'film'}>
          <h2 id="pe-film-title">Film</h2>
          {form.video_r2_key ? <div className="hp-media-current">
            <video src={mediaUrl(form.video_r2_key)} preload="metadata" muted controls />
            <div className="hp-media-meta">
              <span className="hp-media-name">{fileName(form.video_r2_key)}</span>
              <div className="hp-media-actions">
                <label className="hp-btn">Replace<input type="file" className="sr-only" accept={FILM_TYPES.join(',')} disabled={locked} onChange={event => { uploadFilm(event.target.files?.[0]); event.target.value = ''; }} /></label>
                <button type="button" className="hp-btn" disabled={locked} onClick={() => set('video_r2_key', '')}>Remove</button>
              </div>
            </div>
          </div> : <label className="hp-drop">
            <span>Add a film <u>choose a file</u></span>
            <span className="hp-hint">Optional. MP4 or WebM, up to {FILM_MAX_MB} MB. Shown in the gallery after the photos.</span>
            <input type="file" className="sr-only" accept={FILM_TYPES.join(',')} disabled={locked} onChange={event => { uploadFilm(event.target.files?.[0]); event.target.value = ''; }} />
          </label>}
          {filmProgress !== null && <progress value={filmProgress} max="100" aria-label="Film upload progress" />}
        </section>

        <section id="pe-sizes" aria-labelledby="pe-sizes-title" hidden={section !== 'sizes'}>
          <h2 id="pe-sizes-title">Sizes &amp; stock</h2>
          <ProductSizes sizes={sizes} onChange={setSizes} disabled={busy} />
        </section>

        <section id="pe-visibility" aria-labelledby="pe-visibility-title" hidden={section !== 'visibility'}>
          <h2 id="pe-visibility-title">Visibility</h2>
          <label className="hp-switch pe-publish">
            <input type="checkbox" role="switch" checked={form.is_published} disabled={busy} onChange={event => togglePublished(event.target.checked)} />
            <span>{form.is_published ? 'Published: shown in the store after you save' : 'Draft: hidden from the store'}</span>
          </label>
          <ul className="pe-checks" aria-label="Before this garment can be published">
            {checks.map(check => <li key={check.id} className={check.ok ? 'is-ok' : check.required ? 'is-missing' : 'is-optional'}>
              <span aria-hidden="true">{check.ok ? '✓' : check.required ? '!' : '·'}</span>
              <span>{check.text}{!check.required && ' (recommended)'}{!check.ok && check.hint && <small> {check.hint}</small>}</span>
            </li>)}
          </ul>
          {form.is_published && !canPublish(checks) && <p className="hp-hint is-warning">This garment is published but no longer meets every requirement. Fix it, or switch it to draft.</p>}

          {!isNew && original && <div className="pe-danger">
            <h3>Delete this garment</h3>
            <p className="hp-hint">Removes it from the store, along with its photos, film and sizes, including the files in storage. Past orders keep their own copy of the name and price. This cannot be undone.</p>
            <label htmlFor="pe-delete">Type <strong>{original.name}</strong> to confirm</label>
            <input id="pe-delete" value={deleteName} autoComplete="off" onChange={event => setDeleteName(event.target.value)} />
            <button type="button" className="hp-btn pa-danger" disabled={busy || deleteName.trim() !== original.name} onClick={remove}>Delete garment</button>
          </div>}
        </section>
        <div className="pe-steps">
          {SECTIONS.map(([id], i) => (id === section ? <span key={id} className="pe-row">
            {i > 0 && <button type="button" className="hp-btn" onClick={() => openSection(SECTIONS[i - 1][0])}>← {SECTIONS[i - 1][1]}</button>}
            {i < SECTIONS.length - 1 && <button type="button" className="hp-btn" onClick={() => openSection(SECTIONS[i + 1][0])}>{SECTIONS[i + 1][1]} →</button>}
          </span> : null))}
        </div>
      </div>

      <PreviewFrame frameRef={frameRef} src={PREVIEW_PATH} title="Product page preview" device={device} onDeviceChange={setDevice} onOpenTab={openPreviewTab}
        label={dirty ? 'Live preview · unsaved' : 'Live preview'} hint="The real product page. Links and Claim are paused; the gallery and sizes work." />
    </div>
    {confirmDialog}
    {toast}
  </div>;
}
