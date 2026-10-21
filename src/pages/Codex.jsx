import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../context/app-context';

export default function Codex() {
  const { unlockedChapters, unlockChapter } = useContext(AppContext);
  const [activeChapter, setActiveChapter] = useState(1);
  const [unlockingId, setUnlockingId] = useState(null); // id of chapter playing animation
  const [drawingHairline, setDrawingHairline] = useState(false);
  const [fadingSealed, setFadingSealed] = useState(false);
  const [tweeningColor, setTweeningColor] = useState(false);

  const chapterRefs = useRef({
    1: React.createRef(),
    2: React.createRef(),
    3: React.createRef(),
    4: React.createRef(),
    5: React.createRef(),
    6: React.createRef(),
    7: React.createRef(),
  }).current;

  const chapters = [
    {
      id: 1,
      num: 'I',
      title: 'The Old World',
      text: [
        "Before the Sanctum, there was only the world. It was ordinary, loud, and cluttered. It was a world that measured itself in accumulations—in towers of glass that scraped the clouds, in speed, in noise, and in numbers. We built temples to the transient, and we wore garments that were forgotten before they were worn.",
        "But beneath the glass lay the bones. The Earth breathed quietly, waiting for the clutter to clear. We did not know then that the end was not a fire or a flood, but a quiet return to simplicity.",
        "What remains of that age are the relics. The flared cotton, the raw seams, the rising malice of ordinary shirts. They are the artifacts of a people who still believed the ground beneath them was permanent."
      ]
    },
    {
      id: 2,
      num: 'II',
      title: 'The Coming of the Nimbus',
      text: [
        "Then the sky turned white. Not the white of snow, but the luminous, bone-colored glare of a dome that had no sun. Those who lived in the towers looked up and called it the Nimbus.",
        "The Nimbus did not destroy. It simply watched. It demanded elegance. The elite, the leaders, the wealthy—they retreated into the high galleries and wore garments of pristine white and silk-twill. They pretended the world beneath them was not fading into ash.",
        "They wore the garments of heirs who had already lost their heritage, but refused to look down at the dirt."
      ]
    },
    {
      id: 3,
      num: 'III',
      title: 'The Shade',
      text: [
        "Beneath the white dome of the Nimbus, the shadow grew. We called it the Shade. It was not darkness, but a suspension of light. Under the Shade, colors died first. Red became rust; blue became cathedral dust; green became decay.",
        "The people who stayed in the streets learned to live without shadows. They became quiet, moving like smoke between the stone pillars of the old world."
      ]
    },
    {
      id: 4,
      num: 'IV',
      title: 'The Corruption',
      text: [
        "In the corners where the light could not reach, the cloth began to turn. It was not a rot of dirt, but a rot of memory. Garments grew stiff, taking on the colors of cathedral iron and dried clay.",
        "We tried to wash the stains, but the stains became the fabric itself. The corruption was the first sign that the Sanctum was reclaiming what we had made."
      ]
    },
    {
      id: 5,
      num: 'V',
      title: 'The Silver Rain',
      text: [
        "And then, the Rain. It fell in dense strands of molten silver, slow and heavy, defying the wind. It did not wet the skin; it coated it. It fell upon the cathedrals, sealing the gates. It fell upon the cotton, turning the threads into wire.",
        "Where the Silver Rain touched, the world stopped moving. It was the final crossing. The silver became our cursor, our boundary, our silence."
      ]
    },
    {
      id: 6,
      num: 'VI',
      title: 'The Age of Memento Mori',
      text: [
        "We enter now the age where we remember. Memento Mori. Remember that you must die, and remember that what you wear is only dust held together by thread.",
        "We do not build stores; we open chambers. We do not sell; we claim. Every garment is constructed by hand, made to order, and signed with the silver needle. They are the shrouds of the living."
      ]
    },
    {
      id: 7,
      num: 'VII',
      title: 'What Remains',
      text: [
        "What remains are the four castes of the Sanctum: The Nimbus in their high galleries, pretending; The Vestments, who carry the tools of the ritual; The Faithful, who kneel in the grey dust; and The Fallen, who live in the rust and rot of what the Silver Rain left behind.",
        "Each caste wears their truth. Genesis is the garment of the Nimbus—pure, blind, elegant. Rust is the garment of the Fallen—honest, decaying, permanent.",
        "Choose your room. Wear the world."
      ]
    }
  ];

  // Intercept scroll to update active chapter indicator
  useEffect(() => {
    const handleScroll = () => {
      let currentActive = 1;
      let minDistance = Infinity;

      Object.keys(chapterRefs).forEach((id) => {
        const ref = chapterRefs[id];
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const distance = Math.abs(rect.top - 120);
          if (distance < minDistance) {
            minDistance = distance;
            currentActive = parseInt(id, 10);
          }
        }
      });

      setActiveChapter(currentActive);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapterRefs]);

  const handleIndexClick = (id) => {
    if (!unlockedChapters.includes(id)) return;
    const ref = chapterRefs[id];
    if (ref.current) {
      window.scrollTo({
        top: ref.current.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  // Chapter Unlock Animation Sequence (Spec 3.3)
  const triggerUnlockAnimation = (chapterId) => {
    if (unlockedChapters.includes(chapterId)) return;
    
    setUnlockingId(chapterId);
    setDrawingHairline(true);

    // 0ms: sealed chapter state visible (already is)
    // 200ms: draw 1px silver hairline over 800ms
    setTimeout(() => {
      setDrawingHairline(true);
    }, 200);

    // 1000ms: hairline holds for 200ms
    // 1200ms: hairline fades out (400ms) while "Sealed" fades to 0 (400ms)
    setTimeout(() => {
      setFadingSealed(true);
    }, 1200);

    // 1600ms: chapter title tweens from ash grey to bone white (500ms)
    setTimeout(() => {
      setTweeningColor(true);
    }, 1600);

    // 2100ms: complete. Clickable.
    setTimeout(() => {
      unlockChapter(chapterId);
      // Clean up animation flags
      setUnlockingId(null);
      setDrawingHairline(false);
      setFadingSealed(false);
      setTweeningColor(false);
    }, 2100);
  };

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '120px' }}>
      
      {/* Dev Unlock Panel simulator */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          backgroundColor: 'rgba(20, 20, 20, 0.9)',
          border: '1px solid rgba(200, 204, 209, 0.2)',
          padding: '16px',
          zIndex: 100,
          borderRadius: '4px',
        }}
      >
        <div className="ui-text" style={{ fontSize: '10px', marginBottom: '8px', color: 'var(--ash-grey)' }}>
          Unlock Animation Simulator
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => triggerUnlockAnimation(2)} 
            disabled={unlockedChapters.includes(2) || unlockingId === 2}
            style={{
              background: 'none',
              border: '1px solid var(--cold-silver)',
              color: 'var(--bone-white)',
              padding: '6px 12px',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              cursor: 'pointer',
              opacity: unlockedChapters.includes(2) ? 0.3 : 1
            }}
          >
            Unlock Ch. II
          </button>
          <button 
            onClick={() => triggerUnlockAnimation(3)} 
            disabled={unlockedChapters.includes(3) || unlockingId === 3}
            style={{
              background: 'none',
              border: '1px solid var(--cold-silver)',
              color: 'var(--bone-white)',
              padding: '6px 12px',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              cursor: 'pointer',
              opacity: unlockedChapters.includes(3) ? 0.3 : 1
            }}
          >
            Unlock Ch. III
          </button>
        </div>
      </div>

      <div className="grid-container" style={{ position: 'relative' }}>
        
        {/* LEFT COLUMN: Sticky Chapter Index */}
        <div 
          style={{
            gridColumn: 'span 4',
            position: 'sticky',
            top: '120px',
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            paddingRight: '40px',
            borderRight: '1px solid rgba(200, 204, 209, 0.1)',
          }}
          className="codex-sidebar"
        >
          {chapters.map((ch) => {
            const isUnlocked = unlockedChapters.includes(ch.id) || (unlockingId === ch.id && tweeningColor);
            const isSealed = !unlockedChapters.includes(ch.id) && unlockingId !== ch.id;
            const isActive = activeChapter === ch.id && isUnlocked;
            
            // Animation styling based on unlock sequence state
            const isThisUnlocking = unlockingId === ch.id;
            let displayColor = 'var(--ash-grey)';
            let displayOpacity = 0.5;

            if (isUnlocked) {
              displayOpacity = 1.0;
              displayColor = isActive ? 'var(--bone-white)' : 'var(--ash-grey)';
            } else if (isThisUnlocking) {
              if (tweeningColor) {
                displayColor = 'var(--bone-white)';
                displayOpacity = 1.0;
              } else {
                displayColor = 'var(--ash-grey)';
                displayOpacity = 0.5;
              }
            }

            return (
              <div 
                key={ch.id} 
                onClick={() => handleIndexClick(ch.id)}
                onKeyDown={(event) => {
                  if (isUnlocked && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    handleIndexClick(ch.id);
                  }
                }}
                role={isUnlocked ? 'button' : undefined}
                tabIndex={isUnlocked ? 0 : undefined}
                className={isUnlocked ? 'silver-hover' : ''}
                style={{
                  position: 'relative',
                  opacity: displayOpacity,
                  color: displayColor,
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  transition: 'opacity 0.4s ease, color 0.4s ease',
                  padding: '8px 0',
                }}
              >
                {/* Hairline Drawing Layer (Spec 3.3) */}
                {isThisUnlocking && drawingHairline && (
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      height: '1px',
                      backgroundColor: 'var(--cold-silver)',
                      width: '100%',
                      animation: 'drawHairline 0.8s ease forwards',
                      opacity: fadingSealed ? 0 : 1,
                      transition: 'opacity 0.4s ease',
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '40px', lineHeight: 1 }}>
                    {ch.num}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span 
                      style={{ 
                        fontFamily: 'var(--font-body)', 
                        fontSize: '20px',
                        borderBottom: isActive ? '1px solid var(--cold-silver)' : '1px solid transparent',
                        paddingBottom: '2px',
                        width: 'fit-content'
                      }}
                    >
                      {ch.title}
                    </span>
                    {/* Sealed State Indicator */}
                    {isSealed && (
                      <span 
                        style={{ 
                          fontFamily: 'var(--font-body)', 
                          fontStyle: 'italic', 
                          fontSize: '13px', 
                          color: 'var(--ash-grey)',
                          opacity: (isThisUnlocking && fadingSealed) ? 0 : 1,
                          transition: 'opacity 0.4s ease',
                          marginTop: '2px'
                        }}
                      >
                        Sealed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Chapter Text */}
        <div 
          style={{
            gridColumn: 'span 8',
            paddingLeft: '60px',
            display: 'flex',
            flexDirection: 'column',
            gap: '120px',
            marginBottom: '160px',
          }}
          className="codex-body"
        >
          {chapters.map((ch) => {
            const isUnlocked = unlockedChapters.includes(ch.id);

            // Sealed placeholders or direct chapter view
            return (
              <div 
                key={ch.id} 
                ref={chapterRefs[ch.id]}
                style={{
                  opacity: isUnlocked ? 1.0 : 0.25,
                  transition: 'opacity 0.8s ease',
                  scrollMarginTop: '100px'
                }}
              >
                <h2 className="display-m" style={{ marginBottom: '40px', textTransform: 'uppercase', fontSize: '36px' }}>
                  {ch.num}. {ch.title}
                </h2>
                
                {isUnlocked ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '640px' }}>
                    {ch.text.map((paragraph, index) => (
                      <p key={index} className="body-l" style={{ color: 'var(--bone-white)', textIndent: index > 0 ? '30px' : '0' }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px 0', border: '1px dashed rgba(200, 204, 209, 0.2)', maxWidth: '640px', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--ash-grey)' }}>
                      This chamber of the Codex remains sealed.
                    </p>
                  </div>
                )}

                {ch.id < 7 && <hr className="hairline-centered" />}
              </div>
            );
          })}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drawHairline {
          from { width: 0%; }
          to { width: 100%; }
        }

        @media (max-width: 1024px) {
          .codex-sidebar {
            display: none !important;
          }
          .codex-body {
            grid-column: 1 / -1 !important;
            padding-left: 0 !important;
          }
        }
      `}} />
    </div>
  );
}
