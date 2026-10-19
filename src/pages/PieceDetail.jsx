import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AppContext } from '../context/app-context';
import { publicRead, mediaUrl } from '../lib/supabase';
import Seo from '../components/Seo';
import ProductGallery, { ProductDialog, ProductImage } from '../components/ProductGallery';
import ProductDetailGrid from '../components/ProductDetailGrid';
import { shapeProduct } from '../lib/products';
import './piece-detail.css';

const formatPrice = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function PieceDetail() {
  const { pieceId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setProduct(null);
    async function loadProduct() {
      try {
        const [[data]] = await publicRead(`piece/${encodeURIComponent(pieceId)}`);
        if (active && data) setProduct(shapeProduct(data, mediaUrl));
      } catch {
        if (active) setError('This garment could not be opened. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProduct();
    return () => { active = false; };
  }, [pieceId, attempt]);

  if (loading) return <div className="piece-page" aria-busy="true" aria-label="Loading garment">
    <div className="piece-loading"><div className="skeleton" /><div><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div></div>
  </div>;

  if (!product) return <div className="piece-page piece-empty">
    <Seo title={error ? 'Garment Unavailable' : 'Garment Not Found'} noIndex />
    <h1>{error ? 'Unable to open this garment' : 'Garment not found'}</h1>
    <p role={error ? 'alert' : undefined}>{error || 'This piece is not currently available in the store.'}</p>
    {error && <button className="piece-claim" onClick={() => setAttempt(value => value + 1)}>Try again</button>}
    <Link to="/store">Return to the store →</Link>
  </div>;

  return <PieceDetailView key={product.id} product={product} />;
}

// Draws a garment from shaped data; the admin's live preview renders it with unsaved changes.
export function PieceDetailView({ product }) {
  const { addToCart, setIsCartOpen, isCartOpen } = useContext(AppContext);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeNotice, setSizeNotice] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const sizeRef = useRef(null);
  const available = product.sizes.some(size => size.in_stock);
  const price = formatPrice(product.price);
  const passage = product.passage?.trim().replace(/^"|"$/g, '') || '';
  const summary = passage.length > 180 ? `${passage.slice(0, 180).replace(/\s+\S*$/, '')}…` : passage;
  const craftLines = (product.craft || '').split(/\s+(?=(?:Details|Fit|Colour|Color|Material|Branding|Wash Care|Ironing|Returns):?\s)/i).filter(Boolean);

  function claim() {
    if (!available) return;
    if (!selectedSize || !product.sizes.some(size => size.size === selectedSize && size.in_stock)) {
      setSizeNotice('Choose your size to continue.');
      sizeRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
      sizeRef.current?.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
      return;
    }
    addToCart({ id: product.id, name: product.name, price: product.price, size: selectedSize, caste: product.caste.toUpperCase(), image: product.images[0]?.src });
    setIsCartOpen(true);
  }

  const claimLabel = !available ? 'Currently unavailable' : selectedSize ? `Claim garment — ${selectedSize} →` : 'Select a size to claim →';

  return <div className="piece-page">
    <Seo title={product.name} description={`${product.name} by Gauddly. Made to order in Delhi. Dispatch in 14–21 days.`} image={product.images[0]?.src} />
    <nav className="piece-breadcrumb" aria-label="Breadcrumb">
      <Link to="/store">Store</Link><span aria-hidden="true">/</span><Link to={product.castePath}>{product.caste}</Link><span aria-hidden="true">/</span><span aria-current="page">{product.name}</span>
    </nav>

    <div className="piece-layout">
      <ProductGallery images={product.images} video={product.video} name={product.name} />
      <section className="piece-purchase" aria-label="Garment information">
        <div className="piece-kicker">{product.caste}{product.num && ` · № ${product.num}`}</div>
        <h1>{product.name}</h1>
        <p className="piece-price">{price}</p>
        {summary && <p className="piece-summary">{summary}</p>}

        <div className="piece-size-heading"><span>Select size</span><button className="piece-text-button" onClick={() => setGuideOpen(true)}>Size guide ↗</button></div>
        <div ref={sizeRef} className="piece-sizes" role="group" aria-label="Select size" aria-describedby="piece-size-notice">
          {product.sizes.map(size => <button key={size.size} disabled={!size.in_stock} aria-pressed={selectedSize === size.size} aria-label={`Size ${size.size}${size.in_stock ? '' : ' — unavailable'}`} onClick={() => { setSelectedSize(size.size); setSizeNotice(''); }}>{size.size}</button>)}
        </div>
        <p id="piece-size-notice" className="piece-size-notice" role="status">{!available ? 'This garment is currently unavailable in all sizes.' : sizeNotice}</p>
        <button className="piece-claim" disabled={!available} onClick={claim}>{claimLabel}</button>
        <div className="piece-order-note"><p>Made to order in Delhi · Dispatch in 14–21 days.</p><Link to="/returns">Review returns & exchanges ↗</Link></div>

        <div className="piece-accordions">
          <details><summary>Fit & sizing</summary><div><p>Check the garment details and your measurements before selecting a size. For advice on this piece, contact our studio.</p><button className="piece-text-button" onClick={() => setGuideOpen(true)}>Open size guide ↗</button></div></details>
          <details><summary>Garment details & care</summary><div>{craftLines.length ? craftLines.map((line, index) => <p key={index}>{line}</p>) : <p>Contact our studio for fabric and care information for this garment.</p>}</div></details>
          <details><summary>Shipping & returns</summary><div><p>Made to order in Delhi, with dispatch in 14–21 days. Delivery time after dispatch varies by destination.</p><p>Please review the return conditions before placing your claim.</p><div className="piece-policy-links"><Link to="/shipping">Shipping policy ↗</Link><Link to="/returns">Returns & exchanges ↗</Link></div></div></details>
        </div>
        <p className="piece-help">Questions about fit? <a href={`mailto:contact@gauddly.com?subject=${encodeURIComponent(`Fit advice: ${product.name}`)}`}>Contact the studio ↗</a></p>
      </section>
    </div>

    {(passage || product.images.length > 1) && <section className="piece-story" aria-labelledby="piece-story-title">
      <div><span className="piece-kicker">A closer look</span><h2 id="piece-story-title">The details</h2>{passage && <p>{passage}</p>}<Link to={product.castePath}>Explore {product.caste} ↗</Link></div>
      {product.images.length > 1 && <ProductImage image={product.images[1]} />}
    </section>}
    <ProductDetailGrid images={product.video ? product.images : product.images.slice(1)} />
    <div className="piece-back"><Link to="/store">← All garments</Link><Link to={product.castePath}>{product.caste} ↗</Link></div>

    {!isCartOpen && !guideOpen && createPortal(<div className="piece-mobile-claim" aria-label="Quick garment selection"><div><span>{price}</span><small>{selectedSize ? `Size ${selectedSize}` : 'Choose your size'}</small></div><button className="piece-claim" onClick={claim} disabled={!available}>{!available ? 'Unavailable' : selectedSize ? 'Claim garment →' : 'Select size →'}</button></div>, document.body)}

    {guideOpen && <ProductDialog title="Size guide" onDismiss={() => setGuideOpen(false)}>
      <div className="piece-size-guide"><p className="piece-kicker">{product.name}</p><p>Check your measurements before choosing a size. Garment-specific measurements are available from our studio.</p><dl><dt>Chest</dt><dd>Measure around the fullest part, keeping the tape level.</dd><dt>Waist</dt><dd>Measure around your natural waist without pulling the tape tight.</dd><dt>Seat</dt><dd>Measure around the fullest part of your hips and seat.</dd></dl><p>Send your measurements and preferred fit to <a href={`mailto:contact@gauddly.com?subject=${encodeURIComponent(`Size guide: ${product.name}`)}`}>contact@gauddly.com</a>.</p><Link to="/size-care">Full size & care guide ↗</Link></div>
    </ProductDialog>}
  </div>;
}
