import { NavLink } from 'react-router-dom';

export const Placeholder = ({ children }) => <span className="cc-placeholder">{children}</span>;

const CARE = [['/shipping', 'Shipping'], ['/returns', 'Returns'], ['/size-care', 'Size & Care'], ['/contact', 'Contact']];
const LEGAL = [['/privacy', 'Privacy'], ['/terms', 'Terms']];

export function CareNav() {
  return <nav className="cc-nav" aria-label="Client care and legal">
    <span className="cc-nav__label">Client care</span>
    {CARE.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
    <span className="cc-nav__divider" aria-hidden="true" />
    {LEGAL.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
  </nav>;
}

export function Hero({ eyebrow, title, image, alt, wide = false, children, aside }) {
  return <section className={wide ? 'cc-hero cc-hero--wide' : 'cc-hero'} aria-labelledby="page-title">
    <div className="cc-hero__text">
      <div className="cc-hero__copy">
        <span className="cc-eyebrow">{eyebrow}</span>
        <h1 id="page-title" className="cc-title">{title}</h1>
        {children}
      </div>
      {aside}
    </div>
    {image && <figure className="cc-hero__figure"><img src={image} alt={alt} /></figure>}
  </section>;
}

export function Section({ id, number, title, lead, flush = false, children }) {
  return <section id={id} className={flush ? 'cc-section cc-section--flush' : 'cc-section'} aria-labelledby={`${id}-title`}>
    <div className="cc-section__head">
      <span className="cc-num">{number}</span>
      <h2 id={`${id}-title`} className="cc-h2">{title}</h2>
      {lead && <p className="cc-lead">{lead}</p>}
    </div>
    <div className="cc-section__body">{children}</div>
  </section>;
}

export function Facts({ label, items }) {
  return <section className="cc-facts" aria-label={label}>
    {items.map(([eyebrow, value, text]) => <div className="cc-fact" key={eyebrow}>
      <span className="cc-label">{eyebrow}</span>
      <p className="cc-fact__value">{value}</p>
      <p className="cc-text">{text}</p>
    </div>)}
  </section>;
}

export function Steps({ items, stack = false }) {
  return <ol className={stack ? 'cc-steps cc-steps--stack' : 'cc-steps'}>
    {items.map(([title, text], index) => <li className="cc-step" key={title}>
      <span className="cc-badge" aria-hidden="true">{index + 1}</span>
      <div><h3 className="cc-h3">{title}</h3><p className="cc-text">{text}</p></div>
    </li>)}
  </ol>;
}

export function Contents({ items }) {
  return <nav className="cc-toc" aria-label="Contents">
    <span className="cc-label">Contents</span>
    <ol>{items.map(([id, label], index) => <li key={id}><a href={`#${id}`}><span>{index + 1}</span>{label}</a></li>)}</ol>
  </nav>;
}

export function Summary({ items }) {
  return <aside className="cc-summary" aria-label="In short">
    <span className="cc-label">In short</span>
    <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
  </aside>;
}
