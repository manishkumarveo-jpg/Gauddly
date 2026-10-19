import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../../lib/supabase';
import { SECTION_INFO, assetKey, coverWindow, suggestedLength, tabForField } from '../../lib/homepage';
import { PAGE_META } from '../../lib/navigation';
import { uploadToR2, safeFileName } from './uploadToR2';
import HomepageProductPicker from './HomepageProductPicker';

const fieldId = (sectionId, field) => `hp-${sectionId}-${field}`;

const TAB_NAMES = { words: 'Words', media: 'Images & film', garments: 'Garments', rooms: 'Caste rooms', film: 'Film', button: 'Button' };
const WORD_ORDER = { quote: ['label', 'body', 'title'] };
const WORDS = {
  label: { label: 'Small line above the headline', hint: 'Optional. Shown in small capitals.' },
  title: { label: 'Headline' },
  body: { label: 'Supporting text', multiline: true },
};
const WORD_OVERRIDES = {
  hero: { title: { label: 'Headline', hint: 'Shown in capitals across the first screen.' }, body: { label: 'Line under the headline', hint: 'Shown in italics.', multiline: true } },
  manifesto: { title: { label: 'Heading', hint: 'Shown in small, spaced capitals.' }, body: { label: 'Statement', multiline: true } },
  featured: { title: { label: 'Heading when no garments are available', hint: 'Normally each garment’s own name is shown instead.' }, body: { label: 'Text for garments without a description', hint: 'Normally each garment shows its own description.', multiline: true } },
  film: { body: { label: 'Text when no episode is available', hint: 'Normally the episode’s title is shown.', multiline: true } },
  quote: { body: { label: 'Quotation', hint: 'Shown large.', multiline: true }, title: { label: 'Line under the quotation', hint: 'For example, where it comes from.' } },
};
const STILLS = {
  hero: { label: 'Still image', hint: 'Shown while the film loads, and on phones, where the film only plays when tapped.' },
  film: { label: 'Still image', hint: 'Optional. Replaces the episode’s own still.' },
  featured: { label: 'Image', hint: 'Optional. Leave empty to show each garment’s own photo.' },
  craft: { label: 'Workshop image', hint: 'Without one, a catalog photo is used.' },
  quote: { label: 'Background image', hint: 'Optional.' },
  waitlist: { label: 'Background image', hint: 'Shown faintly behind the sign-up form.' },
};
// Visible box on a 390 × 844 phone, from the homepage's own phone styles (hero 90svh, featured image 65svh).
const PHONE_BOX = { hero: { width: 390, height: 760 }, featured: { width: 390, height: 549 } };
const HIDDEN_PAGES = ['/', '/home', '/login', '/forgot-password', '/reset-password', '/account', '/checkout'];
const PAGE_LINKS = Object.entries(PAGE_META).filter(([path]) => !HIDDEN_PAGES.includes(path)).map(([path, [name]]) => [path, name]);
const MEDIA_TYPES = {
  image: { types: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], maxMb: 15, note: 'JPG, PNG, WebP or AVIF, up to 15 MB' },
  video: { types: ['video/mp4', 'video/webm'], maxMb: 100, note: 'MP4 or WebM, up to 100 MB' },
};
const clamp = value => Math.max(0, Math.min(100, Math.round(value)));

function TextField({ id, label, hint, value, onChange, onFocus, limit, multiline = false, placeholder }) {
  const length = (value || '').length;
  const over = Boolean(limit) && length > limit;
  const describedBy = [hint && `${id}-hint`, limit && `${id}-count`].filter(Boolean).join(' ') || undefined;
  const Input = multiline ? 'textarea' : 'input';
  return <div className="hp-field">
    <div className="hp-field-head">
      <label htmlFor={id}>{label}</label>
      {limit ? <span id={`${id}-count`} className={over ? 'hp-count is-over' : 'hp-count'}>{length} / {limit}</span> : null}
    </div>
    <Input id={id} rows={multiline ? 3 : undefined} value={value || ''} placeholder={placeholder} onChange={event => onChange(event.target.value)} onFocus={onFocus} aria-describedby={describedBy} />
    {over && <span className="hp-hint is-warning">Longer than suggested. Check how it wraps in the preview.</span>}
    {hint && <span id={`${id}-hint`} className="hp-hint">{hint}</span>}
  </div>;
}

