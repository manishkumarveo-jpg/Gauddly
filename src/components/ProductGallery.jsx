import { useEffect, useId, useRef, useState } from 'react';

export function ProductImage({ image, eager = false }) {
  const [failedSource, setFailedSource] = useState(null);
  if (!image?.src || failedSource === image.src) return <div className="piece-image-empty"><span aria-hidden="true">G</span><small>Photograph unavailable</small></div>;
  return <img src={image.src} alt={image.alt || ''} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" onError={() => setFailedSource(image.src)} />;
}

export function ProductDialog({ title, children, onDismiss, wide = false }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(document.activeElement);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = previousFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus?.({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialogRef} className={`piece-dialog${wide ? ' piece-dialog-wide' : ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onDismiss(); }}>
    <div className="piece-dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" autoFocus onClick={onDismiss} aria-label={`Close ${title.toLowerCase()}`}>Close ×</button></div>
    {children}
  </dialog>;
}

export default function ProductGallery({ images, video, name }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [magnified, setMagnified] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoRequested, setVideoRequested] = useState(false);
  const touchRef = useRef(null);
  const thumbnailRef = useRef(null);
  const count = images.length + (video ? 1 : 0);
  const isVideo = Boolean(video) && activeIndex === images.length;
  const activeImage = images[activeIndex];

  function select(index) { setActiveIndex(index); setVideoFailed(false); setMagnified(false); setVideoRequested(index === images.length); }
  function step(direction) { select((activeIndex + direction + count) % count); }

  useEffect(() => {
    const button = thumbnailRef.current?.children[activeIndex];
    if (button && thumbnailRef.current) thumbnailRef.current.scrollLeft = button.offsetLeft - thumbnailRef.current.offsetLeft;
  }, [activeIndex]);

  return <section className="piece-gallery" aria-label={`${name} gallery`}>
    <div className="piece-gallery-main" onTouchStart={event => {
      const touch = event.touches[0];
      touchRef.current = { x: touch.clientX, y: touch.clientY };
    }} onTouchEnd={event => {
      if (!touchRef.current || isVideo || count < 2) return;
      const touch = event.changedTouches[0];
      const horizontal = touch.clientX - touchRef.current.x;
      const vertical = touch.clientY - touchRef.current.y;
      if (Math.abs(horizontal) > 50 && Math.abs(horizontal) > Math.abs(vertical) * 1.5) step(horizontal < 0 ? 1 : -1);
      touchRef.current = null;
    }}>
      {isVideo ? !videoRequested ? <div className="piece-image-empty"><p>{name}</p><button onClick={() => setVideoRequested(true)}>Play garment film ▷</button></div> : videoFailed ? <div className="piece-image-empty"><p>This film could not load.</p><button onClick={() => setVideoFailed(false)}>Try again</button></div> : <video key={video} src={video} poster={images[0]?.src} controls autoPlay muted playsInline preload="none" onError={() => setVideoFailed(true)} aria-label={`${name} film`} /> : <>
        <button className="piece-gallery-open" disabled={!activeImage} aria-label={`Enlarge photograph ${activeIndex + 1}`} onClick={() => setZoomOpen(true)}><ProductImage image={activeImage} eager /><span>View larger ↗</span></button>
        {count > 1 && <div className="piece-gallery-arrows"><button onClick={() => step(-1)} aria-label="Previous photograph">←</button><button onClick={() => step(1)} aria-label="Next photograph">→</button></div>}
      </>}
    </div>
    <div className="piece-gallery-meta"><span aria-live="polite">{count ? `${String(activeIndex + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}${isVideo ? ' · Film' : ''}` : 'No photographs yet'}</span><span>{isVideo ? 'Film controls available' : 'Explore the garment'}</span></div>
    {count > 1 && <div ref={thumbnailRef} className="piece-thumbnails" role="group" aria-label="Choose garment view">
      {images.map((image, index) => <button key={`${image.src}-${index}`} aria-label={`View photograph ${index + 1}`} aria-pressed={activeIndex === index} onClick={() => select(index)}><ProductImage image={image} /></button>)}
      {video && <button className="piece-video-thumb" aria-label="Play garment film" aria-pressed={isVideo} onClick={() => select(images.length)}><span aria-hidden="true">▷</span><span>Play film</span></button>}
    </div>}
    {zoomOpen && activeImage && <ProductDialog title={`${name} — photograph ${activeIndex + 1}`} wide onDismiss={() => { setZoomOpen(false); setMagnified(false); }}>
      <div className="piece-zoom-controls"><button onClick={() => setMagnified(value => !value)}>{magnified ? 'Fit to screen' : 'Zoom in +'}</button>{images.length > 1 && <><button aria-label="Previous enlarged photograph" onClick={() => select((activeIndex + images.length - 1) % images.length)}>←</button><button aria-label="Next enlarged photograph" onClick={() => select((activeIndex + 1) % images.length)}>→</button></>}</div>
      <div className={`piece-zoom-image${magnified ? ' is-magnified' : ''}`}><ProductImage image={activeImage} eager /></div>
    </ProductDialog>}
  </section>;
}
