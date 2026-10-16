import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, mediaUrl } from '../lib/supabase';
import './store.css';

const formatPrice = (p) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

const SIZES = ['S', 'M', 'L', 'XL'];
const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { key: 'featured', label: 'Featured' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'name_asc', label: 'Name: A–Z' },
];

export default function Store() {
  const [castes, setCastes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [caste, setCaste] = useState('all');
  const [size, setSize] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [castesRes, productsRes] = await Promise.all([
      supabase.from('castes').select('id, name, sort_order').order('sort_order'),
      supabase
        .from('products')
        .select('id, name, price, caste_id, sort_order, product_images(r2_key, sort_order), product_sizes(size, in_stock)')
        .eq('is_published', true)
        .order('sort_order'),
      ]);
      if (castesRes.error) throw castesRes.error;
      if (productsRes.error) throw productsRes.error;
      setCastes(castesRes.data || []);
      setProducts(productsRes.data || []);
    } catch {
      setLoadError('The garments could not be gathered. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    setPage(1);
  }, [caste, size, sortBy]);

  const casteName = (id) => castes.find((c) => c.id === id)?.name || id;

  const filtered = useMemo(() => {
    let list = products.filter((p) =>
      (caste === 'all' || p.caste_id === caste) &&
      (size === 'all' || (p.product_sizes || []).some((s) => s.in_stock && s.size === size))
    );

    if (sortBy === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === 'name_asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, caste, size, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs = [{ id: 'all', name: 'All garments' }, ...castes];

  return (
    <div className="store fade-in">
      <header className="store-head">
        <div>
          <span className="store-eyebrow">
            <Link to="/home">Home</Link> / Store
          </span>
          <h1>Every Garment</h1>
          <p>Gathered from every caste of the Sanctum.</p>
        </div>
        <span className="store-eyebrow">Made to order in Delhi</span>
      </header>

      <div className="store-tabs" role="tablist" aria-label="Caste">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={caste === t.id} onClick={() => setCaste(t.id)}>
            {t.name}
          </button>
        ))}
      </div>

      <div className="store-meta">
        <span className="store-eyebrow">{loading ? '' : `${filtered.length} ${filtered.length === 1 ? 'garment' : 'garments'}`}</span>
        <div className="store-controls">
          <label>
            Size:
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="all">All</option>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Sort:
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {loadError ? (
        <div role="alert" className="store-message">
          <p>{loadError}</p>
          <button type="button" onClick={loadCatalog} className="underlined-link">Try again →</button>
        </div>
      ) : loading ? (
        <div className="store-grid" aria-busy="true" aria-label="Loading garments">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="store-card">
              <div className="skeleton store-card-img" />
              <div className="skeleton" style={{ width: '30%', height: '10px' }} />
              <div className="skeleton" style={{ width: '70%', height: '20px' }} />
            </div>
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <p className="store-message">No garments match these filters.</p>
      ) : (
        <div className="store-grid">
          {pageItems.map((piece) => (
            <Link key={piece.id} to={`/the-${piece.caste_id}/${piece.id}`} className="store-card">
              <div className="store-card-img">
                <img
                  src={mediaUrl(piece.product_images?.[0]?.r2_key)}
                  alt={piece.name}
                  loading="lazy"
                  decoding="async"
                  className="img-reveal"
                  onLoad={(e) => e.target.classList.add('loaded')}
                  onError={(e) => { e.target.style.visibility = 'hidden'; }}
                />
              </div>
              <span className="store-eyebrow">{casteName(piece.caste_id)}</span>
              <div className="store-card-row">
                <h3>{piece.name}</h3>
                <span>{formatPrice(piece.price)}</span>
              </div>
              <span className="store-card-link">View garment ↗</span>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="store-pages">
          <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</button>
          <span className="store-eyebrow">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}