function LinkField({ id, value, onChange, onFocus, castes, hint }) {
  const options = [...PAGE_LINKS, ...castes.map(c => [`/the-${c.id}`, `${c.name} (caste room)`])];
  const known = options.some(([path]) => path === value);
  const [custom, setCustom] = useState(!known && Boolean(value));
  const showCustom = custom || (!known && Boolean(value));
  return <div className="hp-field">
    <label htmlFor={id}>Button opens</label>
    <select id={id} value={showCustom ? '__custom' : value || ''} onFocus={onFocus} onChange={event => {
      if (event.target.value === '__custom') { setCustom(true); return; }
      setCustom(false);
      onChange(event.target.value);
    }}>
      {!value && <option value="">Choose a page</option>}
      {options.map(([path, name]) => <option key={path} value={path}>{name}</option>)}
      <option value="__custom">Another page…</option>
    </select>
    {showCustom && <input id={`${id}-custom`} aria-label="Page address" value={value || ''} placeholder="/page-address" onFocus={onFocus} onChange={event => onChange(event.target.value.trim())} />}
    <span className="hp-hint">{showCustom ? 'A page on this site, starting with /, for example /store.' : `Address: ${value}`}{hint ? ` ${hint}` : ''}</span>
  </div>;
}

function FocalPicker({ src, focalX, focalY, onChange, phoneBox }) {
  const [natural, setNatural] = useState(null);
  const area = phoneBox && natural ? coverWindow(natural.width, natural.height, phoneBox.width, phoneBox.height, focalX, focalY) : null;
  const pick = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    onChange(clamp(((event.clientX - rect.left) / rect.width) * 100), clamp(((event.clientY - rect.top) / rect.height) * 100));
  };
  const nudge = event => {
    const step = event.shiftKey ? 10 : 1;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    onChange(clamp(focalX + delta[0]), clamp(focalY + delta[1]));
  };
  return <div className="hp-focal">
    <div className="hp-focal-image" onClick={pick}>
      <img src={src} alt="" onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
      {area && area.w * area.h < 10000 && <span className="hp-focal-window" aria-hidden="true" style={{ left: `${area.x}%`, top: `${area.y}%`, width: `${area.w}%`, height: `${area.h}%` }} />}
      <button type="button" className="hp-focal-point" style={{ left: `${focalX}%`, top: `${focalY}%` }} onClick={event => event.stopPropagation()} onKeyDown={nudge}
        aria-label={`Focus point, ${focalX}% across and ${focalY}% down. Use the arrow keys to move it.`} />
    </div>
    <span className="hp-hint">Click the image to choose what stays in view when it is cropped.{area ? ' The outlined area is what a phone shows.' : ''}</span>
  </div>;
}

