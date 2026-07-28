import { useEffect, useRef } from 'react';

/**
 * useScrollReveal
 *
 * Applies `.revealed` class to any element with `.reveal` inside a container ref.
 * Also draws `.hairline-animated` elements when they enter the viewport.
 *
 * Usage:
 *   const ref = useScrollReveal();
 *   <section ref={ref}>
 *     <h2 className="reveal">...</h2>
 *     <hr className="hairline hairline-animated" />
 *   </section>
 */
export default function useScrollReveal(options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const { threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = options;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold, rootMargin }
    );

    const container = containerRef.current || document;
    const targets = container.querySelectorAll
      ? container.querySelectorAll('.reveal, .hairline-animated')
      : [];

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return containerRef;
}
