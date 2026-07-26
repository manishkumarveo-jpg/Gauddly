import React from 'react';

export default function Sanctum() {
  return (
    <div 
      style={{ 
        backgroundColor: 'var(--void-black)', 
        color: 'var(--bone-white)', 
        minHeight: '100vh', 
        paddingTop: '160px',
        paddingBottom: '160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: '24px',
        paddingRight: '24px'
      }} 
      className="fade-in"
    >
      <div 
        style={{ 
          maxWidth: '680px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '80px', 
          textAlign: 'center' 
        }}
      >
        
        {/* Section A — Core definition */}
        <section>
          <h1 
            style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '40px', 
              fontWeight: 300, 
              lineHeight: 1.3,
              color: 'var(--bone-white)'
            }}
          >
            Gauddly is a house of garments. Every piece belongs to a world called the Sanctum.
          </h1>
        </section>

        {/* Section B — Explanatory editorial */}
        <section 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '32px', 
            alignItems: 'center' 
          }}
        >
          <p className="body-l" style={{ color: 'var(--bone-white)' }}>
            We do not follow the cycles of seasons or commerce. We create garments by hand, in small, numbered batches, release-constructed and made-to-order. Every piece is an artifact from a film episode, a physical evidence of the story unfolding.
          </p>
          <p className="body-l" style={{ color: 'var(--bone-white)' }}>
            The Sanctum is our scripture, our space, and our crossing. It represents a world that has collapsed under the white glare of the Nimbus, where only the castes remain—wearing their elegance, their ritual, their dust, or their ruin.
          </p>
          <p className="body-l" style={{ color: 'var(--bone-white)' }}>
            To participate, you must look closely. Read the Codex chapters as they unlock, watch the films as they depart the city, and claim the garments in the brief window they remain open.
          </p>
        </section>

        {/* Section C — Direction sign-off */}
        <section style={{ borderTop: '1px solid rgba(200, 204, 209, 0.15)', paddingTop: '40px' }}>
          <p className="body-l" style={{ fontStyle: 'italic', color: 'var(--ash-grey)' }}>
            Founded in Delhi. Directed by Aman Kaushik.
          </p>
        </section>

      </div>
    </div>
  );
}
