import { ICONS } from './icons';

export const Icon = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);


export function PageHeader({ title, intro, aside }) {
  return <div className="ac-header">
    <div>
      <h1 className="display-s">{title}</h1>
      <p className="body-l">{intro}</p>
    </div>
    {aside}
  </div>;
}

export function Notice({ icon, title, text, action }) {
  return <div className="ac-secure">
    <Icon>{ICONS[icon]}</Icon>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px' }}>{title}</div>
      <div className="body-s" style={{ fontSize: '13px' }}>{text}</div>
    </div>
    {action}
  </div>;
}
