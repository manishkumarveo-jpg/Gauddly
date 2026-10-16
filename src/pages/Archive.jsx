import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase, mediaUrl } from '../lib/supabase';

export default function Archive() {
  const [isHeaderPinned, setIsHeaderPinned] = useState(false);
  const headerAnchorRef = useRef(null);
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    supabase
      .from('products')
      .select('id, num, name, price, passage, product_images(r2_key, sort_order)')
      .eq('caste_id', 'old-world')
      .eq('is_published', true)
      .order('sort_order')
      .then(({ data }) => {
        setPieces(
          (data || []).map((p) => ({
            id: p.id,
            num: p.num,
            name: p.name,
            price: p.price,
            desc: p.passage,
            image: mediaUrl(p.product_images?.[0]?.r2_key),
          }))
        );
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (headerAnchorRef.current) {
        const rect = headerAnchorRef.current.getBoundingClientRect();
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

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', overflowX: 'hidden' }} className="fade-in">
      
      {/* Hero Header image */}
      <section 
        style={{
          width: '100%',
          height: '80vh',
          backgroundImage: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0) 40%), url("/cathedral_hero.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(1)', // Archive is completely monochrome
        }}
      />

      {/* Pinned Title Header */}
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
          THE OLD WORLD
        </span>
      </div>

      {/* Description */}
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
          THE OLD WORLD
        </h1>
        <p className="body-l" style={{ fontStyle: 'italic', maxWidth: '640px', color: 'var(--bone-white)' }}>
          "Before the Sanctum, there was only the world. It was ordinary. It was mortal. What remains from that age are the bones. These garments were made in the age that ended. They are the last of the ordinary."
        </p>
      </section>

      {/* Pieces sequential list */}
      <section style={{ backgroundColor: 'var(--void-black)' }}>
        {pieces.map((piece, index) => (
          <div key={piece.id}>
            <div 
              style={{
                display: 'flex',
                minHeight: '100vh',
                position: 'relative',
              }}
              className="piece-section-container"
            >
              {/* Left column (sticky) */}
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
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    border: '1px solid rgba(200, 204, 209, 0.15)',
                    filter: 'grayscale(1)',
                  }}
                />
              </div>

              {/* Right column */}
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
                    Hand-distressed. Relic Archive. Available immediately.
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--bone-white)', marginTop: '8px' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(piece.price)}
                  </span>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <Link to={`/the-old-world/${piece.id}`} className="underlined-link silver-hover" style={{ fontSize: '20px' }}>
                    Claim relic →
                  </Link>
                </div>
              </div>
            </div>

            {/* Separator rule */}
            {index < pieces.length - 1 && (
              <div style={{ height: '1px', backgroundColor: 'rgba(200, 204, 209, 0.15)', width: '200px', margin: '80px auto' }} />
            )}
          </div>
        ))}
      </section>

      {/* Section D — Archive historical notice */}
      <section 
        style={{ 
          padding: '120px 24px', 
          textAlign: 'center', 
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          borderTop: '1px solid rgba(200, 204, 209, 0.1)'
        }}
      >
        <p className="body-l" style={{ fontStyle: 'italic', color: 'var(--ash-grey)', maxWidth: '640px', margin: '0 auto' }}>
          "A limited number of these pieces were released to other stores in a previous life. Those pieces still walk the world. They are not counterfeit. They are the last physical evidence that the ordinary once existed."
        </p>
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
