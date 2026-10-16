import { useState } from 'react';
import { ProductImage } from './ProductGallery';

export default function ProductDetailGrid({ images }) {
  const [hovered, setHovered] = useState(null);
  const columns = Math.min(3, images.length);
  const rows = Math.ceil(images.length / columns);
  const tracks = (count, active) => Array.from({ length: count }, (_, index) => index === active ? '2.2fr' : '1fr').join(' ');

  if (!images.length) return null;

  return <section className="piece-detail-gallery" aria-label="More garment photographs">
    <div className="piece-detail-heading"><span className="piece-kicker">In Detail</span><hr /></div>
    <div className="piece-frame-grid" onMouseLeave={() => setHovered(null)} style={{ gridTemplateColumns: tracks(columns, hovered?.column), gridTemplateRows: tracks(rows, hovered?.row), height: `${rows * 48}vh` }}>
      {images.map((image, index) => <div key={`${image.src}-${index}`} className={hovered?.index === index ? 'is-hovered' : ''} onMouseEnter={() => {
        if (window.matchMedia('(min-width: 1025px) and (hover: hover) and (prefers-reduced-motion: no-preference)').matches) setHovered({ index, row: Math.floor(index / columns), column: index % columns });
      }}><ProductImage image={image} /></div>)}
    </div>
  </section>;
}
