import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase, mediaUrl } from '../lib/supabase';
import useScrollReveal from '../lib/useScrollReveal';

/* ─────────────────────────────────────────────
   SPLIT-WORD CLIP-PATH REVEAL
   Each word sits in an overflow:hidden mask.
   On mount, words slide up from translateY(110%)
   with staggered delays — giving the cinematic
   "curtain lift" effect used by luxury brands.
───────────────────────────────────────────── */
function SplitWordReveal({ text, tag: Tag = 'span', baseDelay = 0, style = {}, className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Small offset so it fires after page-enter animation
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  const words = text.split(' ');

  return (
    <Tag className={className} style={{ ...style, display: 'block' }}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'bottom',
            marginRight: i < words.length - 1 ? '0.28em' : 0,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: visible ? 'translateY(0) skewY(0deg)' : 'translateY(110%) skewY(3deg)',
              opacity: visible ? 1 : 0,
              transition: `transform 0.85s cubic-bezier(0.16,1,0.3,1) ${baseDelay + i * 95}ms,
                           opacity   0.55s ease                        ${baseDelay + i * 95}ms`,
              willChange: 'transform, opacity',
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/* ─────────────────────────────────────────────
   CHARACTER TRACKING REVEAL
   Letters appear left→right, simultaneously
   expanding letter-spacing from 0 to normal.
───────────────────────────────────────────── */
function CharTrackReveal({ text, delay = 0, style = {}, className = '' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay + 80);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <span
      className={className}
      style={{
        ...style,
        display: 'inline-block',
        letterSpacing: visible ? '0.28em' : '0em',
        opacity: visible ? 1 : 0,
        transition: `letter-spacing 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     opacity        0.6s ease                       ${delay}ms`,
        willChange: 'letter-spacing, opacity',
      }}
    >
      {text}
    </span>
  );
}

/* ─────────────────────────────────────────────
   LINE WIPE REVEAL  (clip-path left→right)
───────────────────────────────────────────── */
function LineWipe({ children, delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay + 80);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <span
      style={{
        ...style,
        display: 'block',
        clipPath: visible ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
        transition: `clip-path 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'clip-path',
      }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────
   SCROLL PARALLAX HOOK
   Returns a ref and a translateY value that
   shifts the element slower than the scroll.
───────────────────────────────────────────── */
function useParallax(speed = 0.18) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.closest('section')?.getBoundingClientRect() || { top: 0 };
        const scrolled = -rect.top;
        setOffset(scrolled * speed);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return [ref, offset];
}

/* ─────────────────────────────────────────────
   HERO TEXT BLOCK — assembled
───────────────────────────────────────────── */
function HeroText() {
  const [parallaxRef, parallaxY] = useParallax(0.15);

  return (
    <div
      ref={parallaxRef}
      style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '700px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        transform: `translateY(${-parallaxY}px)`,
        willChange: 'transform',
      }}
    >
      {/* LABEL — character tracking reveal */}
      <div style={{ marginBottom: '18px' }}>
        <CharTrackReveal
          text="CHAPTER ONE"
          delay={0}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 400,
            color: 'var(--cold-silver)',
            textTransform: 'uppercase',
          }}
        />
      </div>

      {/* HEADING — split word clip-path reveal */}
      <div style={{ marginBottom: '28px', lineHeight: 0.95 }}>
        <SplitWordReveal
          text="The Old World"
          tag="h1"
          baseDelay={180}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 8vw, 96px)',
            fontWeight: 300,
            color: 'var(--bone-white)',
            lineHeight: 1.0,
            margin: 0,
          }}
        />
      </div>

      {/* SUBTITLE — line wipe left→right */}
      <div style={{ marginBottom: '32px' }}>
        <LineWipe delay={700} style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(18px, 2vw, 24px)', color: 'var(--cold-silver)', lineHeight: 1.5 }}>
          The world you inherited.
        </LineWipe>
        <LineWipe delay={920} style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(18px, 2vw, 24px)', color: 'var(--ash-grey)', lineHeight: 1.5 }}>
          The bones beneath everything.
        </LineWipe>
      </div>

      {/* CTA — fade in with animated underline glow */}
      <AnimatedCTA to="/codex" delay={1100}>
        Read the Codex →
      </AnimatedCTA>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CTA BUTTON — glowing underline that draws
   itself in on mount, then pulses on hover.
───────────────────────────────────────────── */
function AnimatedCTA({ to, delay, children }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay + 80);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-body)',
        fontSize: '16px',
        letterSpacing: '0.08em',
        color: visible ? 'var(--bone-white)' : 'transparent',
        textDecoration: 'none',
        paddingBottom: '6px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, color 0.3s ease`,
        width: 'fit-content',
      }}
    >
      {children}
      {/* Animated underline */}
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: hovered ? '1.5px' : '1px',
          width: visible ? '100%' : '0%',
          background: hovered
            ? 'linear-gradient(90deg, var(--cold-silver), var(--bone-white), var(--cold-silver))'
            : 'var(--cold-silver)',
          boxShadow: hovered ? '0 0 8px rgba(200,204,209,0.5)' : 'none',
          transition: `width 0.75s cubic-bezier(0.16,1,0.3,1) ${delay + 100}ms,
                       height 0.2s ease,
                       background 0.3s ease,
                       box-shadow 0.3s ease`,
          willChange: 'width',
        }}
      />
    </Link>
  );
}

