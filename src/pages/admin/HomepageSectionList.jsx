import { useEffect, useRef, useState } from 'react';
import { SECTION_INFO, sectionSummary } from '../../lib/homepage';
import { EyeIcon, EyeOffIcon, GripIcon } from './Icons';

export default function HomepageSectionList({ sections, active, warnings, disabled, onSelect, onMove, onToggle }) {
  const [dragFrom, setDragFrom] = useState(null);
  const [dropAt, setDropAt] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [refocus, setRefocus] = useState(null);
  const buttons = useRef({});

  // Moving a row re-inserts its DOM node, which drops keyboard focus; put it back.
  useEffect(() => {
    if (!refocus) return;
    buttons.current[refocus]?.focus();
    setRefocus(null);
  }, [sections, refocus]);

  const move = (from, to) => {
    if (disabled || to < 0 || to >= sections.length || from === to) return;
    const name = SECTION_INFO[sections[from].id].name;
    onMove(from, to);
    setAnnouncement(`${name} moved to position ${to + 1} of ${sections.length}.`);
  };
  const endDrag = () => { setDragFrom(null); setDropAt(null); };

  return <nav className="hp-sections" aria-label="Homepage sections">
    <div className="hp-sections-head">
      <span className="hp-eyebrow">Page sections</span>
      <span className="hp-hint">Drag to reorder, or Alt + ↑ ↓</span>
    </div>
    <ol>
      {sections.map((section, index) => {
        const { name } = SECTION_INFO[section.id];
        const hidden = section.enabled === false;
        const warning = !hidden && warnings[section.id]?.[0];
        const dropClass = dropAt === index && dragFrom !== null && dragFrom !== index ? (dragFrom < index ? 'drop-after' : 'drop-before') : '';
        return <li
          key={section.id}
          className={['hp-section-row', active === section.id && 'is-active', hidden && 'is-hidden', dropClass].filter(Boolean).join(' ')}
          draggable={!disabled}
          onDragStart={event => { setDragFrom(index); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', section.id); }}
          onDragOver={event => { if (dragFrom === null) return; event.preventDefault(); setDropAt(index); }}
          onDrop={event => { event.preventDefault(); if (dragFrom !== null) move(dragFrom, index); endDrag(); }}
          onDragEnd={endDrag}
        >
          <GripIcon className="hp-grip" aria-hidden="true" />
          <button
            type="button"
            ref={el => { buttons.current[section.id] = el; }}
            className="hp-section-select"
            aria-current={active === section.id ? 'true' : undefined}
            aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
            onClick={() => onSelect(section.id)}
            onKeyDown={event => {
              if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
              event.preventDefault();
              setRefocus(section.id);
              move(index, index + (event.key === 'ArrowUp' ? -1 : 1));
            }}
          >
            <span className="hp-section-name">{name}</span>
            <span className={warning ? 'hp-section-meta is-warning' : 'hp-section-meta'}>{warning ? warning.message : sectionSummary(section)}</span>
          </button>
          <button
            type="button"
            className="hp-eye"
            aria-pressed={!hidden}
            aria-label={`${hidden ? 'Show' : 'Hide'} ${name} on the homepage`}
            title={hidden ? 'Hidden from visitors. Click to show.' : 'Shown to visitors. Click to hide.'}
            disabled={disabled}
            onClick={() => onToggle(section.id)}
          >
            {hidden ? <EyeOffIcon aria-hidden="true" width={18} height={18} /> : <EyeIcon aria-hidden="true" width={18} height={18} />}
          </button>
        </li>;
      })}
    </ol>
    <p className="sr-only" role="status">{announcement}</p>
  </nav>;
}
