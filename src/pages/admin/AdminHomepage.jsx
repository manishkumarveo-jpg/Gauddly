import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FIELD_NAMES, SECTION_INFO, diffHome, freshHome, moveSection, normalizeHome, sectionWarnings, tabForField } from '../../lib/homepage';
import { loadHomeCatalog } from '../../lib/homepage-api';
import { useConfirm } from './useConfirm';
import { useToast } from './useToast';
import { UndoIcon } from './Icons';
import HomepageSectionList from './HomepageSectionList';
import HomepageSectionForm from './HomepageSectionForm';
import PreviewFrame from './PreviewFrame';
import HomepagePublishDialog from './HomepagePublishDialog';
import './homepage-editor.css';

const PREVIEW_PATH = '/admin/homepage/preview';
const CONFLICT_MESSAGE = 'Another editor saved changes. Reload before saving.';
const HISTORY_LIMIT = 50;
const TYPING_GROUP_MS = 1200; // keystrokes in one field within this window undo together
const ORIGIN = window.location.origin;
const savedTime = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const countChanges = groups => groups.reduce((n, group) => n + group.changes.length, 0);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const focusLabel = focus => (focus.field ? FIELD_NAMES[focus.field] : SECTION_INFO[focus.section]?.name) || '';
const post = (target, message) => { if (target && !target.closed) target.postMessage(message, ORIGIN); };

