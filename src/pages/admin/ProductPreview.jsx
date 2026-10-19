import { useEffect, useState } from 'react';
import { PieceDetailView } from '../PieceDetail';

// The product editor that opened this page: the parent when framed, the opener when in its own tab.
// It is the only source of content; nothing here reads unsaved data itself.
const editorWindow = () => (window.parent !== window ? window.parent : window.opener);

export default function ProductPreview() {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== window.location.origin || event.source !== editorWindow()) return;
      if (event.data?.type === 'pp-product') setProduct(event.data.product);
    };
    // Links and "Claim" are paused so previewing never navigates or fills the real cart; the gallery and sizes still work.
    const pause = event => {
      if (!event.target.closest?.('a, .piece-claim')) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener('message', onMessage);
    window.addEventListener('click', pause, true);
    editorWindow()?.postMessage({ type: 'pp-ready' }, window.location.origin);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('click', pause, true);
    };
  }, []);

  if (!product) return <p className="piece-page" role="status" style={{ padding: '120px 24px', textAlign: 'center' }}>{editorWindow() ? 'Loading preview…' : 'Open this preview from the product editor.'}</p>;
  // Remount when the photo list changes so the gallery starts from the cover.
  return <PieceDetailView key={product.images.map(image => image.src).join('|')} product={product} />;
}