function MediaField({ id, label, hint, value, onChange, onFocus, video = false, folder, setUploading, preview }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const kind = video ? MEDIA_TYPES.video : MEDIA_TYPES.image;
  const upload = async file => {
    if (!file) return;
    if (!kind.types.includes(file.type) || file.size > kind.maxMb * 1024 * 1024) { setError(`Choose a ${kind.note} file.`); return; }
    setError(''); setProgress(0); setUploading(true);
    try {
      const key = `homepage/${folder}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      await uploadToR2(key, file, setProgress);
      onChange(key);
    } catch (err) { setError(err.message); }
    finally { setProgress(null); setUploading(false); }
  };
  const chooseFile = <input type="file" className="sr-only" accept={kind.types.join(',')} disabled={progress !== null} aria-label={`${value ? 'Replace' : 'Upload'} ${label.toLowerCase()}`}
    onChange={event => { upload(event.target.files?.[0]); event.target.value = ''; }} />;
  const src = assetKey(value) ? mediaUrl(assetKey(value)) : '';
  const fileName = value ? decodeURIComponent(value.split('/').pop()).replace(/^[0-9a-f]{8}-[0-9a-f-]{27}-/i, '') : '';
  return <div className="hp-media" id={id} tabIndex={-1} onFocus={onFocus}>
    <span className="hp-media-label">{label}</span>
    {value ? <div className="hp-media-current">
      {preview || (src && (video ? <video src={src} preload="metadata" muted controls /> : <img src={src} alt="" />))}
      <div className="hp-media-meta">
        <span className="hp-media-name" title={value}>{fileName}</span>
        <div className="hp-media-actions">
          <label className="hp-btn">Replace{chooseFile}</label>
          <button type="button" className="hp-btn" onClick={() => onChange('')}>Remove</button>
        </div>
      </div>
    </div> : <label className={dragging ? 'hp-drop is-dragging' : 'hp-drop'}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); upload(event.dataTransfer.files?.[0]); }}>
      <span>Drop {video ? 'a film' : 'an image'} here, or <u>choose a file</u></span>
      <span className="hp-hint">{kind.note}</span>
      {chooseFile}
    </label>}
    {progress !== null && <progress aria-label={`${label} upload`} value={progress} max="100" />}
    {error && <p className="hp-error" role="alert">{error}</p>}
    {hint && <span className="hp-hint">{hint}</span>}
    <details className="hp-advanced">
      <summary>Use a web address or storage key instead</summary>
      <input id={`${id}-address`} aria-label={`${label} address`} value={value || ''} placeholder="https://… or homepage/…" onChange={event => onChange(event.target.value.trim())} />
    </details>
  </div>;
}

export default function HomepageSectionForm({ section, index, total, catalog, warnings, tab, onTabChange, onPatch, onFocusField, onFixField, focusRequest, setUploading, disabled }) {
  const info = SECTION_INFO[section.id];
  const id = field => fieldId(section.id, field);
  const set = (field, value) => onPatch({ [field]: value }, field);
  const focusOn = field => () => onFocusField(field);
  const tabWarnings = name => warnings.filter(w => tabForField(section.id, w.field) === name).length;

  // Runs once per request (a click in the preview or a "worth checking" link), after the right tab has rendered.
  useEffect(() => {
    if (!focusRequest) return;
    const element = document.getElementById(fieldId(focusRequest.section, focusRequest.field));
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusRequest]);

  const text = (field, overrides = {}) => {
    const config = { ...WORDS[field], ...WORD_OVERRIDES[section.id]?.[field], ...overrides };
    return <TextField key={field} id={id(field)} label={config.label} hint={config.hint} multiline={config.multiline} limit={suggestedLength(section.id, field)} value={section[field]} onChange={value => set(field, value)} onFocus={focusOn(field)} />;
  };
  const media = (field, label, hint, options = {}) => <MediaField key={field} id={id(field)} label={label} hint={hint} value={section[field]} onChange={value => set(field, value)}
    onFocus={focusOn(field)} folder={section.id} setUploading={setUploading} {...options} />;
  const stillField = ['hero', 'film'].includes(section.id) && !section.poster && section.image ? 'image' : ['hero', 'film'].includes(section.id) ? 'poster' : 'image';
  const stillSrc = assetKey(section[stillField]) ? mediaUrl(assetKey(section[stillField])) : '';
  const still = () => media(stillField, STILLS[section.id].label, STILLS[section.id].hint, {
    preview: stillSrc && <FocalPicker src={stillSrc} focalX={section.focalX} focalY={section.focalY} phoneBox={section.mobileImage ? null : PHONE_BOX[section.id]}
      onChange={(focalX, focalY) => onPatch({ focalX, focalY }, 'focal')} />,
  });
  const imageExtras = () => <>
    {media('mobileImage', 'Phone image', 'Optional. A different picture or crop for phones.')}
    {(section.image || section.poster || section.mobileImage) && <TextField id={id('alt')} label="Describe the image for screen readers" hint="One short sentence about what the picture shows." value={section.alt} onChange={value => set('alt', value)} onFocus={focusOn('alt')} />}
    {stillField === 'poster' && section.image && media('image', 'Fallback image', 'Used only when there is no still image.')}
  </>;

  const panels = {
    words: () => <>
      {(WORD_ORDER[section.id] || ['label', 'title', 'body']).map(field => text(field))}
      {section.id === 'craft' && <TextField id={id('facts')} label="Craft facts, one per line" hint="Shown as a numbered list." multiline value={section.facts.join('\n')} onChange={value => set('facts', value.split('\n'))} onFocus={focusOn('facts')} />}
    </>,
    media: () => <>
      {section.id === 'hero' && media('video', 'Film', 'Plays silently in a loop on larger screens.', { video: true })}
      {still()}
      {imageExtras()}
      {section.id === 'hero' && media('mobileVideo', 'Phone film', 'Optional. Played on phones when a visitor taps Play film.', { video: true })}
    </>,
    film: () => <>
      <div className="hp-field">
        <label htmlFor={id('episodeId')}>Episode</label>
        <select id={id('episodeId')} value={section.episodeId || ''} onFocus={focusOn('episodeId')} onChange={event => set('episodeId', event.target.value)}>
          <option value="">Latest released episode</option>
          {(catalog.episodes || []).map(episode => <option key={episode.id} value={episode.id}>{episode.title}</option>)}
        </select>
        <span className="hp-hint">Only released episodes are listed. <Link to="/admin/episodes">Manage episodes</Link></span>
      </div>
      {media('video', 'Film', 'Optional. Replaces the episode’s own film.', { video: true })}
      {still()}
      {imageExtras()}
    </>,
    garments: () => <HomepageProductPicker key={section.id} id={id('productIds')} value={section.productIds || []} onChange={value => set('productIds', value)} onFocus={focusOn('productIds')} catalog={catalog} archive={section.id === 'archive'} />,
    rooms: () => <div className="hp-rooms" id={id('cards')} tabIndex={-1} onFocus={focusOn('cards')}>
      <p className="hp-hint">Each caste room gets a card. Leave a field empty to use the caste’s own name or image. <Link to="/admin/castes">Manage castes</Link></p>
      {!catalog.loaded ? <p className="hp-hint" role="status">Loading castes…</p> : !catalog.castes?.length ? <p className="hp-hint">No castes found.</p> : catalog.castes.map(caste => {
        const card = section.cards.find(item => item.id === caste.id) || { id: caste.id };
        const change = (field, value) => set('cards', section.cards.some(item => item.id === caste.id)
          ? section.cards.map(item => (item.id === caste.id ? { ...item, [field]: value } : item))
          : [...section.cards, { ...card, [field]: value }]);
        const custom = ['title', 'body', 'image'].some(field => card[field]);
        return <details key={caste.id} className="hp-room">
          <summary>{caste.name}{custom && <span className="hp-hint"> · customised</span>}</summary>
          <TextField id={`${id('cards')}-${caste.id}-title`} label="Card title" placeholder={caste.name} value={card.title} onChange={value => change('title', value)} />
          <TextField id={`${id('cards')}-${caste.id}-body`} label="Short description" multiline value={card.body} onChange={value => change('body', value)} />
          <MediaField id={`${id('cards')}-${caste.id}-image`} label="Card image" hint="Leave empty to use the caste’s own image." value={card.image} onChange={value => change('image', value)} folder={caste.id} setUploading={setUploading} />
          {card.image && <TextField id={`${id('cards')}-${caste.id}-alt`} label="Describe the image for screen readers" value={card.alt} onChange={value => change('alt', value)} />}
        </details>;
      })}
    </div>,
    button: () => <>
      {text('cta', {
        label: section.id === 'waitlist' ? 'Sign-up button text' : 'Button text',
        hint: section.id === 'featured' ? 'The button opens the garment being shown.' : undefined,
      })}
      {!['featured', 'waitlist'].includes(section.id) && <LinkField key={section.id} id={id('href')} value={section.href} onChange={value => set('href', value)} onFocus={focusOn('href')} castes={catalog.castes || []}
        hint={section.id === 'film' ? 'Used only when there is no film to play.' : ''} />}
    </>,
  };
  const activeTab = info.tabs.includes(tab) ? tab : info.tabs[0];

  return <section className="hp-form" aria-labelledby="hp-form-title">
    <header className="hp-form-head">
      <span className="hp-eyebrow">Section {index + 1} of {total}</span>
      <div className="hp-form-title-row">
        <h2 id="hp-form-title">{info.name}</h2>
        <label className="hp-switch">
          <input type="checkbox" role="switch" checked={section.enabled !== false} disabled={disabled} onChange={event => onPatch({ enabled: event.target.checked })} />
          <span>{section.enabled === false ? 'Hidden' : 'Shown'}</span>
        </label>
      </div>
      <p className="hp-hint">{info.about}</p>
      {warnings.length > 0 && <ul className="hp-warnings" aria-label="Worth checking">
        {warnings.map((warning, i) => <li key={i}><button type="button" onClick={() => onFixField(warning.field)}>{warning.message} <span aria-hidden="true">→</span></button></li>)}
      </ul>}
    </header>
    <div className="hp-tabs" role="tablist" aria-label={`${info.name} settings`}>
      {info.tabs.map(name => <button key={name} type="button" role="tab" id={`hp-tab-${name}`} aria-controls="hp-tab-panel" aria-selected={activeTab === name}
        onClick={() => onTabChange(name)}>{TAB_NAMES[name]}{tabWarnings(name) > 0 && <span className="hp-tab-dot" aria-label={`${tabWarnings(name)} to check`} />}</button>)}
    </div>
    <fieldset className="hp-panel" id="hp-tab-panel" role="tabpanel" aria-labelledby={`hp-tab-${activeTab}`} disabled={disabled}>
      {panels[activeTab]()}
    </fieldset>
  </section>;
}
