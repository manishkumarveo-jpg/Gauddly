import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, mediaUrl } from '../lib/supabase';

const formatPrice = (p) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

export default function Store() {
  const [castes, setCastes] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      supabase.from('castes').select('id, name, sort_order').order('sort_order'),
      supabase
        .from('products')
        .select('id, name, price, caste_id, sort_order, product_images(r2_key, sort_order)')
        .eq('is_published', true)
        .order('sort_order'),
    ]).then(([castesRes, productsRes]) => {
      setCastes(castesRes.data || []);
      setProducts(productsRes.data || []);
    });
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '120px', paddingBottom: '160px' }} className="fade-in">
      <div style={{ padding: '0 var(--grid-margin-desktop)' }}>
        <div style={{ borderBottom: '1px solid rgba(200, 204, 209, 0.15)', paddingBottom: '24px', marginBottom: '80px' }}>
          <h1 className="display-l">The Store</h1>
          <p className="body-l" style={{ fontStyle: 'italic', color: 'var(--ash-grey)', marginTop: '8px' }}>
            Every garment, gathered by caste.
          </p>
        </div>

        {castes.map((caste) => {
          const pieces = products.filter((p) => p.caste_id === caste.id);
          if (pieces.length === 0) return null;

          const roomPath = caste.id === 'old-world' ? '/old-world' : `/the-${caste.id}`;

          return (
            <section key={caste.id} style={{ marginBottom: '120px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', marginBottom: '40px' }}>
                <h2 className="display-s">{caste.name}</h2>
                <Link to={roomPath} className="underlined-link silver-hover" style={{ fontSize: '14px' }}>
                  View room →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '32px' }}>
                {pieces.map((piece) => (
                  <Link
                    key={piece.id}
                    to={`/the-${caste.id}/${piece.id}`}
                    className="silver-hover"
                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '150%', overflow: 'hidden', backgroundColor: '#151515' }}>
                      <img
                        src={mediaUrl(piece.product_images?.[0]?.r2_key)}
                        alt={piece.name}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--bone-white)' }}>
                        {piece.name}
                      </h3>
                      <span className="body-s">{formatPrice(piece.price)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {castes.length > 0 && products.length === 0 && (
          <p className="body-s" style={{ color: 'var(--ash-grey)' }}>No pieces available yet.</p>
        )}
      </div>
    </div>
  );
}
