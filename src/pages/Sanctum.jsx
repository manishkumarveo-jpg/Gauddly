import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../lib/supabase';
import { loadPublicHomeCatalog } from '../lib/homepage-api';
import { fogTitle, gsap, useMotion } from '../lib/motion';
import './sanctum.css';

export default function Sanctum() {
  const [castes, setCastes] = useState([]);
  const root = useRef(null);

  useEffect(() => {
    let active = true;
    loadPublicHomeCatalog().then(({ castes: rows }) => { if (active) setCastes(rows); }).catch(() => {});
    return () => { active = false; };
  }, []);

  useMotion(root, (el) => fogTitle(el.querySelector('h1')), []);

  // The descent: each caste panel is sticky (sanctum.css), so the next one slides over it, and GSAP pushes
  // the covered panel back and darkens it (translate and opacity only, so its photo is never re-rasterized).
  // Triggers hang off the container, not the sticky panels, because a sticky element's measured position
  // changes once it sticks.
  useMotion(root, (el) => {
    const container = el.querySelector('.sanctum-castes');
    const panels = gsap.utils.toArray(el.querySelectorAll('.sanctum-panel'));
    if (!container || !panels.length) return;
    gsap.from(panels[0].querySelector('.sanctum-panel-copy'), {
      yPercent: 20, opacity: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: container, start: 'top 60%', once: true },
    });
    panels.slice(0, -1).forEach((panel, i) => {
      gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: () => `top+=${i * panel.offsetHeight} top`,
          end: () => `top+=${(i + 1) * panel.offsetHeight} top`,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      })
        .to(panel.querySelector('.sanctum-panel-inner'), { yPercent: -10, ease: 'none' }, 0)
        .to(panel.querySelector('.sanctum-panel-shade'), { opacity: 0.6, ease: 'none' }, 0)
        .from(panels[i + 1].querySelector('.sanctum-panel-copy'), { yPercent: 30, opacity: 0, ease: 'none', duration: 0.6 }, 0.4);
    });
  }, [castes.length]);

  return (
    <div ref={root} className="sanctum fade-in">
      <div className="sanctum-intro">
        <h1>Gauddly is a house of garments. Every piece belongs to a world called the Sanctum.</h1>
        <section className="sanctum-intro-body">
          <p className="body-l">
            We do not follow the cycles of seasons or commerce. We create garments by hand, in small, numbered batches, release-constructed and made-to-order. Every piece is an artifact from a film episode, a physical evidence of the story unfolding.
          </p>
          <p className="body-l">
            The Sanctum is our scripture, our space, and our crossing. It represents a world that has collapsed under the white glare of the Nimbus, where only the castes remain—wearing their elegance, their ritual, their dust, or their ruin.
          </p>
          <p className="body-l">
            To participate, you must look closely. Read the Codex chapters as they unlock, watch the films as they depart the city, and claim the garments in the brief window they remain open.
          </p>
        </section>
      </div>

      {castes.length > 0 && (
        <section className="sanctum-castes" aria-label="The castes of the Sanctum">
          {castes.map((caste, index) => (
            <article key={caste.id} className="sanctum-panel">
              <div className="sanctum-panel-inner">
                {caste.hero_r2_key && <img src={mediaUrl(caste.hero_r2_key)} alt="" loading="lazy" decoding="async" />}
                <div className="sanctum-panel-gradient" />
                <div className="sanctum-panel-copy">
                  <span className="ui-text">{String(index + 1).padStart(2, '0')} / {String(castes.length).padStart(2, '0')}</span>
                  <h2 className="display-l">{caste.name}</h2>
                  {caste.passage && <p className="body-l">“{caste.passage}”</p>}
                  <Link to={`/the-${caste.id}`} className="underlined-link silver-hover">Enter the room →</Link>
                </div>
                <div className="sanctum-panel-shade" />
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="sanctum-signoff">
        <p className="body-l">Founded in Delhi. Directed by Aman Kaushik.</p>
      </section>
    </div>
  );
}
