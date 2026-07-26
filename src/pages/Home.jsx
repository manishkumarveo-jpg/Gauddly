import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, mediaUrl } from '../lib/supabase';

export default function Home() {
  const [hoveredCaste, setHoveredCaste] = useState(null);
  const [castes, setCastes] = useState([]);

  useEffect(() => {
    supabase
      .from('castes')
      .select('id, name, hero_r2_key')
      .neq('id', 'old-world')
      .order('sort_order')
      .then(({ data }) => setCastes(data || []));
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', overflowX: 'hidden' }} className="fade-in">
      
      {/* SECTION B — Hero: Current Chapter */}
      <section 
        style={{
          position: 'relative',
          height: '100vh',
          width: '100%',
          backgroundImage: 'linear-gradient(to top, rgba(10, 10, 10, 1) 0%, rgba(10, 10, 10, 0.4) 60%, rgba(10, 10, 10, 0.8) 100%), url("/cathedral_hero.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 var(--grid-margin-desktop) 120px var(--grid-margin-desktop)',
        }}
      >
        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span className="ui-text">Chapter One</span>
          <h1 className="display-l">The Old World</h1>
          <p className="body-l" style={{ fontStyle: 'italic' }}>
            The world you inherited. The bones beneath everything.
          </p>
          <Link to="/codex" className="underlined-link silver-hover" style={{ width: 'fit-content', fontSize: '18px', marginTop: '12px' }}>
            Read the Codex →
          </Link>
        </div>
      </section>

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
          borderBottom: '1px solid rgba(200, 204, 209, 0.1)',
          padding: '0 24px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
          <span className="ui-text">Episode 01</span>
          <h2 className="display-s">Lost My Sacred City</h2>
          <p className="body-m" style={{ fontStyle: 'italic', color: 'var(--ash-grey)' }}>
            Awaited.
          </p>
          <Link to="/await" className="underlined-link silver-hover" style={{ margin: '16px auto 0 auto', width: 'fit-content' }}>
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
          <span className="body-s" style={{ letterSpacing: '0.05em' }}>
            The four castes of the Sanctum.
          </span>
        </div>

        {/* Castes grid */}
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
          {castes.map((caste) => {
            const isAnyHovered = hoveredCaste !== null;
            const isThisHovered = hoveredCaste === caste.id;
            
            // Opacity and blur settings per visual brief
            let opacity = 0.85;
            let blur = '2px';
            let titleOpacity = 0.6;

            if (isAnyHovered) {
              if (isThisHovered) {
                opacity = 1.0;
                blur = '0px';
                titleOpacity = 1.0;
              } else {
                opacity = 0.65;
                blur = '2px';
                titleOpacity = 0.4;
              }
            }

            return (
              <Link
                key={caste.id}
                to={`/the-${caste.id}`}
                className="caste-tile silver-hover"
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
                    paddingBottom: '150%', // 2:3 aspect ratio
                    overflow: 'hidden',
                    backgroundColor: '#151515',
                  }}
                >
                  <img
                    src={mediaUrl(caste.hero_r2_key)}
                    alt={caste.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: `blur(${blur})`,
                      opacity: opacity,
                      transition: 'filter 0.4s ease, opacity 0.4s ease, transform 0.6s ease',
                      transform: isThisHovered ? 'scale(1.02)' : 'scale(1.0)',
                    }}
                  />
                </div>
                
                <div 
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '20px',
                    color: 'var(--bone-white)',
                    opacity: titleOpacity,
                    transition: 'opacity 0.4s ease',
                    textAlign: 'center'
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
          borderTop: '1px solid rgba(200, 204, 209, 0.1)',
          padding: '0 24px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, lineHeight: 1.3 }}>
            The chamber is sealed. It opens with the Silver Rain.
          </h2>
          <Link to="/await" className="underlined-link silver-hover" style={{ margin: '12px auto 0 auto', width: 'fit-content', fontSize: '20px' }}>
            Await the release →
          </Link>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
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
