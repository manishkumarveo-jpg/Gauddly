import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../../context/app-context';
import { supabase } from '../../lib/supabase';
import { readViews } from '../../lib/recently-viewed';
import { Icon, PageHeader } from './shared';
import { ICONS } from './icons';
import { formatPrice, firstImageUrl, productPath } from './format';

export default function WishlistView({ user }) {
  const { addToCart, setIsCartOpen } = useContext(AppContext);
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [sizes, setSizes] = useState({}); // product id -> chosen size
  const [notice, setNotice] = useState('');
  const recent = readViews();

  useEffect(() => {
    supabase
      .from('wishlist')
      .select('product_id, created_at, products(id, name, price, caste_id, is_published, product_images(r2_key, sort_order), product_sizes(size, in_stock))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setLoadError('Your wishlist could not be loaded. Please refresh to try again.');
        else setItems(data.filter((row) => row.products));
      });
  }, [user.id]);

  async function remove(productId) {
    const { error } = await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
    if (error) {
      setNotice('We could not remove that. Please try again.');
      return;
    }
    setItems((prev) => prev.filter((row) => row.product_id !== productId));
  }

  function add(product) {
    const size = sizes[product.id];
    if (!size) {
      setNotice(`Choose a size for ${product.name} first.`);
      return;
    }
    setNotice('');
    addToCart({ id: product.id, name: product.name, price: product.price, size, caste: product.caste_id.toUpperCase(), image: firstImageUrl(product.product_images) });
    setIsCartOpen(true);
  }

  return <>
    <PageHeader title="Your Wishlist" intro="Garments you’ve saved for later."
      aside={<span className="ac-label" style={{ whiteSpace: 'nowrap' }}>{items.length} saved</span>} />

    {loadError && <p className="ac-error" role="alert">{loadError}</p>}
    {notice && <p className="ac-error" role="status">{notice}</p>}

    {!loadError && items.length === 0 && (
      <div className="ac-empty">
        <div className="ac-round"><Icon size={28}>{ICONS.heart}</Icon></div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>Nothing saved yet</div>
        <p className="body-s">Tap “Save to wishlist” on any garment to keep it here.</p>
        <Link to="/store" className="ac-primary">Explore the store →</Link>
      </div>
    )}

    <div className="ac-wish-grid">
      {items.map(({ products: p }) => {
        const image = firstImageUrl(p.product_images);
        const inStock = (p.product_sizes || []).filter((s) => s.in_stock);
        const available = p.is_published && inStock.length > 0;
        return (
          <article key={p.id} className="ac-wish">
            <div className="ac-wish-img">
              {image && <Link to={productPath(p)} tabIndex={-1}><img src={image} alt="" loading="lazy" decoding="async" /></Link>}
              <button type="button" className="ac-heart" aria-label={`Remove ${p.name} from wishlist`} onClick={() => remove(p.id)}><Icon size={18}>{ICONS.heart}</Icon></button>
            </div>
            <Link to={productPath(p)}>{p.name}</Link>
            <div>{formatPrice(p.price)}</div>
            {available ? <>
              <label className="sr-only" htmlFor={`wish-size-${p.id}`}>Size for {p.name}</label>
              <select id={`wish-size-${p.id}`} className="ac-input ac-select-input" value={sizes[p.id] || ''} onChange={(e) => setSizes((s) => ({ ...s, [p.id]: e.target.value }))}>
                <option value="">Choose size</option>
                {inStock.map((s) => <option key={s.size} value={s.size}>{s.size}</option>)}
              </select>
              <button type="button" className="ac-btn" onClick={() => add(p)}>Add to cart</button>
            </> : <span className="ac-note">Currently unavailable</span>}
          </article>
        );
      })}
    </div>

    {recent.length > 0 && (
      <section aria-labelledby="ac-recent">
        <h2 id="ac-recent" className="ac-h2" style={{ marginBottom: '16px' }}>Recently viewed</h2>
        <div className="ac-recent">
          {recent.map((r) => (
            <Link key={r.id} to={r.path}>
              {r.image && <img src={r.image} alt="" loading="lazy" />}
              <span>{r.name}<br /><span className="ac-note">{formatPrice(r.price)}</span></span>
            </Link>
          ))}
        </div>
      </section>
    )}
  </>;
}
