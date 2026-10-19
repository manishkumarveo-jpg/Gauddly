import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl, supabase } from '../lib/supabase';
import { assetKey, chooseProducts, homeLink } from '../lib/homepage';
import './home.css';

const price = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
const productImage = p => [...(p?.product_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.r2_key;
const productLink = p => `/the-${p.caste_id}/${p.id}`;
const url = value => mediaUrl(assetKey(value));

function Still({ section, fallback, eager = false, field = 'image' }) {
  const source = url(section.image || fallback);
  const [failedSource, setFailedSource] = useState(null);
  return <picture className="home-media" data-hp-field={field}>
    {section.mobileImage && failedSource !== source && <source media="(max-width: 640px)" srcSet={url(section.mobileImage)} />}
    {source && failedSource !== source ? <img src={source} alt={section.alt || ''} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} decoding="async" onError={() => setFailedSource(source)} style={{ objectPosition: `${section.focalX ?? 50}% ${section.focalY ?? 50}%` }} /> : <span className="home-media-empty"><span aria-hidden="true">G</span><small>{section.alt || 'The Sanctum'}</small></span>}
  </picture>;
}
function Heading({ section }) {
  return <header className="home-section-heading"><span className="ui-text" data-hp-field="label">{section.label}</span><h2 data-hp-field="title">{section.title}</h2>{section.body && <p data-hp-field="body">{section.body}</p>}</header>;
}
function Cta({ section, href }) { return <Link className="home-cta" data-hp-field="cta" to={homeLink(href || section.href)}>{section.cta || 'Explore'} <span aria-hidden="true">→</span></Link>; }

function Hero({ section, fallback, preview }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [videoSource, setVideoSource] = useState('');
  const requestedSource = url(window.matchMedia('(max-width: 640px)').matches && section.mobileVideo ? section.mobileVideo : section.video);
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 640px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer;
    const update = () => {
      clearTimeout(timer);
      setVideoSource('');
      const connection = navigator.connection;
      if (preview || mobile.matches || reduce.matches || connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType)) return;
      // Let the first screen and its poster load before competing for bandwidth.
      timer = setTimeout(() => setVideoSource(url(section.video)), 2500);
    };
    update();
    mobile.addEventListener('change', update); reduce.addEventListener('change', update);
    return () => { clearTimeout(timer); mobile.removeEventListener('change', update); reduce.removeEventListener('change', update); };
  }, [section.video, section.mobileVideo, preview]);
  return <section className="home-hero" data-hp-section="hero">
    <Still section={{ ...section, image: section.poster || section.image }} fallback={fallback} field="poster" eager />
    {videoSource && <video key={videoSource} ref={videoRef} src={videoSource} preload="none" poster={url(section.poster || section.image || fallback)} autoPlay muted loop playsInline onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={e => { e.currentTarget.style.display = 'none'; setPlaying(false); }} />}
    <div className="home-hero-shade" />
    <div className="home-hero-copy"><span className="ui-text" data-hp-field="label">{section.label}</span><h1 data-hp-field="title">{section.title}</h1><p data-hp-field="body">{section.body}</p><Cta section={section} /></div>
    <div className="home-hero-bottom"><span>GAUDDLY / DELHI</span><span>SCROLL TO DISCOVER ↓</span>{(videoSource || requestedSource) && <button data-hp-field="video" onClick={() => { if (!videoSource) { setVideoSource(requestedSource); return; } const v = videoRef.current; if (v) { if (v.paused) v.play().catch(() => {}); else v.pause(); } }}>{playing ? 'Pause film' : 'Play film'}</button>}</div>
  </section>;
}

function Featured({ section, products, loading }) {
  const selected = chooseProducts(products, section.productIds);
  const [index, setIndex] = useState(0);
  const product = selected[index % (selected.length || 1)];
  if (!product) return <section className="home-section home-empty" data-hp-section="featured"><Heading section={section} /><p>{loading ? 'Gathering the garments…' : 'Discover the current collection.'}</p><Link className="home-cta" to="/store">Explore the store →</Link></section>;
  return <section className="home-featured" data-hp-section="featured">
    <Link className="home-featured-image" to={productLink(product)} aria-label={`View ${product.name}`}><Still section={section} fallback={productImage(product)} /></Link>
    <div className="home-featured-copy"><span className="ui-text" data-hp-field="label">{section.label}</span><h2 data-hp-field="productIds">{product.name}</h2><span className="home-price" data-hp-field="productIds">{price(product.price)}</span><p data-hp-field="body">{product.passage || section.body}</p><Cta section={section} href={productLink(product)} /><div className="home-slider-controls"><span>{String(index % selected.length + 1).padStart(2, '0')} / {String(selected.length).padStart(2, '0')}</span><div><button disabled={selected.length < 2} aria-label="Previous featured garment" onClick={() => setIndex(n => (n + selected.length - 1) % selected.length)}>←</button><button disabled={selected.length < 2} aria-label="Next featured garment" onClick={() => setIndex(n => (n + 1) % selected.length)}>→</button></div></div></div>
  </section>;
}