/* ─────────────────────────────────────────────
   SCROLL PROGRESS HOOK
   0 → 1 across the element's own scrollable
   range (its height minus one viewport).
───────────────────────────────────────────── */
function useScrollProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? scrolled / total : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return [ref, progress];
}

/* ─────────────────────────────────────────────
   HERO SECTION — extended, background pinned via
   position: sticky for a longer scroll hold, with
   a closing dark fade in the final stretch before
   the page releases into the next section.
───────────────────────────────────────────── */
function HeroSection() {
  const [sectionRef, progress] = useScrollProgress();
  const fadeStart = 0.7;
  const closingFade = progress <= fadeStart ? 0 : (progress - fadeStart) / (1 - fadeStart);

  return (
    <section ref={sectionRef} style={{ position: 'relative', height: '170vh', width: '100%' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 var(--grid-margin-desktop) 120px var(--grid-margin-desktop)',
        }}
      >
        <video
          src="https://pub-5d519c8dedf642f59a07d4b6cbc2b766.r2.dev/silver-rain/Initial_Scene_-_2026-07-28_202607281856.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
        {/* Richer gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            background: `
              linear-gradient(to top,  rgba(10,10,10,1) 0%,  rgba(10,10,10,0.15) 50%, rgba(10,10,10,0.55) 100%),
              linear-gradient(to right, rgba(10,10,10,0.6) 0%, transparent 60%)
            `,
            zIndex: 1,
          }}
        />
        {/* Closing fade - darkens as the pinned moment nears its end */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundColor: 'var(--void-black)',
            opacity: closingFade,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* ── Animated hero text block ── */}
        <HeroText />
      </div>
    </section>
  );
}

