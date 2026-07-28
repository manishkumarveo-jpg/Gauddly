import React, { useEffect, useRef, useState } from 'react';

/**
 * SilverDropCursor
 * A luxury custom cursor:
 *  - Small 4px inner dot that tracks precisely
 *  - Larger 32px outer ring that follows with a 100ms lerp lag
 *  - On interactive hover: ring expands to 56px and inverts color
 *  - On image hover: ring shows "VIEW" label
 *  - Magnetic pull: interactive elements subtly shift toward cursor
 */
export default function SilverDropCursor() {
  const dotRef   = useRef(null);
  const ringRef  = useRef(null);
  const labelRef = useRef(null);

  // Lerp positions
  const mouse  = useRef({ x: -200, y: -200 });
  const ring   = useRef({ x: -200, y: -200 });
  const rafRef = useRef(null);

  const [isHoveringImage, setIsHoveringImage]         = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);

  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t;

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      // Move dot immediately
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 2}px, ${e.clientY - 2}px)`;
      }
    };

    const isInteractive = (el) => {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return (
        tag === 'a' ||
        tag === 'button' ||
        tag === 'select' ||
        tag === 'input' ||
        tag === 'textarea' ||
        el.getAttribute?.('role') === 'button' ||
        el.closest?.('a, button, [role="button"]')
      );
    };

    const isImage = (el) => {
      if (!el) return false;
      return el.tagName?.toLowerCase() === 'img' || el.closest?.('.caste-tile, .piece-image-wrap');
    };

    const onEnter = (e) => {
      setIsHoveringInteractive(isInteractive(e.target));
      setIsHoveringImage(isImage(e.target));
    };

    const animate = () => {
      // Ring follows mouse with lerp (lazy trailing)
      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.12);
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.12);

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - 16}px, ${ring.current.y - 16}px)`;
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate(${ring.current.x - 16}px, ${ring.current.y - 16}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    // Magnetic pull on buttons/links
    const magneticEls = [];
    const applyMagnetic = () => {
      document.querySelectorAll('button, a').forEach((el) => {
        const onMEnter = (e) => {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) * 0.12;
          const dy = (e.clientY - cy) * 0.12;
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.style.transition = 'transform 0.2s ease';
        };
        const onMLeave = () => {
          el.style.transform = '';
          el.style.transition = 'transform 0.4s ease';
        };
        el.addEventListener('mousemove', onMEnter);
        el.addEventListener('mouseleave', onMLeave);
        magneticEls.push({ el, onMEnter, onMLeave });
      });
    };

    // Slight delay so DOM is populated
    const magneticTimer = setTimeout(applyMagnetic, 800);

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onEnter);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(magneticTimer);
      magneticEls.forEach(({ el, onMEnter, onMLeave }) => {
        el.removeEventListener('mousemove', onMEnter);
        el.removeEventListener('mouseleave', onMLeave);
      });
    };
  }, []);

  const ringSize  = isHoveringInteractive ? 52 : 32;
  const ringColor = isHoveringInteractive
    ? 'rgba(244, 241, 234, 0.18)'
    : 'transparent';
  const ringBorder = isHoveringInteractive
    ? '1.5px solid var(--bone-white)'
    : '1px solid rgba(200, 204, 209, 0.7)';

  return (
    <div id="custom-cursor-root" aria-hidden="true">
      {/* Inner dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: 'var(--bone-white)',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
          mixBlendMode: 'difference',
        }}
      />
      {/* Outer ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${ringSize}px`,
          height: `${ringSize}px`,
          borderRadius: '50%',
          border: ringBorder,
          backgroundColor: ringColor,
          pointerEvents: 'none',
          zIndex: 99998,
          willChange: 'transform',
          transition: 'width 0.3s var(--ease-luxury), height 0.3s var(--ease-luxury), border 0.3s ease, background-color 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      {/* VIEW label — shown on image hover */}
      <div
        ref={labelRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99997,
          willChange: 'transform',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isHoveringImage ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--bone-white)',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}>
          VIEW
        </span>
      </div>
    </div>
  );
}
