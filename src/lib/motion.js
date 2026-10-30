// GSAP motion for the public pages. Only lazy page chunks import this file, so GSAP stays out of the main
// bundle. What keeps it smooth: tween only translate and opacity on anything holding a photo (scaling a
// layer from script makes Chrome re-rasterize its images every frame; measured on the store as 18 dropped
// frames per scroll), scale only flat colour layers, never tween an element that has its own CSS transition
// on the same property, reveal once, and do nothing at all when the visitor prefers reduced motion.
// The one filter tween is a heading's blur, once, on wide screens.
import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
// The mobile address bar showing and hiding resizes the viewport; don't recalculate every trigger for it.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap };

// Runs setup(element) only when motion is allowed. Everything it creates is reverted when deps change or
// the component unmounts. Runs before paint, so veils are in place before the first frame.
export function useMotion(ref, setup, deps) {
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => { setup(ref.current); });
    return () => mm.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Fog title: the letters rise out of the dark, and on wide screens the heading comes into focus.
// Give the heading key={its text} so React replaces it instead of editing text that SplitText has split.
export function fogTitle(heading) {
  if (!heading) return;
  SplitText.create(heading, {
    type: 'words,chars',
    autoSplit: true,
    // Long headings spread the same total stagger, so a sentence settles as fast as a single word
    onSplit: self => gsap.from(self.chars, { opacity: 0, yPercent: 40, duration: 1.1, ease: 'power3.out', stagger: Math.min(0.03, 0.9 / self.chars.length) }),
  });
  if (window.matchMedia('(min-width: 768px)').matches) {
    gsap.fromTo(heading, { filter: 'blur(10px)' }, { filter: 'blur(0px)', duration: 1.4, ease: 'power2.out', clearProps: 'filter' });
  }
}

// Veil reveal: the black <span class="veil"> inside each frame lifts as the frame scrolls into view. The veil
// is a flat colour, so scaling it is cheap; the photo underneath is never moved. Each frame reveals once.
// Frames are the scroll triggers, so pass non-sticky elements (a sticky element's measured position moves).
export function veilReveal(frames) {
  const items = gsap.utils.toArray(frames).filter(frame => frame.querySelector('.veil'));
  if (!items.length) return;
  gsap.set(items.map(frame => frame.querySelector('.veil')), { scaleY: 1 });
  ScrollTrigger.batch(items, {
    once: true,
    start: 'top 92%',
    onEnter: batch => gsap.to(batch.map(frame => frame.querySelector('.veil')), { scaleY: 0, duration: 1.1, ease: 'power4.inOut', stagger: 0.08 }),
  });
}