export default function Home() {
  const [hoveredCaste, setHoveredCaste] = useState(null);
  const [castes, setCastes] = useState([]);
  const pageRef = useScrollReveal();

  useEffect(() => {
    supabase
      .from('castes')
      .select('id, name, hero_r2_key')
      .neq('id', 'old-world')
      .order('sort_order')
      .then(({ data }) => setCastes(data || []));
  }, []);

  // Image blur-up on load
  const handleImgLoad = (e) => {
    e.target.classList.add('loaded');
  };

  return (
    <div
      ref={pageRef}
      style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', overflowX: 'hidden' }}
      className="fade-in"
    >

      {/* SECTION B — Hero: Current Chapter */}
      <HeroSection />

      {/* SECTION C — Next Episode */}
      <section
        style={{
          height: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          backgroundColor: 'var(--void-black)',
          borderBottom: '1px solid rgba(200, 204, 209, 0.08)',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
          <span className="ui-text reveal">Episode 01</span>
          <h2 className="display-s reveal reveal-delay-1">Lost My Sacred City</h2>
          <p className="body-m reveal reveal-delay-2" style={{ fontStyle: 'italic', color: 'var(--ash-grey)' }}>
            Awaited.
          </p>
          <Link
            to="/await"
            className="underlined-link silver-hover reveal reveal-delay-3"
            style={{ margin: '16px auto 0 auto', width: 'fit-content' }}
          >
            Await release →
          </Link>
        </div>
      </section>

      {/* SECTION D — Four Castes */}
      <section
        style={{
          minHeight: '100vh',
          padding: '120px var(--grid-margin-desktop)',
          backgroundColor: 'var(--void-black)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '60px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span className="body-s reveal" style={{ letterSpacing: '0.05em' }}>
            The four castes of the Sanctum.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '24px',
            width: '100%',
            maxWidth: '1600px',
          }}
          className="castes-container"
        >
          {castes.map((caste, i) => {
            const isAnyHovered = hoveredCaste !== null;
            const isThisHovered = hoveredCaste === caste.id;

            let opacity = 0.85;
            let blur = '2px';
            let titleOpacity = 0.6;

            if (isAnyHovered) {
              if (isThisHovered) {
                opacity = 1.0;
                blur = '0px';
                titleOpacity = 1.0;
              } else {
                opacity = 0.55;
                blur = '3px';
                titleOpacity = 0.35;
              }
            }

            return (
              <Link
                key={caste.id}
                to={`/the-${caste.id}`}
                className={`caste-tile silver-hover reveal reveal-delay-${Math.min(i + 1, 5)}`}
                onMouseEnter={() => setHoveredCaste(caste.id)}
                onMouseLeave={() => setHoveredCaste(null)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  textDecoration: 'none',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '150%',
                    overflow: 'hidden',
                    backgroundColor: '#111',
                  }}
                >
                  <img
                    src={mediaUrl(caste.hero_r2_key)}
                    alt={caste.name}
                    className="piece-image-wrap img-reveal"
                    onLoad={handleImgLoad}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      filter: `blur(${blur})`,
                      opacity: opacity,
                      transition: 'filter 0.5s ease, opacity 0.5s ease, transform 0.65s var(--ease-luxury)',
                      transform: isThisHovered ? 'scale(1.04)' : 'scale(1.0)',
                    }}
                  />
                  {/* Hover overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(200, 204, 209, 0.04)',
                      opacity: isThisHovered ? 1 : 0,
                      transition: 'opacity 0.4s ease',
                    }}
                  />
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '20px',
                    color: 'var(--bone-white)',
                    opacity: titleOpacity,
                    transition: 'opacity 0.4s ease, transform 0.35s ease',
                    textAlign: 'center',
                    transform: isThisHovered ? 'translateY(-4px)' : 'translateY(0)',
                  }}
                >
                  {caste.name}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION E — Enter the Chamber */}
      <section
        style={{
          height: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          backgroundColor: 'var(--void-black)',
          borderTop: '1px solid rgba(200, 204, 209, 0.08)',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
          <h2
            className="reveal"
            style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, lineHeight: 1.3 }}
          >
            The chamber is sealed. It opens with the Silver Rain.
          </h2>
          <Link
            to="/await"
            className="underlined-link silver-hover reveal reveal-delay-2"
            style={{ margin: '12px auto 0 auto', width: 'fit-content', fontSize: '20px' }}
          >
            Await the release →
          </Link>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 1024px) {
          .castes-container {
            flex-direction: column !important;
            gap: 48px !important;
          }
          .caste-tile {
            width: 100% !important;
            max-width: 480px;
            margin: 0 auto;
          }
        }
      `}} />
    </div>
  );
}
