import { useCallback, useEffect, useState } from 'react';
import { supabase, mediaUrl } from '../../lib/supabase';
import { freshHome, normalizeHome, assetKey, homeLink } from '../../lib/homepage';
import { loadHomeCatalog } from '../../lib/homepage-api';
import { uploadToR2, safeFileName } from './uploadToR2';
import HomeExperience from '../../components/HomeExperience';
import './homepage-editor.css';

function Field({ label, value, onChange, multiline = false }) {
  return <label className="hp-field">{label}{multiline ? <textarea rows={3} value={value || ''} onChange={e => onChange(e.target.value)} /> : <input value={value || ''} onChange={e => onChange(e.target.value)} />}</label>;
}

function MediaField({ label, value, onChange, video = false, sectionId, setUploading }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const upload = async e => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const types = video ? ['video/mp4', 'video/webm'] : ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!types.includes(file.type) || file.size > (video ? 100 : 15) * 1024 * 1024) { setError(`Choose ${video ? 'MP4/WebM under 100 MB' : 'JPG/PNG/WebP/AVIF under 15 MB'}.`); return; }
    setError(''); setProgress(0); setUploading(true);
    try {
      const key = `homepage/${sectionId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      await uploadToR2(key, file, setProgress); onChange(key);
    } catch (err) { setError(err.message); }
    finally { setProgress(null); setUploading(false); }
  };
  return <div className="hp-media-field"><Field label={label} value={value} onChange={onChange} /><div className="hp-actions"><label className="hp-upload">Upload {video ? 'video' : 'image'}<input type="file" disabled={progress !== null} accept={video ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/avif'} onChange={upload} /></label>{value && <button type="button" onClick={() => onChange('')}>Clear asset</button>}</div>{progress !== null && <progress aria-label={`${label} upload`} value={progress} max="100" />}{error && <p role="alert">{error}</p>}{value && assetKey(value) && (video ? <video src={mediaUrl(assetKey(value))} controls preload="none" /> : <img src={mediaUrl(assetKey(value))} alt={`${label} preview`} />)}</div>;
}

export default function AdminHomepage() {
  const [draft, setDraft] = useState(freshHome);
  const [saved, setSaved] = useState('');
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [active, setActive] = useState('hero');
  const [preview, setPreview] = useState(false);
  const [catalog, setCatalog] = useState({ products: [], castes: [], episodes: [] });
  const dirty = JSON.stringify(draft) !== saved;
  const load = useCallback(async () => {
    setBusy(true); setError(''); setReady(false);
    try {
      const { data, error: loadError } = await supabase.from('homepage_content').select('draft,revision').eq('id', 'homepage').single();
      if (loadError) throw loadError;
      const content = normalizeHome(data.draft); setDraft(content); setSaved(JSON.stringify(content)); setRevision(data.revision); setReady(true);
    } catch (err) { setError(`Homepage editing is not available: ${err.message}. If this is a new installation, apply the homepage SQL migration first.`); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); loadHomeCatalog().then(setCatalog).catch(() => setError('The catalog could not load. Reload to retry.')); }, [load]);
  useEffect(() => {
    if (!dirty || !ready) return;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, ready]);
  const update = (id, field, value) => setDraft(d => ({ sections: d.sections.map(s => s.id === id ? { ...s, [field]: value } : s) }));
  const setUploading = uploading => setUploads(n => n + (uploading ? 1 : -1));
  const move = (index, delta) => setDraft(d => { const sections = [...d.sections]; [sections[index], sections[index + delta]] = [sections[index + delta], sections[index]]; return { sections }; });
  const save = async publish => {
    if (busy || uploads || !ready) return;
    if (publish && !window.confirm('Publish this homepage for all visitors?')) return;
    for (const s of draft.sections) {
      for (const field of ['image', 'mobileImage', 'poster', 'video', 'mobileVideo']) {
        if (s[field] && !assetKey(s[field])) { setError(`Invalid ${field} in ${s.id}. Use an HTTPS URL or R2 key.`); return; }
      }
      if (s.href && homeLink(s.href, '') !== s.href) { setError(`Use a local link beginning with / in ${s.id}.`); return; }
    }
    setBusy(true); setError(''); setMessage('');
    try {
      const content = normalizeHome(draft);
      const { data, error: saveError } = await supabase.rpc('save_homepage', { content, expected_revision: revision, publish });
      if (saveError) throw saveError;
      setRevision(data); setDraft(content); setSaved(JSON.stringify(content)); setMessage(publish ? 'Published. The homepage is now live.' : 'Draft saved. The public homepage has not changed.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const section = draft.sections.find(s => s.id === active);
  const media = (field, label, video = false) => <MediaField key={`${active}-${field}`} sectionId={active} label={label} video={video} value={section[field]} onChange={value => update(active, field, value)} setUploading={setUploading} />;
  const selectProducts = ['featured', 'archive'].includes(active);
  return <div className="homepage-editor">
    <header><span className="ui-text">Content studio</span><h1 className="display-s">Homepage</h1><p>Shape the next chapter. Save a draft, preview it, then publish.</p></header>
    <div className="hp-toolbar"><span>{dirty ? 'Unsaved changes' : 'Draft saved'}</span><div className="hp-actions"><button disabled={busy || uploads > 0} onClick={() => { if (!dirty || window.confirm('Discard unsaved changes and reload?')) load(); }}>Reload</button><button onClick={() => setPreview(!preview)}>{preview ? 'Back to editor' : 'Preview'}</button><button disabled={!ready || busy || uploads > 0} onClick={() => save(false)}>Save draft</button><button className="hp-publish" disabled={!ready || busy || uploads > 0} onClick={() => save(true)}>{busy ? 'Working…' : 'Publish'}</button></div></div>
    {error && <p className="hp-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}{catalog.failed && <p role="alert">Some catalog choices could not load. Reload this page to retry.</p>}
    {preview ? <div className="hp-preview" onClickCapture={e => { if (e.target.closest('a')) e.preventDefault(); }}><HomeExperience content={normalizeHome(draft)} catalog={catalog} preview /></div> : <div className="hp-layout">
      <aside aria-label="Homepage sections">{draft.sections.map((s, i) => <div className="hp-section-row" key={s.id}><button aria-pressed={active === s.id} onClick={() => setActive(s.id)}>{String(i + 1).padStart(2, '0')} · {s.id}{s.enabled === false ? ' (hidden)' : ''}</button><div><button aria-label={`Move ${s.id} up`} disabled={i === 0 || uploads > 0} onClick={() => move(i, -1)}>↑</button><button aria-label={`Move ${s.id} down`} disabled={i === draft.sections.length - 1 || uploads > 0} onClick={() => move(i, 1)}>↓</button></div></div>)}</aside>
      <fieldset disabled={busy || uploads > 0} className="hp-fields"><legend>{active}</legend><label><input type="checkbox" checked={section.enabled !== false} onChange={e => update(active, 'enabled', e.target.checked)} /> Show section</label>
        {['label', 'title', 'body', 'cta', 'href'].map(field => <Field key={field} label={{label:'Eyebrow',title:'Heading',body:'Description / quotation',cta:'Button text',href:'Button destination'}[field]} multiline={field === 'body'} value={section[field]} onChange={value => update(active, field, value)} />)}
        {selectProducts && <div><h3>Products, in display order</h3><p className="body-s">Select products in the order you want them to appear. Leave empty for automatic selection.</p>{section.productIds?.map((id, i) => <div key={id} className="hp-actions"><span>{i + 1}. {catalog.products.find(p => p.id === id)?.name || `${id} (unavailable)`}</span><button onClick={() => update(active, 'productIds', section.productIds.filter(p => p !== id))}>Remove</button></div>)}<select aria-label="Add product" value="" onChange={e => { if (e.target.value) update(active, 'productIds', [...section.productIds, e.target.value]); }}><option value="">Add a garment…</option>{catalog.products.filter(p => !section.productIds?.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>}
        {active === 'film' && <label className="hp-field">Released episode<select value={section.episodeId || ''} onChange={e => update(active, 'episodeId', e.target.value)}><option value="">First released episode</option>{catalog.episodes.map(ep => <option key={ep.id} value={ep.id}>{ep.title}</option>)}</select></label>}
        {active === 'craft' && <Field label="Craft facts (one per line)" multiline value={section.facts.join('\n')} onChange={value => update(active, 'facts', value.split('\n'))} />}
        {!['castes', 'archive', 'manifesto'].includes(active) && <><h3>Media</h3><p className="body-s">Upload a file, paste an HTTPS URL, or use an existing R2 object key. Clearing an asset restores the catalog fallback where available.</p>{media('image', 'Desktop image')}{media('mobileImage', 'Mobile image')}<Field label="Image description (alt text)" value={section.alt} onChange={value => update(active, 'alt', value)} />{['focalX','focalY'].map(field => <label key={field}>{field === 'focalX' ? 'Horizontal crop' : 'Vertical crop'}: {section[field]}%<input type="range" min="0" max="100" value={section[field]} onChange={e => update(active, field, Number(e.target.value))} /></label>)}{['hero','film'].includes(active) && <>{media('video', 'Video', true)}{active === 'hero' && media('mobileVideo', 'Mobile video', true)}{media('poster', 'Video poster image')}</>}</>}
        {active === 'castes' && catalog.castes.map(c => {
          const card = section.cards.find(item => item.id === c.id) || { id: c.id };
          const change = (field, value) => update(active, 'cards', [...section.cards.filter(item => item.id !== c.id), { ...card, [field]: value }]);
          return <details key={c.id}><summary>{c.name}</summary><Field label="Display name" value={card.title} onChange={value => change('title', value)} /><Field label="Short description" value={card.body} onChange={value => change('body', value)} /><MediaField sectionId={c.id} label="Caste image" value={card.image} onChange={value => change('image', value)} setUploading={setUploading} /><Field label="Image description" value={card.alt} onChange={value => change('alt', value)} /></details>;
        })}
      </fieldset>
    </div>}
  </div>;
}