export default function AdminHomepage() {
  const [draft, setDraft] = useState(freshHome);
  const [saved, setSaved] = useState(null);
  const [published, setPublished] = useState(null);
  const [revision, setRevision] = useState(0);
  const [savedAt, setSavedAt] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [catalog, setCatalog] = useState({ products: [], castes: [], episodes: [], loaded: false });
  const [active, setActive] = useState('hero');
  const [tab, setTab] = useState(SECTION_INFO.hero.tabs[0]);
  const [focus, setFocus] = useState({ section: 'hero', field: null, scroll: false });
  const [focusRequest, setFocusRequest] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [view, setView] = useState('edit'); // which pane narrow screens show
  const [publishOpen, setPublishOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const draftRef = useRef(draft);
  const lastEdit = useRef({ key: '', at: 0 });
  const frameRef = useRef(null);
  const popupRef = useRef(null);
  const latest = useRef(null);
  const [confirmDialog, requestConfirm] = useConfirm();
  const [toast, showToast] = useToast();

  const replaceDraft = content => { draftRef.current = content; setDraft(content); };
  const load = useCallback(async () => {
    setBusy(true); setError(''); setConflict(false); setReady(false);
    try {
      const { data, error: loadError } = await supabase.from('homepage_content').select('draft,published,revision,updated_at').eq('id', 'homepage').single();
      if (loadError) throw loadError;
      const content = normalizeHome(data.draft);
      draftRef.current = content;
      setDraft(content); setSaved(content); setHistory([]);
      setPublished(data.published ? normalizeHome(data.published) : null);
      setRevision(data.revision); setSavedAt(data.updated_at); setReady(true);
    } catch (err) { setError(`Homepage editing is not available: ${err.message}. If this is a new installation, apply the homepage SQL migration first.`); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => {
    load();
    loadHomeCatalog().then(result => {
      setCatalog({ ...result, loaded: true });
      if (result.failed) setError('Some catalog choices could not load. Reload this page to retry.');
    }).catch(() => setError('The catalog could not load. Reload this page to retry.'));
  }, [load]);

  const dirty = saved !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => {
    if (!dirty || !ready) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, ready]);

  const warnings = useMemo(() => Object.fromEntries(draft.sections.map(s => [s.id, sectionWarnings(s, catalog)])), [draft, catalog]);
  const allWarnings = draft.sections.flatMap(s => warnings[s.id].map(w => ({ ...w, section: s.id, sectionName: SECTION_INFO[s.id].name })));
  const unsavedCount = useMemo(() => (saved ? countChanges(diffHome(saved, draft)) : 0), [saved, draft]);
  const notLiveCount = useMemo(() => (saved ? countChanges(diffHome(published, saved)) : 0), [published, saved]);
  const publishChanges = useMemo(() => (publishOpen ? diffHome(published, normalizeHome(draft)) : []), [publishOpen, published, draft]);

  // Every edit goes through here, so undo can step back. Typing in one field is grouped into one step.
  const change = (producer, key = '') => {
    const current = draftRef.current;
    const next = producer(current);
    if (next === current) return;
    const now = Date.now();
    if (!key || key !== lastEdit.current.key || now - lastEdit.current.at > TYPING_GROUP_MS) setHistory(h => [...h.slice(1 - HISTORY_LIMIT), current]);
    lastEdit.current = { key, at: now };
    setMessage('');
    replaceDraft(next);
  };
  const patchSection = (id, patch, key) => change(d => ({ ...d, sections: d.sections.map(s => (s.id === id ? { ...s, ...patch } : s)) }), key && `${id}.${key}`);
  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(history.slice(0, -1));
    lastEdit.current = { key: '', at: 0 };
    replaceDraft(previous);
  };

  const selectSection = useCallback((id, { field = null, scroll = 'section' } = {}) => {
    setActive(id);
    setTab(field ? tabForField(id, field) : SECTION_INFO[id].tabs[0]);
    setFocus({ section: id, field, scroll });
    setFocusRequest(field ? { section: id, field, nonce: Date.now() } : null);
  }, []);
  const focusField = field => setFocus(current => (current.section === active && current.field === field ? current : { section: active, field, scroll: 'field' }));

  // Preview windows: the side-by-side frame and an optional full-size tab.
  const previewWindows = () => [frameRef.current?.contentWindow, popupRef.current];
  useEffect(() => { latest.current = { draft, catalog, focus }; });
  useEffect(() => {
    const timer = setTimeout(() => previewWindows().forEach(w => post(w, { type: 'hp-draft', content: draft, catalog })), 120);
    return () => clearTimeout(timer);
  }, [draft, catalog]);
  useEffect(() => { previewWindows().forEach(w => post(w, { type: 'hp-focus', ...focus, label: focusLabel(focus) })); }, [focus]);
  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== ORIGIN || !latest.current) return;
      if (event.source !== frameRef.current?.contentWindow && event.source !== popupRef.current) return;
      const data = event.data || {};
      if (data.type === 'hp-ready') {
        const { draft: content, catalog: items, focus: current } = latest.current;
        post(event.source, { type: 'hp-draft', content, catalog: items });
        post(event.source, { type: 'hp-focus', ...current, scroll: current.scroll && 'section', label: focusLabel(current) });
      }
      if (data.type === 'hp-select' && SECTION_INFO[data.section]) {
        selectSection(data.section, { field: data.field && FIELD_NAMES[data.field] ? data.field : null, scroll: false });
        setView('edit');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [selectSection]);
  const openPreviewTab = () => {
    popupRef.current = window.open(PREVIEW_PATH, 'gauddly-homepage-preview');
    if (!popupRef.current) showToast('Your browser blocked the new tab. Allow pop-ups for this site and try again.', { danger: true });
  };

  const save = async (publish, expectedRevision = revision) => {
    if (busy || uploads || !ready) return false;
    const blocking = allWarnings.find(w => w.blocking);
    if (blocking) {
      setError(`${blocking.sectionName}: ${blocking.message}.`);
      selectSection(blocking.section, { field: blocking.field, scroll: 'field' });
      return false;
    }
    setBusy(true); setError(''); setMessage(''); setConflict(false);
    try {
      const content = normalizeHome(draftRef.current);
      const { data, error: saveError } = await supabase.rpc('save_homepage', { content, expected_revision: expectedRevision, publish });
      if (saveError) throw saveError;
      setRevision(data); setSaved(content); setSavedAt(new Date().toISOString());
      replaceDraft(content);
      if (publish) { setPublished(content); showToast('Published. The homepage is now live.'); }
      else setMessage('Draft saved. Visitors still see the published homepage.');
      return true;
    } catch (err) {
      if (err.message === CONFLICT_MESSAGE) setConflict(true); else setError(err.message);
      return false;
    } finally { setBusy(false); }
  };
  const publish = async () => { await save(true); setPublishOpen(false); };
  const discard = async () => {
    if (await requestConfirm('Discard your unsaved changes and go back to the last saved draft?')) load();
  };
  const loadTheirs = async () => {
    if (await requestConfirm('Load the version the other editor saved? Your unsaved changes here will be lost.')) load();
  };
  const keepMine = async () => {
    if (!(await requestConfirm('Replace the other editor’s saved draft with your version?'))) return;
    const { data, error: loadError } = await supabase.from('homepage_content').select('revision').eq('id', 'homepage').single();
    if (loadError) { setError(loadError.message); return; }
    await save(false, data.revision);
  };

  const status = !ready ? { tone: 'muted', text: busy ? 'Loading…' : 'Not available' }
    : dirty ? { tone: 'warn', text: unsavedCount ? `${plural(unsavedCount, 'unsaved change')}` : 'Unsaved changes' }
      : notLiveCount ? { tone: 'info', text: `Draft saved · ${plural(notLiveCount, 'change')} not live yet` }
        : { tone: 'ok', text: 'Live · matches the published homepage' };
  const section = draft.sections.find(s => s.id === active);
  const sectionIndex = draft.sections.indexOf(section);
  const locked = busy || uploads > 0;

  return <div className="hp-editor">
    <header className="hp-topbar">
      <div className="hp-title"><span className="hp-eyebrow">Content studio</span><h1>Homepage</h1></div>
      <p className={`hp-status is-${status.tone}`} role="status">
        <span className="hp-status-dot" aria-hidden="true" />{status.text}
        {savedAt && <span className="hp-status-time"> · Saved {savedTime.format(new Date(savedAt))}</span>}
      </p>
      <div className="hp-actions">
        <button type="button" className="hp-btn hp-icon-btn" onClick={undo} disabled={!history.length || locked} aria-label="Undo last change" title="Undo last change"><UndoIcon aria-hidden="true" width={18} height={18} /></button>
        {dirty && <button type="button" className="hp-btn hp-btn-quiet" onClick={discard} disabled={locked}>Discard changes</button>}
        <button type="button" className="hp-btn" onClick={() => save(false)} disabled={!ready || locked || !dirty}>Save draft</button>
        <button type="button" className="hp-btn hp-btn-primary" onClick={() => setPublishOpen(true)} disabled={!ready || locked}>Review &amp; publish →</button>
      </div>
    </header>

    {conflict && <div className="hp-banner is-danger" role="alert">
      <p><strong>Someone else saved the homepage while you were editing.</strong> Your changes are still here, but saving now would overwrite theirs.</p>
      <div className="hp-banner-actions">
        <button type="button" className="hp-btn" onClick={loadTheirs} disabled={busy}>Load their version</button>
        <button type="button" className="hp-btn" onClick={keepMine} disabled={busy}>Replace theirs with mine</button>
      </div>
    </div>}
    {error && <p className="hp-banner is-danger" role="alert">{error}</p>}
    {message && <p className="hp-banner" role="status">{message}</p>}
    {uploads > 0 && <p className="hp-banner" role="status">Uploading… saving is paused until the upload finishes.</p>}

    <div className="hp-viewtabs" role="tablist" aria-label="Editor view">
      <button type="button" role="tab" aria-selected={view === 'edit'} onClick={() => setView('edit')}>Edit</button>
      <button type="button" role="tab" aria-selected={view === 'preview'} onClick={() => setView('preview')}>Preview</button>
    </div>
    <div className="hp-body" data-view={view}>
      <HomepageSectionList
        sections={draft.sections}
        active={active}
        warnings={warnings}
        disabled={busy}
        onSelect={id => selectSection(id)}
        onMove={(from, to) => change(d => moveSection(d, from, to))}
        onToggle={id => patchSection(id, { enabled: draft.sections.find(s => s.id === id).enabled === false })}
      />
      {section && <HomepageSectionForm
        key={section.id}
        section={section}
        index={sectionIndex}
        total={draft.sections.length}
        catalog={catalog}
        warnings={warnings[section.id]}
        tab={tab}
        onTabChange={setTab}
        onPatch={(patch, key) => patchSection(section.id, patch, key)}
        onFocusField={focusField}
        onFixField={field => selectSection(section.id, { field, scroll: 'field' })}
        focusRequest={focusRequest}
        setUploading={uploading => setUploads(n => n + (uploading ? 1 : -1))}
        disabled={busy || !ready}
      />}
      <PreviewFrame frameRef={frameRef} src={PREVIEW_PATH} title="Homepage preview" device={device} onDeviceChange={setDevice} onOpenTab={openPreviewTab} />
    </div>

    <HomepagePublishDialog
      open={publishOpen}
      changes={publishChanges}
      warnings={allWarnings}
      busy={busy}
      onClose={() => setPublishOpen(false)}
      onPublish={publish}
      onOpenPreview={openPreviewTab}
      onFix={(id, field) => { setPublishOpen(false); selectSection(id, { field, scroll: 'field' }); setView('edit'); }}
    />
    {confirmDialog}
    {toast}
  </div>;
}
