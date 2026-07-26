import React, { useState, useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { supabase, mediaUrl } from '../lib/supabase';

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
      .select('id, name, price, passage, craft, caste_id, castes(name), product_images(r2_key, sort_order), product_sizes(size, in_stock)')
      .eq('id', pieceId)
      .single()
      .then(({ data: product }) => {
        if (product) {
          const casteName = product.castes?.name?.toUpperCase() || '';
          setData({
            id: product.id,
            name: product.name,
            caste: casteName,
            castePath: product.caste_id === 'old-world' ? '/old-world' : `/the-${product.caste_id}`,
            price: product.price,
            passage: product.passage,
            craft: product.craft,
            image: mediaUrl(product.product_images?.[0]?.r2_key),
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
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', overflowX: 'hidden' }} className="fade-in">
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
          <img 
            src={data.image} 
            alt={data.name} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
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
            <span className="ui-text" style={{ fontSize: '11px', color: 'var(--ash-grey)' }}>
              {data.caste}
            </span>
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
              onClick={handleClaim}
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

      {/* SECTION C — Supporting Images (Detail shots, back view, fabric detail) */}
      <section 
        style={{ 
          backgroundColor: 'var(--void-black)', 
          padding: '80px var(--grid-margin-desktop)',
          display: 'flex',
          flexDirection: 'column',
          gap: '80px',
        }}
        className="supporting-images-sec"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }} className="supporting-grid">
          <div style={{ height: '70vh', overflow: 'hidden', backgroundColor: '#151515' }}>
            <img 
              src={data.image} 
              alt="Detail A" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.1) brightness(0.9)', transform: 'scale(1.2) translateY(5%)' }}
            />
          </div>
          <div style={{ height: '70vh', overflow: 'hidden', backgroundColor: '#151515' }}>
            <img 
              src={data.image} 
              alt="Detail B" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.2)' }}
            />
          </div>
        </div>

        <div style={{ height: '90vh', overflow: 'hidden', backgroundColor: '#151515' }} className="full-width-supporting">
          <img 
            src={data.image} 
            alt="Detail Full" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.8) contrast(1.15)', transform: 'scale(1.05)' }}
          />
        </div>
      </section>

      {/* SECTION D — Footer link back to caste */}
      <section 
        style={{ 
          padding: '120px 24px', 
          textAlign: 'center', 
          backgroundColor: 'var(--void-black)',
          borderTop: '1px solid rgba(200, 204, 209, 0.1)'
        }}
      >
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
          .supporting-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .supporting-images-sec {
            padding: 40px 24px !important;
            gap: 24px !important;
          }
          .supporting-grid div, .full-width-supporting {
            height: 50vh !important;
          }
        }
      `}} />

    </div>
  );
}
