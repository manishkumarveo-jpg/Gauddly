import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, mediaUrl } from '../lib/supabase';

export default function CastePage() {
  const { casteId } = useParams();
  // Strip "the-" prefix if it exists in route parameters (e.g. "/the-nimbus" -> "nimbus")
  const key = casteId?.replace('the-', '') || 'nimbus';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHeaderPinned, setIsHeaderPinned] = useState(false);
  const headerAnchorRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('castes').select('id, name, hero_r2_key, passage').eq('id', key).single(),
      supabase
        .from('products')
        .select('id, num, name, price, passage, product_images(r2_key, sort_order)')
        .eq('caste_id', key)
        .eq('is_published', true)
        .order('sort_order'),
    ]).then(([casteRes, productsRes]) => {
      if (casteRes.data) {
        setData({
          title: casteRes.data.name.toUpperCase(),
          image: mediaUrl(casteRes.data.hero_r2_key),
          passage: casteRes.data.passage,
          pieces: (productsRes.data || []).map((p) => ({
            id: p.id,
            num: p.num,
            name: p.name,
            price: p.price,
            desc: p.passage,
            image: mediaUrl(p.product_images?.[0]?.r2_key),
          })),
        });
      }
      setLoading(false);
    });
  }, [key]);

  useEffect(() => {
    // Scroll header pin detection
    const handleScroll = () => {
      if (headerAnchorRef.current) {
        const rect = headerAnchorRef.current.getBoundingClientRect();
        // Pin header when anchor element leaves the top of viewport (e.g. scrolls past 400px of page)
        if (rect.top <= 40) {
          setIsHeaderPinned(true);
        } else {
          setIsHeaderPinned(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!data) {
    return (
      <div style={{ padding: '160px', textAlign: 'center', color: 'var(--ash-grey)' }}>
        {loading ? '' : 'Caste room not found in the Sanctum.'}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', overflowX: 'hidden' }} className="fade-in">
      
      {/* SECTION A — Hero Image (80vh, full bleed, atmospheric) */}
      <section 
        style={{
          width: '100%',
          height: '80vh',
          backgroundImage: `linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0) 40%), url("${data.image}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Pinned Caste Title Header (Spec 3.4) */}
      <div 
        style={{
          position: isHeaderPinned ? 'fixed' : 'absolute',
          top: isHeaderPinned ? '64px' : 'auto',
          left: 0,
          width: '100%',
          height: '64px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isHeaderPinned ? 'rgba(10, 10, 10, 0.95)' : 'transparent',
          borderBottom: isHeaderPinned ? '1px solid rgba(200, 204, 209, 0.15)' : '1px solid transparent',
          zIndex: 900,
          transition: 'background-color 0.3s, border-bottom 0.3s, transform 0.3s ease-out',
          pointerEvents: 'none',
        }}
      >
        <span 
          style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: isHeaderPinned ? '24px' : '0px', 
            color: 'var(--bone-white)', 
            letterSpacing: '0.1em',
            opacity: isHeaderPinned ? 1 : 0,
            transition: 'font-size 0.3s, opacity 0.3s',
            pointerEvents: 'auto',
          }}
        >
          {data.title}
        </span>
      </div>

      {/* SECTION B — Caste Identity (80vh centered content) */}
      <section 
        ref={headerAnchorRef}
        style={{
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 24px',
          backgroundColor: 'var(--void-black)',
        }}
      >
        {/* Render large header only if not pinned */}
        <h1 
          style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '64px', 
            letterSpacing: '0.05em', 
            marginBottom: '32px',
            opacity: isHeaderPinned ? 0 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {data.title}
        </h1>
        <p className="body-l" style={{ fontStyle: 'italic', maxWidth: '640px', color: 'var(--bone-white)' }}>
          "{data.passage}"
        </p>
      </section>

      {/* SECTION C — The Pieces */}
      <section style={{ backgroundColor: 'var(--void-black)', paddingBottom: '160px' }}>
        {data.pieces.map((piece, index) => (
          <div key={piece.id} style={{ scrollMarginTop: '100px' }}>
            <div 
              style={{
                display: 'flex',
                minHeight: '100vh',
                position: 'relative',
              }}
              className="piece-section-container"
            >
              {/* Left Column (Sticky Image, Desktop only) */}
              <div 
                style={{
                  width: '50%',
                  position: 'sticky',
                  top: '128px',
                  height: 'calc(100vh - 160px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '40px',
                }}
                className="piece-sticky-img-col"
              >
                <img 
                  src={piece.image} 
                  alt={piece.name} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    border: '1px solid rgba(200, 204, 209, 0.15)',
                  }}
                />
              </div>

              {/* Right Column (Scrollable details) */}
              <div 
                style={{
                  width: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '120px 80px',
                  gap: '24px',
                }}
                className="piece-scroll-details-col"
              >
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: 'var(--ash-grey)' }}>
                  {piece.num}.
                </span>
                
                <h2 className="display-m">
                  {piece.name}
                </h2>
                
                <p className="body-l" style={{ fontStyle: 'italic', color: 'var(--bone-white)' }}>
                  {piece.desc}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <span className="body-s">
                    Hand-dyed. Made to order. Delivered in 14–21 days.
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--bone-white)', marginTop: '8px' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(piece.price)}
                  </span>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <Link to={`/the-${key}/${piece.id}`} className="underlined-link silver-hover" style={{ fontSize: '20px' }}>
                    Claim →
                  </Link>
                </div>
              </div>
            </div>

            {/* Separator rule */}
            {index < data.pieces.length - 1 && (
              <div style={{ height: '1px', backgroundColor: 'rgba(200, 204, 209, 0.15)', width: '200px', margin: '80px auto' }} />
            )}
          </div>
        ))}
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .piece-section-container {
            flex-direction: column !important;
            min-height: auto !important;
          }
          .piece-sticky-img-col {
            width: 100% !important;
            position: relative !important;
            top: auto !important;
            height: 480px !important;
            padding: 24px !important;
          }
          .piece-scroll-details-col {
            width: 100% !important;
            padding: 24px !important;
            gap: 16px !important;
          }
        }
      `}} />

    </div>
  );
}