function Film({ section, episodes }) {
  const [open, setOpen] = useState(false);
  const episode = section.episodeId ? episodes.find(e => e.id === section.episodeId) : episodes[0];
  const src = url(section.video || episode?.video_r2_key);
  return <section className="home-film" data-hp-section="film">
    {open && src ? <div className="home-film-player"><button onClick={() => setOpen(false)}>Close film ×</button><video src={src} poster={url(section.poster || episode?.still_r2_key)} controls autoPlay playsInline /></div> : <>
      <Still section={{ ...section, image: section.poster || section.image }} fallback={episode?.still_r2_key} field="poster" />
      <div className="home-film-shade" /><div className="home-film-copy"><span className="ui-text" data-hp-field="label">{section.label}</span><h2 data-hp-field="title">{section.title}</h2><p data-hp-field="episodeId">{episode?.title || section.body}</p>{src ? <button className="home-cta" data-hp-field="video" onClick={() => setOpen(true)}>Play film <span aria-hidden="true">▷</span></button> : <Cta section={section} />}</div>
    </>}
  </section>;
}

function Waitlist({ section, preview }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async event => {
    event.preventDefault();
    if (preview || busy) return;
    setBusy(true); setStatus('');
    try {
      const { error } = await supabase.from('waitlist_signups').insert({ email: email.trim().toLowerCase() });
      if (error && error.code !== '23505') throw error;
      setDone(true); setStatus('You are on the list. You will be told.');
    } catch { setStatus('We could not save your address. Please try again.'); }
    finally { setBusy(false); }
  };
  return <section className="home-section home-waitlist" data-hp-section="waitlist"><Still section={section} /><div className="home-waitlist-content"><Heading section={section} />{!done && <form onSubmit={submit} data-hp-field="cta"><label htmlFor={preview ? 'preview-home-email' : 'home-email'} className="sr-only">Email address</label><input id={preview ? 'preview-home-email' : 'home-email'} type="email" autoComplete="email" required placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} /><button disabled={busy || preview}>{busy ? 'Joining…' : section.cta} →</button></form>}<p role="status">{preview ? 'Preview — signup is disabled.' : status}</p><Link className="home-privacy" to="/privacy">How we use your information</Link></div></section>;
}

export default function HomeExperience({ content, catalog, loading = false, preview = false }) {
  const { products = [], castes = [], episodes = [] } = catalog;
  const fallback = castes[0]?.hero_r2_key || productImage(products[0]);
  return <div className="home-experience">{content.sections.filter(s => s.enabled !== false).map(section => {
    switch (section.id) {
      case 'hero': return <Hero key={section.id} section={section} fallback={fallback} preview={preview} />;
      case 'manifesto': return <section key={section.id} className="home-manifesto" data-hp-section="manifesto"><Heading section={section} /><Cta section={section} /></section>;
      case 'featured': return <Featured key={section.id} section={section} products={products} loading={loading} />;
      case 'castes': return <section key={section.id} className="home-section" data-hp-section="castes"><Heading section={section} /><div className="home-castes">{castes.map((c, index) => { const override = section.cards?.find(card => card.id === c.id) || {}; return <Link className="home-caste" key={c.id} to={`/the-${c.id}`} data-hp-field="cards"><Still section={override} fallback={c.hero_r2_key} field="cards" /><div><span className="ui-text">0{index + 1}</span><h3>{override.title || c.name}</h3><p>{override.body || ''}</p><span aria-hidden="true">↗</span></div></Link>; })}</div>{!castes.length && <p>{loading ? 'Opening the rooms…' : 'New rooms will open soon.'}</p>}</section>;
      case 'craft': return <section key={section.id} className="home-craft home-section" data-hp-section="craft"><div><Heading section={section} /><div className="home-facts" data-hp-field="facts">{section.facts?.map((fact, i) => <div key={i}><span>0{i + 1}</span><p>{fact}</p></div>)}</div><Cta section={section} /></div><Still section={section} fallback={productImage(products[1]) || fallback} /></section>;
      case 'film': return <Film key={`${section.id}-${section.episodeId}-${section.video}`} section={section} episodes={episodes} />;
      case 'quote': return <section key={section.id} className={`home-section home-quote ${section.image ? 'has-image' : ''}`} data-hp-section="quote">{section.image && <Still section={section} />}<div><span className="ui-text" data-hp-field="label">{section.label}</span><blockquote data-hp-field="body">{section.body}</blockquote><h2 data-hp-field="title">{section.title}</h2><Cta section={section} /></div></section>;
      case 'archive': { const items = chooseProducts(products, section.productIds, true); return <section key={section.id} className="home-section home-archive" data-hp-section="archive"><div className="home-archive-heading"><Heading section={section} /><Cta section={section} /></div><div className="home-archive-grid" data-hp-field="productIds">{items.map(p => <Link key={p.id} to={productLink(p)}><Still section={{ alt: p.name }} fallback={productImage(p)} field="productIds" /><h3>{p.name}</h3><span>{price(p.price)}</span></Link>)}</div>{!items.length && <p>{loading ? 'Opening the archive…' : 'The next chapter of the archive is being prepared.'}</p>}</section>; }
      case 'waitlist': return <Waitlist key={section.id} section={section} preview={preview} />;
      default: return null;
    }
  })}</div>;
}
