import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, mediaUrl } from '../lib/supabase';
import useScrollReveal from '../lib/useScrollReveal';

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

const selectStyle = {
  background: 'none',
  border: '1px solid rgba(200, 204, 209, 0.3)',
  color: 'var(--bone-white)',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
};

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FilterOption({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        background: 'none',
        border: 'none',
        padding: '8px 0',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-body)',
        fontSize: '16px',
        color: active ? 'var(--bone-white)' : 'var(--ash-grey)',
      }}
    >
      <span
        style={{
          width: '16px',
          height: '16px',
          flexShrink: 0,
          border: '1px solid var(--cold-silver)',
          backgroundColor: active ? 'var(--bone-white)' : 'transparent',
        }}
      />
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span className="body-s" style={{ fontSize: '13px' }}>({count})</span>}
    </button>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <span className="ui-text" style={{ fontSize: '13px' }}>{title}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <button
      onClick={onRemove}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--bone-white)',
        border: '1px solid rgba(200, 204, 209, 0.3)',
        backgroundColor: 'transparent',
        padding: '7px 14px',
        cursor: 'pointer',
      }}
    >
      {label}
      <span style={{ color: 'var(--ash-grey)' }}>✕</span>
    </button>
  );
}

export default function Store() {
  const containerRef = useScrollReveal();
  const [castes, setCastes] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCastes, setSelectedCastes] = useState(new Set());
  const [selectedSizes, setSelectedSizes] = useState(new Set());
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      supabase.from('castes').select('id, name, hero_r2_key, sort_order').order('sort_order'),
      supabase
        .from('products')
        .select('id, name, num, price, caste_id, sort_order, product_images(r2_key, sort_order), product_sizes(size, in_stock)')
        .eq('is_published', true)
        .order('sort_order'),
    ]).then(([castesRes, productsRes]) => {
      setCastes(castesRes.data || []);
      setProducts(productsRes.data || []);
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedCastes, selectedSizes, sortBy]);

  const casteName = (id) => castes.find((c) => c.id === id)?.name || id;
  const casteCount = (id) => products.filter((p) => p.caste_id === id).length;

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (selectedCastes.size > 0 && !selectedCastes.has(p.caste_id)) return false;
      if (selectedSizes.size > 0) {
        const hasSize = (p.product_sizes || []).some((s) => s.in_stock && selectedSizes.has(s.size));
        if (!hasSize) return false;
      }
      return true;
    });

    if (sortBy === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === 'name_asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, selectedCastes, selectedSizes, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const heroImage = mediaUrl(castes[0]?.hero_r2_key);
  const hasActiveFilters = selectedCastes.size > 0 || selectedSizes.size > 0;

  const clearAll = () => {
    setSelectedCastes(new Set());
    setSelectedSizes(new Set());
  };

  return (
    <div ref={containerRef} style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingBottom: '160px' }} className="fade-in">
      {/* Hero */}
      <section
        style={{
          position: 'relative',
          height: '65vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {heroImage && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${heroImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.5) 60%, rgba(10,10,10,0.75) 100%)',
              }}
            />
          </>
        )}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 24px' }}>
          <span className="ui-text reveal">The Store</span>
          <h1 className="display-l reveal reveal-delay-1">Every Garment</h1>
          <p className="body-l reveal reveal-delay-2" style={{ fontStyle: 'italic', color: 'var(--ash-grey)' }}>
            Gathered from every caste of the Sanctum.
          </p>
        </div>
      </section>

      <div style={{ padding: '48px var(--grid-margin-desktop) 0' }}>
        {/* Breadcrumb + result count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          <span className="ui-text" style={{ fontSize: '12px' }}>
            <Link to="/home" className="silver-hover" style={{ color: 'var(--ash-grey)' }}>Home</Link> / Store
          </span>
          <span className="body-s">{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}</span>
        </div>

        <div style={{ display: 'flex', gap: '64px', alignItems: 'flex-start' }} className="store-layout">
          {/* Sidebar — filters + sort + pagination, sits beside the products and
              locks in place once you scroll down to it (not fixed from page load,
              which would float over the hero image above). */}
          <aside
            className="store-sidebar"
            style={{
              width: '270px',
              flexShrink: 0,
              position: 'sticky',
              top: '96px',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '44px',
            }}
          >
            <h2 className="ui-text" style={{ fontSize: '16px', color: 'var(--bone-white)', letterSpacing: '0.1em' }}>Filters</h2>

            <FilterGroup title="Caste">
              {castes.map((c) => (
                <FilterOption
                  key={c.id}
                  label={c.name}
                  count={casteCount(c.id)}
                  active={selectedCastes.has(c.id)}
                  onClick={() => setSelectedCastes((s) => toggleInSet(s, c.id))}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Size">
              {SIZES.map((size) => (
                <FilterOption key={size} label={size} active={selectedSizes.has(size)} onClick={() => setSelectedSizes((s) => toggleInSet(s, size))} />
              ))}
            </FilterGroup>

            <FilterGroup title="Sort">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </FilterGroup>

            {hasActiveFilters && (
              <button onClick={clearAll} className="underlined-link silver-hover" style={{ background: 'none', border: 'none', fontSize: '14px', width: 'fit-content' }}>
                Clear all
              </button>
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(200, 204, 209, 0.15)', paddingTop: '28px' }}>
                <span className="ui-text" style={{ fontSize: '12px' }}>Page {page} of {totalPages}</span>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="underlined-link silver-hover"
                    style={{ background: 'none', border: 'none', fontSize: '15px', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.3 : 1 }}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="underlined-link silver-hover"
                    style={{ background: 'none', border: 'none', fontSize: '15px', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.3 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Active filter chips */}
            {hasActiveFilters && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
                {[...selectedCastes].map((id) => (
                  <FilterChip key={`c-${id}`} label={casteName(id)} onRemove={() => setSelectedCastes((s) => toggleInSet(s, id))} />
                ))}
                {[...selectedSizes].map((size) => (
                  <FilterChip key={`s-${size}`} label={`Size ${size}`} onRemove={() => setSelectedSizes((s) => toggleInSet(s, size))} />
                ))}
              </div>
            )}

            {/* Product grid */}
            {pageItems.length === 0 ? (
              <p className="body-s" style={{ color: 'var(--ash-grey)' }}>No pieces match these filters.</p>
            ) : (
              <div className="store-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px' }}>
                {pageItems.map((piece, i) => (
                  <Link
                    key={piece.id}
                    to={`/the-${piece.caste_id}/${piece.id}`}
                    className={`silver-hover reveal reveal-delay-${(i % 5) + 1}`}
                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <div className="store-tile-img-wrap" style={{ position: 'relative', width: '100%', paddingBottom: '130%', backgroundColor: '#151515' }}>
                      <img
                        src={mediaUrl(piece.product_images?.[0]?.r2_key)}
                        alt={piece.name}
                        className="img-reveal store-tile-img"
                        onLoad={(e) => e.target.classList.add('loaded')}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <span className="ui-text" style={{ fontSize: '11px' }}>{casteName(piece.caste_id)}</span>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--bone-white)', marginTop: '4px' }}>
                        {piece.name}
                      </h3>
                      <span className="body-m">
                        {piece.num && `№ ${piece.num} — `}{formatPrice(piece.price)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .store-layout {
            flex-direction: column !important;
            gap: 32px !important;
          }
          .store-sidebar {
            width: 100% !important;
            position: relative !important;
            top: auto !important;
            max-height: none !important;
          }
          .store-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 640px) {
          .store-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}
