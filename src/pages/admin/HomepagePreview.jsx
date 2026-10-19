import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import HomeExperience from '../../components/HomeExperience';
import { normalizeHome } from '../../lib/homepage';
import './homepage-editor.css';

// The homepage editor that opened this page: the parent when framed, the opener when in its own tab.
// It is the only source of content; nothing here reads unpublished data itself.
const editorWindow = () => (window.parent !== window ? window.parent : window.opener);
const post = message => editorWindow()?.postMessage(message, window.location.origin);
const NAV_HEIGHT = 64;
const fieldSelector = field => `[data-hp-field="${CSS.escape(field)}"]`;
const sectionSelector = section => `[data-hp-section="${CSS.escape(section)}"]`;

export default function HomepagePreview() {
  const [view, setView] = useState(null); // { content, catalog }
  const [focus, setFocus] = useState(null); // { section, field, label, scroll }
  const [tag, setTag] = useState(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== window.location.origin || event.source !== editorWindow()) return;
      const data = event.data || {};
      if (data.type === 'hp-draft') setView({ content: normalizeHome(data.content), catalog: data.catalog || {} });
      if (data.type === 'hp-focus') setFocus(data);
    };
    // Links, buttons and forms are paused: a click selects the matching field in the editor instead.
    const onClick = event => {
      event.preventDefault();
      event.stopPropagation();
      const root = event.target.closest?.('[data-hp-section]');
      if (root) post({ type: 'hp-select', section: root.dataset.hpSection, field: event.target.closest('[data-hp-field]')?.dataset.hpField || null });
    };
    const block = event => event.preventDefault();
    window.addEventListener('message', onMessage);
    window.addEventListener('click', onClick, true);
    window.addEventListener('submit', block, true);
    post({ type: 'hp-ready' });
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('submit', block, true);
    };
  }, []);

  // Outline the field being edited and label it, following layout changes as content loads.
  useLayoutEffect(() => {
    const root = view && focus?.section && document.querySelector(sectionSelector(focus.section));
    if (!root) { setTag(null); return undefined; }
    const fields = focus.field ? [...root.querySelectorAll(fieldSelector(focus.field))] : [];
    const marked = fields.length ? fields : [root];
    marked.forEach(el => el.classList.add('hp-focus'));
    const place = () => {
      const target = marked[0].getBoundingClientRect();
      const page = pageRef.current.getBoundingClientRect();
      setTag({ top: target.top - page.top, left: Math.max(8, target.left - page.left), label: focus.label });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(pageRef.current);
    return () => { observer.disconnect(); marked.forEach(el => el.classList.remove('hp-focus')); };
  }, [view, focus]);

  // Scroll only when the editor asks (picking a section, or focusing a field that is off screen), never while typing.
  const hasView = view !== null;
  useEffect(() => {
    if (!hasView || !focus?.scroll) return;
    const root = document.querySelector(sectionSelector(focus.section));
    const target = (focus.scroll === 'field' && focus.field && root?.querySelector(fieldSelector(focus.field))) || root;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (focus.scroll === 'field' && rect.top >= NAV_HEIGHT && rect.bottom <= window.innerHeight) return;
    const offset = focus.scroll === 'field' ? window.innerHeight / 3 : NAV_HEIGHT;
    window.scrollTo({ top: Math.max(0, rect.top + window.scrollY - offset), behavior: 'smooth' });
  }, [focus, hasView]);

  if (!view) return <p className="hp-preview-wait" role="status">{editorWindow() ? 'Loading preview…' : 'Open this preview from the homepage editor.'}</p>;
  return <div className="hp-preview-page" ref={pageRef}>
    <HomeExperience content={view.content} catalog={view.catalog} loading={!view.catalog.loaded} preview />
    {tag?.label && <span className="hp-preview-tag" style={{ top: tag.top, left: tag.left }} aria-hidden="true">Editing: {tag.label}</span>}
  </div>;
}
