import { useEffect, useRef, useState } from 'react';
import { ExternalIcon } from './Icons';

// Real browser window sizes, so the homepage's own breakpoints and full-height hero behave as they do for visitors.
const DEVICES = {
  desktop: { label: 'Desktop', width: 1440, height: 900, bezel: 2 },
  phone: { label: 'Phone', width: 390, height: 844, bezel: 24 },
};

// A live preview of a real site page, drawn at a real window size and scaled to fit its column.
// The page at `src` receives its content from the editor by postMessage.
export default function PreviewFrame({ frameRef, src, title, label = 'Live preview · your draft', hint = 'Click anything in the preview to edit it. Links and sign-up are paused.', device, onDeviceChange, onOpenTab }) {
  const boxRef = useRef(null);
  const [box, setBox] = useState(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setBox(entry.contentRect));
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);
  const size = DEVICES[device];
  const scale = box ? Math.max(0.1, Math.min(1, (box.width - size.bezel) / size.width, (box.height - size.bezel) / size.height)) : 0;

  return <section className="hp-preview" aria-label="Live preview">
    <div className="hp-preview-head">
      <div className="hp-preview-title">
        <span className="hp-eyebrow">{label}</span>
        <span className="hp-hint">{size.width} px {size.label.toLowerCase()}{scale && scale < 1 ? `, shown at ${Math.round(scale * 100)}%` : ''}</span>
      </div>
      <div className="hp-preview-tools">
        <div className="hp-segmented" role="group" aria-label="Preview size">
          {Object.entries(DEVICES).map(([id, d]) => <button key={id} type="button" aria-pressed={device === id} onClick={() => onDeviceChange(id)}>{d.label}</button>)}
        </div>
        <button type="button" className="hp-btn hp-icon-btn" onClick={onOpenTab} aria-label="Open the preview full size in a new tab" title="Open full size in a new tab"><ExternalIcon aria-hidden="true" width={18} height={18} /></button>
      </div>
    </div>
    <div className="hp-preview-box" ref={boxRef}>
      <div className={`hp-device hp-device-${device}`} style={{ width: size.width * scale, height: size.height * scale }}>
        <iframe ref={frameRef} title={title} src={src} style={{ width: size.width, height: size.height, transform: `scale(${scale})` }} />
      </div>
    </div>
    {hint && <p className="hp-hint">{hint}</p>}
  </section>;
}
