import React, { useState, useContext, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { supabase, mediaUrl } from '../lib/supabase';
import useScrollReveal from '../lib/useScrollReveal';

// Custom hero video player - autoplays muted/looping, text-based controls
// matching the site's Episodes player, no native browser video chrome.
function HeroVideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: '24px',
          background: 'linear-gradient(to top, rgba(10,10,10,0.85), transparent)',
          display: 'flex',
          gap: '24px',
          pointerEvents: 'none',
        }}
      >
        <button
          onClick={togglePlay}
          className="ui-text silver-hover"
          style={{ background: 'none', border: 'none', color: 'var(--bone-white)', cursor: 'pointer', pointerEvents: 'auto' }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={toggleMute}
          className="ui-text silver-hover"
          style={{ background: 'none', border: 'none', color: 'var(--bone-white)', cursor: 'pointer', pointerEvents: 'auto' }}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>
    </div>
  );
}

// Hover-grow media grid: hovering a cell enlarges its entire row and column
// via CSS grid fr-value transitions. Plain CSS, no animation library -
// mirrors how the rest of this site's hover effects (e.g. Home.jsx's caste
// grid) are done, just applied to grid-template sizing instead of filters.
function DynamicFrameGrid({ images }) {
  const cols = 3;
  const rows = Math.ceil(images.length / cols);
  const [hovered, setHovered] = useState(null); // { row, col } | null

  const trackSizes = (count, hoveredIndex) => {
    if (hoveredIndex == null || count <= 1) return `repeat(${count}, 1fr)`;
    return Array.from({ length: count }, (_, i) => (i === hoveredIndex ? '2.2fr' : '1fr')).join(' ');
  };

  return (
    <div
      className="frame-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: trackSizes(cols, hovered?.col ?? null),
        gridTemplateRows: trackSizes(rows, hovered?.row ?? null),
        gap: '16px',
        height: `${rows * 48}vh`,
        transition: 'grid-template-columns 0.4s ease, grid-template-rows 0.4s ease',
      }}
    >
      {images.map((img, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const isHovered = hovered?.row === row && hovered?.col === col;
        return (
          <div
            key={img.src}
            onMouseEnter={() => setHovered({ row, col })}
            onMouseLeave={() => setHovered(null)}
            style={{ overflow: 'hidden', backgroundColor: '#151515' }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="img-reveal"
              onLoad={(e) => e.target.classList.add('loaded')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function PieceDetail() {
  const { pieceId } = useParams();
  const { addToCart, setIsCartOpen } = useContext(AppContext);
  const [selectedSize, setSelectedSize] = useState(null);
  const [data, setData] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('products')
      .select('id, name, num, price, passage, craft, caste_id, video_r2_key, castes(name), product_images(r2_key, sort_order, alt), product_sizes(size, in_stock)')
      .eq('id', pieceId)
      .order('sort_order', { foreignTable: 'product_images', ascending: true })
      .single()
      .then(({ data: product }) => {
        if (product) {
          const casteName = product.castes?.name?.toUpperCase() || '';
          const images = (product.product_images || []).map((img) => ({
            src: mediaUrl(img.r2_key),
            alt: img.alt || product.name,
          }));
          setData({
            id: product.id,
            name: product.name,
            num: product.num,
            caste: casteName,
            castePath: product.caste_id === 'old-world' ? '/old-world' : `/the-${product.caste_id}`,
            price: product.price,
            passage: product.passage,
            craft: product.craft,
            images,
            image: images[0]?.src,
            video: mediaUrl(product.video_r2_key),
          });
          const availableSizes = (product.product_sizes || [])
            .filter((s) => s.in_stock)
            .map((s) => s.size);
          setSizes(availableSizes);
          setSelectedSize(availableSizes[0] || null);
        }
        setLoading(false);
      });
  }, [pieceId]);

  if (!data) {
    return (
      <div style={{ padding: '160px', textAlign: 'center', color: 'var(--ash-grey)' }}>
        {loading ? '' : 'Garment piece not found in the Chambers.'}
      </div>
    );
  }

  const handleClaim = () => {
    addToCart({
      id: data.id,
      name: data.name,
      price: data.price,
      size: selectedSize,
      caste: data.caste,
      image: data.image,
    });
    // Silent addition: Open the cart drawer automatically to show selection without annoying popups
    setIsCartOpen(true);
  };

  return (
    <PieceDetailView
      data={data}
      sizes={sizes}
      selectedSize={selectedSize}
      setSelectedSize={setSelectedSize}
      onClaim={handleClaim}
    />
  );
}

// Mounts once real data is available, so useScrollReveal's one-shot mount
// observer finds the actual .reveal/.hairline-animated nodes in the DOM
// instead of firing early against the loading placeholder.
function PieceDetailView({ data, sizes, selectedSize, setSelectedSize, onClaim }) {
  const containerRef = useScrollReveal();
  const { images } = data;

  const passageBg = images[1]?.src;
  const craftImage = images[2]?.src || images[1]?.src || images[0]?.src;
  const galleryImages = data.video ? images : images.slice(1);

  return (
    <div ref={containerRef} style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', overflowX: 'hidden' }} className="fade-in">
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          position: 'relative'
        }}
        className="product-page-container"
      >
        {/* Left Column (Sticky Image, Desktop only) */}
        <div
          style={{
            width: '50%',
            position: 'sticky',
            top: '64px',
            height: 'calc(100vh - 64px)',
            overflow: 'hidden',
          }}
          className="product-sticky-img-col"
        >
          {data.video ? (
            <HeroVideoPlayer src={data.video} />
          ) : (
            <img
              src={data.image}
              alt={data.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
        </div>

        {/* Right Column (Scrollable details overlay) */}
        <div
          style={{
            width: '50%',
            padding: '120px 80px 80px 80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '32px',
          }}
          className="product-details-col"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
              {data.num && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: 'var(--ash-grey)' }}>
                  № {data.num}
                </span>
              )}
              <span className="ui-text" style={{ fontSize: '11px', color: 'var(--ash-grey)' }}>
                {data.caste}
              </span>
            </div>
            <h1 className="display-m" style={{ marginTop: '8px', marginBottom: '24px' }}>
              {data.name}
            </h1>
            <p className="body-l" style={{ fontStyle: 'italic', color: 'var(--bone-white)', borderLeft: '1px solid var(--cold-silver)', paddingLeft: '20px' }}>
              "{data.passage}"
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="ui-text" style={{ fontSize: '10px' }}>Craft / Structure</span>
            <p className="body-s" style={{ color: 'var(--ash-grey)' }}>
              {data.craft} Made to order. Delivered in 14–21 days.
            </p>
          </div>

          {/* Size Selector */}
          {sizes.length === 0 ? (
            <span className="body-s" style={{ color: 'var(--ash-grey)' }}>Currently unavailable in all sizes.</span>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span className="ui-text" style={{ fontSize: '10px' }}>Select Size</span>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              {sizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className="silver-hover"
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-body)',
                      fontSize: '22px',
                      color: isSelected ? 'var(--bone-white)' : 'var(--ash-grey)',
                      cursor: 'pointer',
                      paddingBottom: '2px',
                      borderBottom: isSelected ? '1px solid var(--cold-silver)' : '1px solid transparent',
                      transition: 'color 0.2s, border-bottom 0.2s',
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Price & CTA */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--bone-white)' }}>
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.price)}
            </span>
            <button
              onClick={onClaim}
              disabled={sizes.length === 0}
              className="underlined-link silver-hover"
              style={{
                background: 'none',
                border: 'none',
                width: 'fit-content',
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                color: 'var(--bone-white)',
                padding: '8px 0',
                textAlign: 'left',
                opacity: sizes.length === 0 ? 0.4 : 1,
                cursor: sizes.length === 0 ? 'default' : 'pointer',
              }}
            >
              {sizes.length === 0 ? 'Unavailable' : 'Claim garment →'}
            </button>
          </div>
        </div>
      </div>

      <hr className="hairline-centered hairline-animated" />

      {/* SECTION B — "The Passage": full-bleed cinematic pull-quote */}
      <section
        className="reveal passage-section"
        style={{
          position: 'relative',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px var(--grid-margin-desktop)',
          backgroundColor: 'var(--void-black)',
          overflow: 'hidden',
        }}
      >
        {passageBg && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${passageBg}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0.85) 100%)',
              }}
            />
          </>
        )}
        <p
          className="display-s"
          style={{
            position: 'relative',
            zIndex: 1,
            fontStyle: 'italic',
            maxWidth: '820px',
            lineHeight: 1.5,
          }}
        >
          "{data.passage}"
        </p>
      </section>

      <hr className="hairline-centered hairline-animated" />

      {/* SECTION C — "Craft / Structure": sticky-scroll editorial row */}
      {data.craft && (
        <section style={{ backgroundColor: 'var(--void-black)' }}>
          <div style={{ display: 'flex', position: 'relative' }} className="craft-section-container">
            <div
              style={{
                width: '50%',
                position: 'sticky',
                top: '128px',
                height: 'calc(100vh - 160px)',
                overflow: 'hidden',
              }}
              className="craft-sticky-img-col"
            >
              {craftImage && (
                <img
                  src={craftImage}
                  alt={`${data.name} — craft detail`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div
              style={{
                width: '50%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '120px 80px',
                gap: '24px',
              }}
              className="craft-details-col"
            >
              <span className="ui-text reveal" style={{ fontSize: '11px' }}>Craft / Structure</span>
              <p className="body-l reveal reveal-delay-1" style={{ color: 'var(--bone-white)' }}>
                {data.craft}
              </p>
              <span className="body-s reveal reveal-delay-2">
                {data.num && `№ ${data.num} — `}Made to order. Delivered in 14–21 days.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* SECTION D — Gallery of additional uploaded images */}
      {galleryImages.length > 0 && (
        <section
          style={{
            backgroundColor: 'var(--void-black)',
            padding: '80px var(--grid-margin-desktop)',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}
          className="supporting-images-sec"
        >
          <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span className="ui-text" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>In Detail</span>
            <hr
              className="hairline-animated"
              style={{ flex: 1, height: '1px', border: 'none', backgroundColor: 'var(--cold-silver)', opacity: 0.4, margin: 0 }}
            />
          </div>

          <DynamicFrameGrid images={galleryImages} />
        </section>
      )}

      {/* SECTION F — Footer link back to caste */}
      <section
        style={{
          padding: '120px 24px',
          textAlign: 'center',
          backgroundColor: 'var(--void-black)',
        }}
      >
        <hr className="hairline-centered hairline-animated" style={{ marginBottom: '40px' }} />
        <Link to={data.castePath} className="underlined-link silver-hover" style={{ fontSize: '20px' }}>
          Part of the {data.caste.toLowerCase().replace('the ', '')}. Chapter VII of the Codex. Read →
        </Link>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .product-page-container {
            flex-direction: column !important;
          }
          .product-sticky-img-col {
            width: 100% !important;
            height: 50vh !important;
            position: relative !important;
            top: auto !important;
          }
          .product-details-col {
            width: 100% !important;
            padding: 40px 24px !important;
            gap: 24px !important;
          }
          .passage-section {
            padding: 60px 24px !important;
            min-height: 60vh !important;
          }
          .craft-section-container {
            flex-direction: column !important;
          }
          .craft-sticky-img-col {
            width: 100% !important;
            height: 50vh !important;
            position: relative !important;
            top: auto !important;
          }
          .craft-details-col {
            width: 100% !important;
            padding: 40px 24px !important;
          }
          .supporting-images-sec {
            padding: 40px 24px !important;
            gap: 24px !important;
          }
          .frame-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: none !important;
            height: auto !important;
            gap: 24px !important;
          }
          .frame-grid > div {
            height: 50vh !important;
          }
        }
      `}} />

    </div>
  );
}
