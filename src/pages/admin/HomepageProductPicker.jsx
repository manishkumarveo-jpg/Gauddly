import { useState } from 'react';
import { mediaUrl } from '../../lib/supabase';
import { chooseProducts, moveItem } from '../../lib/homepage';
import { GripIcon } from './Icons';

const price = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
// A missing catalog photo shows the empty frame instead of the browser's broken-image icon.
const hideBroken = event => { event.currentTarget.style.visibility = 'hidden'; };
const photo = product => mediaUrl([...(product.product_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.r2_key);

// Chooses which garments a featured or archive section shows. An empty list means "choose automatically".
export default function HomepageProductPicker({ id, value, onChange, onFocus, catalog, archive = false }) {
  const { products = [], castes = [], loaded } = catalog;
  const [manualChosen, setManual] = useState(value.length > 0);
  const manual = manualChosen || value.length > 0;
  const [query, setQuery] = useState('');
  const [caste, setCaste] = useState(archive ? 'old-world' : 'all');
  const [dragFrom, setDragFrom] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  const casteName = casteId => (casteId === 'old-world' ? 'Old World archive' : castes.find(c => c.id === casteId)?.name || casteId);
  const casteIds = [...new Set(products.map(p => p.caste_id))];
  const term = query.trim().toLowerCase();
  const library = products.filter(p => (caste === 'all' || p.caste_id === caste) && (!term || p.name.toLowerCase().includes(term)));
  const automatic = chooseProducts(products, [], archive);

  const move = (from, to) => {
    const next = moveItem(value, from, to);
    if (next === value) return;
    onChange(next);
    const name = products.find(p => p.id === value[from])?.name || value[from];
    setAnnouncement(`${name} moved to position ${to + 1} of ${value.length}.`);
  };
  const toggle = productId => onChange(value.includes(productId) ? value.filter(v => v !== productId) : [...value, productId]);
  const chooseMode = nextManual => { setManual(nextManual); if (!nextManual && value.length) onChange([]); };

  return <div className="hp-picker" id={id} tabIndex={-1} onFocus={onFocus}>
    <fieldset className="hp-choice">
      <legend className="sr-only">How garments are chosen</legend>
      <label className={!manual ? 'is-selected' : ''}>
        <input type="radio" name={`${id}-mode`} checked={!manual} onChange={() => chooseMode(false)} />
        <span><strong>Choose automatically</strong>
          <span className="hp-hint">{archive ? 'The first 4 pieces from the Old World archive.' : 'The first 3 garments from the current castes, in store order.'}{loaded && automatic.length ? ` Now: ${automatic.map(p => p.name).join(', ')}.` : ''}</span></span>
      </label>
      <label className={manual ? 'is-selected' : ''}>
        <input type="radio" name={`${id}-mode`} checked={manual} onChange={() => chooseMode(true)} />
        <span><strong>I will choose them</strong><span className="hp-hint">Pick garments below and drag them into order.</span></span>
      </label>
    </fieldset>

    {manual && <>
      <div className="hp-subhead"><span className="hp-eyebrow">Shown on the homepage, in this order</span><span className="hp-hint">{value.length} chosen</span></div>
      {value.length === 0 && <p className="hp-hint is-warning">Add at least one garment. Until then the section chooses automatically.</p>}
      <ol className="hp-chosen">
        {value.map((productId, index) => {
          const product = products.find(p => p.id === productId);
          return <li key={productId}
            draggable
            className={dragFrom === index ? 'is-dragging' : ''}
            onDragStart={event => { setDragFrom(index); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', productId); }}
            onDragOver={event => { if (dragFrom !== null) event.preventDefault(); }}
            onDrop={event => { event.preventDefault(); if (dragFrom !== null) move(dragFrom, index); setDragFrom(null); }}
            onDragEnd={() => setDragFrom(null)}
          >
            <GripIcon className="hp-grip" aria-hidden="true" />
            <span className="hp-chosen-pos">{index + 1}</span>
            {product && photo(product) ? <img src={photo(product)} alt="" loading="lazy" onError={hideBroken} /> : <span className="hp-thumb-empty" aria-hidden="true" />}
            <span className="hp-chosen-text">
              <span>{product?.name || productId}</span>
              <span className={product || !loaded ? 'hp-hint' : 'hp-hint is-warning'}>{product ? `${casteName(product.caste_id)} · ${price(product.price)}` : loaded ? 'No longer published. Visitors will not see it.' : 'Loading…'}</span>
            </span>
            <span className="hp-chosen-actions">
              <button type="button" className="hp-btn hp-icon-btn" aria-label={`Move ${product?.name || productId} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>↑</button>
              <button type="button" className="hp-btn hp-icon-btn" aria-label={`Move ${product?.name || productId} down`} disabled={index === value.length - 1} onClick={() => move(index, index + 1)}>↓</button>
              <button type="button" className="hp-btn" onClick={() => toggle(productId)}>Remove</button>
            </span>
          </li>;
        })}
      </ol>

      <div className="hp-subhead"><span className="hp-eyebrow">Garment library</span><span className="hp-hint">Published garments only</span></div>
      <div className="hp-library-tools">
        <label className="sr-only" htmlFor={`${id}-search`}>Search garments by name</label>
        <input id={`${id}-search`} type="search" placeholder="Search by name" value={query} onChange={event => setQuery(event.target.value)} />
        <div className="hp-chips" role="group" aria-label="Filter by caste">
          {['all', ...casteIds].map(cid => <button key={cid} type="button" aria-pressed={caste === cid} onClick={() => setCaste(cid)}>{cid === 'all' ? 'All' : casteName(cid)}</button>)}
        </div>
      </div>
      {!loaded ? <p className="hp-hint" role="status">Loading garments…</p> : library.length === 0 ? <p className="hp-hint">No published garments match.</p> : <ul className="hp-library">
        {library.map(product => {
          const position = value.indexOf(product.id);
          return <li key={product.id} className={position >= 0 ? 'is-chosen' : ''}>
            <span className="hp-library-photo">{photo(product) ? <img src={photo(product)} alt="" loading="lazy" onError={hideBroken} /> : null}{position >= 0 && <span className="hp-badge">#{position + 1} on homepage</span>}</span>
            <span className="hp-library-name">{product.name}</span>
            <span className="hp-hint">{casteName(product.caste_id)} · {price(product.price)}</span>
            <button type="button" className="hp-btn" aria-pressed={position >= 0} onClick={() => toggle(product.id)}>{position >= 0 ? 'Remove' : '+ Add'}<span className="sr-only"> {product.name}</span></button>
          </li>;
        })}
      </ul>}
    </>}
    <p className="sr-only" role="status">{announcement}</p>
  </div>;
}
