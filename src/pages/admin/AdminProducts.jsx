import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase, mediaUrl } from '../../lib/supabase';
import { canPublish, productIssues, publishChecks, sortSizes } from '../../lib/products';
import { deleteProduct } from './productAdmin';
import Pagination from './Pagination';
import { useConfirm } from './useConfirm';
import { useToast } from './useToast';
import './homepage-editor.css';
import './products-admin.css';

const PAGE_SIZE = 20;
const SORTS = { store: 'Store order', name: 'Name A–Z', 'price-asc': 'Price, low to high', 'price-desc': 'Price, high to low' };
const price = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const cover = product => [...(product.product_images || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function AdminProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState(null);
  const [castes, setCastes] = useState([]);
  const [broken, setBroken] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [caste, setCaste] = useState('all');
  const [sort, setSort] = useState('store');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialog, requestConfirm] = useConfirm();
  const [toast, showToast] = useToast();

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.from('products')
      .select('*, product_sizes(size, in_stock), product_images(id, r2_key, sort_order, alt)')
      .order('caste_id').order('sort_order');
    if (loadError) { setError(`Garments could not load: ${loadError.message}`); setProducts([]); return; }
    setProducts(data || []);
  }, []);
  useEffect(() => {
    load();
    supabase.from('castes').select('id, name, sort_order').order('sort_order').then(({ data }) => setCastes(data || []));
  }, [load]);

  // A message handed over by the editor (after a delete) is shown once.
  useEffect(() => {
    if (!location.state?.message) return;
    showToast(location.state.message);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate, showToast]);

  // Check every cover photo, not just the ones on screen, so "Needs attention" counts the whole catalog.
  useEffect(() => {
    if (!products) return undefined;
    let active = true;
    const found = new Set();
    const checks = products.filter(p => cover(p)).map(p => new Promise(resolve => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = () => { found.add(p.id); resolve(); };
      image.src = mediaUrl(cover(p).r2_key);
    }));
    Promise.all(checks).then(() => { if (active) setBroken(found); });
    return () => { active = false; };
  }, [products]);

  const casteName = id => (id === 'old-world' ? 'Old World archive' : castes.find(c => c.id === id)?.name || id || '—');
  const issuesOf = useCallback(p => productIssues(p, broken), [broken]);
  const attentionCount = (products || []).filter(p => issuesOf(p).length).length;

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = (products || []).filter(p =>
      (!term || [p.name, p.sku, p.id].some(v => v?.toLowerCase().includes(term)))
      && (caste === 'all' || p.caste_id === caste)
      && (status === 'all' || (status === 'published' && p.is_published) || (status === 'draft' && !p.is_published) || (status === 'attention' && issuesOf(p).length)));
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, query, caste, status, sort, issuesOf]);
  useEffect(() => setPage(1), [query, caste, status, sort]);
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const chosen = (products || []).filter(p => selected.has(p.id));
  const allOnPage = pageItems.length > 0 && pageItems.every(p => selected.has(p.id));

  const toggle = id => setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const togglePage = () => setSelected(current => { const next = new Set(current); pageItems.forEach(p => (allOnPage ? next.delete(p.id) : next.add(p.id))); return next; });

  const setPublished = async publish => {
    const ready = publish ? chosen.filter(p => canPublish(publishChecks(p, p.product_sizes || [], (p.product_images || []).map(() => ({ broken: broken.has(p.id) }))))) : chosen;
    const skipped = chosen.length - ready.length;
    if (!ready.length) { setError(`None of the selected garments can be published yet. Open each one to see what it needs.`); return; }
    setBusy(true); setError('');
    const { error: updateError } = await supabase.from('products').update({ is_published: publish }).in('id', ready.map(p => p.id));
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    showToast(`${plural(ready.length, 'garment')} ${publish ? 'published' : 'moved to draft'}.${skipped ? ` ${skipped} not ready to publish ${skipped === 1 ? 'was' : 'were'} skipped.` : ''}`);
    setSelected(new Set());
    load();
  };
  const removeSelected = async () => {
    if (!(await requestConfirm(`Delete ${plural(chosen.length, 'garment')}? Their photos and sizes are removed from the store and from storage. This cannot be undone.`, { danger: true }))) return;
    setBusy(true); setError('');
    const problems = [];
    let filesLeft = 0;
    for (const product of chosen) {
      try { filesLeft += (await deleteProduct(product)).failedFiles.length; } catch (err) { problems.push(err.message); }
    }
    setBusy(false);
    setSelected(new Set());
    if (problems.length) setError(problems.join(' '));
    else showToast(`Deleted ${plural(chosen.length, 'garment')}.${filesLeft ? ` ${plural(filesLeft, 'file')} could not be removed from storage.` : ''}`);
    load();
  };

  return <div className="hp-editor pa">
    <header className="pa-head">
      <div className="hp-title">
        <span className="hp-eyebrow">Commerce</span>
        <h1>Products</h1>
        <span className="hp-hint">{products ? `${plural(products.length, 'garment')}${attentionCount ? ` · ${attentionCount} need attention` : ''}` : 'Loading…'}</span>
      </div>
      <Link className="hp-btn hp-btn-primary pa-new" to="/admin/products/new">+ New garment</Link>
    </header>

    <div className="pa-tools">
      <label className="sr-only" htmlFor="pa-search">Search garments</label>
      <input id="pa-search" type="search" placeholder="Search by name or SKU" value={query} onChange={event => setQuery(event.target.value)} />
      <div className="hp-segmented" role="group" aria-label="Show">
        {[['all', `All ${products?.length ?? ''}`], ['published', 'Published'], ['draft', 'Drafts'], ['attention', `Needs attention${attentionCount ? ` ${attentionCount}` : ''}`]].map(([id, label]) =>
          <button key={id} type="button" aria-pressed={status === id} className={id === 'attention' && attentionCount ? 'is-warning' : ''} onClick={() => setStatus(id)}>{label}</button>)}
      </div>
      <label className="pa-inline">Caste
        <select value={caste} onChange={event => setCaste(event.target.value)}>
          <option value="all">All castes</option>
          {castes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          {(products || []).some(p => p.caste_id === 'old-world') && !castes.some(c => c.id === 'old-world') && <option value="old-world">Old World archive</option>}
        </select>
      </label>
      <label className="pa-inline">Sort
        <select value={sort} onChange={event => setSort(event.target.value)}>
          {Object.entries(SORTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
    </div>

    {selected.size > 0 && <div className="pa-bulk" role="region" aria-label="Selected garments">
      <span>{selected.size} selected</span>
      <button type="button" className="hp-btn" disabled={busy} onClick={() => setPublished(true)}>Publish</button>
      <button type="button" className="hp-btn" disabled={busy} onClick={() => setPublished(false)}>Move to draft</button>
      <button type="button" className="hp-btn pa-danger" disabled={busy} onClick={removeSelected}>Delete…</button>
      <button type="button" className="hp-btn hp-btn-quiet" onClick={() => setSelected(new Set())}>Clear selection</button>
    </div>}
    {error && <p className="hp-banner is-danger" role="alert">{error}</p>}

    {products === null ? <p className="hp-hint" role="status">Loading garments…</p> : <div className="pa-table-wrap">
      <table className="pa-table">
        <thead><tr>
          <th scope="col"><input type="checkbox" aria-label="Select all garments on this page" checked={allOnPage} onChange={togglePage} /></th>
          <th scope="col">Photo</th><th scope="col">Garment</th><th scope="col">Caste</th><th scope="col">Price</th>
          <th scope="col">Sizes in stock</th><th scope="col">Status</th><th scope="col">Needs attention</th>
        </tr></thead>
        <tbody>
          {pageItems.map(product => {
            const photo = cover(product);
            const issues = issuesOf(product);
            const sizes = [...(product.product_sizes || [])].sort(sortSizes);
            return <tr key={product.id} className={selected.has(product.id) ? 'is-selected' : ''} onClick={event => { if (!event.target.closest('a, input, button')) navigate(`/admin/products/${product.id}`); }}>
              <td><input type="checkbox" aria-label={`Select ${product.name}`} checked={selected.has(product.id)} onChange={() => toggle(product.id)} /></td>
              <td>{photo && !broken.has(product.id)
                ? <img className="pa-thumb" src={mediaUrl(photo.r2_key)} alt="" loading="lazy" />
                : <span className="pa-thumb pa-thumb-missing">{photo ? 'Photo missing' : 'No photo'}</span>}</td>
              <td><Link className="pa-name" to={`/admin/products/${product.id}`}>{product.name}</Link>
                <span className="hp-hint">{[product.num && `№ ${product.num}`, product.sku].filter(Boolean).join(' · ') || product.id}</span></td>
              <td>{casteName(product.caste_id)}</td>
              <td className="pa-price">{price(product.price)}</td>
              <td><span className="pa-sizes" aria-label={sizes.length ? sizes.map(s => `${s.size} ${s.in_stock ? 'in stock' : 'sold out'}`).join(', ') : 'No sizes'}>
                {sizes.length ? sizes.map(s => <span key={s.size} className={s.in_stock ? 'pa-size is-in' : 'pa-size'} aria-hidden="true">{s.size}</span>) : <span className="hp-hint">None</span>}
              </span></td>
              <td><span className={product.is_published ? 'pa-status is-live' : 'pa-status'}>{product.is_published ? 'Published' : 'Draft'}</span></td>
              <td className="pa-issues">{issues.join(' · ')}</td>
            </tr>;
          })}
        </tbody>
      </table>
      {!visible.length && <p className="hp-hint pa-empty">{products.length ? 'No garments match these filters.' : 'No garments yet. Create the first one.'}</p>}
    </div>}

    <div className="pa-foot">
      <span className="hp-hint">Click a garment to edit it. Filled size = in stock, struck through = sold out.</span>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalCount={visible.length} pageSize={PAGE_SIZE} />
    </div>
    {confirmDialog}
    {toast}
  </div>;
}
