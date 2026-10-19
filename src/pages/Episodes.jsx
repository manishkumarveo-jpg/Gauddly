import React, { useState, useRef, useEffect } from 'react';
import { publicRead, mediaUrl } from '../lib/supabase';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Episodes() {
  const [activeVideo, setActiveVideo] = useState(null); // Active video url to play
  const [activeTitle, setActiveTitle] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const [episodes, setEpisodes] = useState([]);

  useEffect(() => {
    publicRead('episodes')
      .catch(() => [[]])
      .then(([data]) => {
        setEpisodes(
          data.map((ep) => ({
            id: ep.id,
            num: ep.num,
            title: ep.title,
            status: capitalize(ep.status),
            still: mediaUrl(ep.still_r2_key),
            videoUrl: mediaUrl(ep.video_r2_key),
            desc: ep.description,
            directorNote: ep.director_note,
          }))
        );
      });
  }, []);

  const handleTileClick = (ep) => {
    if (ep.status === 'Released' && ep.videoUrl) {
      setActiveVideo(ep.videoUrl);
      setActiveTitle(ep.title);
      setIsPlaying(true);
      // Wait for node attachment to trigger play
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(e => {
            console.log("Autoplay blocked, waiting for click", e);
            setIsPlaying(false);
          });
        }
      }, 100);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const closePlayer = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setActiveVideo(null);
    setActiveTitle('');
    setIsPlaying(false);
  };

  return (
    <div style={{ backgroundColor: 'var(--void-black)', color: 'var(--bone-white)', minHeight: '100vh', paddingTop: '120px', paddingBottom: '160px' }} className="fade-in">
      
      {/* VIDEO PLAYER LAYER */}
      {activeVideo && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'var(--void-black)',
            zIndex: 6000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          className="fade-in"
        >
          {/* Custom minimal player close header */}
          <div 
            style={{ 
              width: '100%', 
              padding: '24px var(--grid-margin-desktop)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 10
            }}
          >
            <span className="ui-text" style={{ color: 'var(--bone-white)' }}>
              Now Playing: {activeTitle}
            </span>
            <button 
              onClick={closePlayer} 
              className="ui-text silver-hover"
              style={{ background: 'none', border: 'none', color: 'var(--ash-grey)', padding: '8px' }}
            >
              Exit Film
            </button>
          </div>

          {/* Minimal Custom Video Object */}
          <div 
            style={{
              position: 'relative',
              width: '80%',
              maxWidth: '1200px',
              aspectRatio: '16/9',
              backgroundColor: '#000',
              border: '1px solid rgba(200, 204, 209, 0.15)',
              overflow: 'hidden'
            }}
          >
            <video
              ref={videoRef}
              src={activeVideo}
              loop
              muted={isMuted}
              onClick={togglePlay}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
            />

            {/* Custom controls overlay */}
            <div 
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                padding: '20px',
                background: 'linear-gradient(to top, rgba(10,10,10,0.9), transparent)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '24px' }}>
                <button 
                  onClick={togglePlay}
                  className="ui-text silver-hover"
                  style={{ background: 'none', border: 'none', color: 'var(--bone-white)' }}
                >
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button 
                  onClick={toggleMute}
                  className="ui-text silver-hover"
                  style={{ background: 'none', border: 'none', color: 'var(--bone-white)' }}
                >
                  {isMuted ? 'UNMUTE' : 'MUTE'}
                </button>
              </div>
              <div className="ui-text" style={{ fontSize: '10px', color: 'var(--ash-grey)' }}>
                NATIVE MUX FEED
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EPISODES INDEX */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '80px',
          padding: '0 var(--grid-margin-desktop)',
        }}
        className="episodes-container"
      >
        <div style={{ borderBottom: '1px solid rgba(200, 204, 209, 0.15)', paddingBottom: '24px', marginBottom: '40px' }}>
          <h1 className="display-l">THE FILMS</h1>
          <p className="body-l" style={{ fontStyle: 'italic', color: 'var(--ash-grey)', marginTop: '8px' }}>
            The chronicles of the Sanctum.
          </p>
        </div>

        {episodes.map((ep) => {
          const isReleased = ep.status === 'Released';
          const isSealed = ep.status === 'Sealed';

          return (
            <div 
              key={ep.id}
              onClick={() => handleTileClick(ep)}
              onKeyDown={(event) => {
                if (isReleased && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  handleTileClick(ep);
                }
              }}
              role={isReleased ? 'button' : undefined}
              tabIndex={isReleased ? 0 : undefined}
              aria-label={isReleased ? `Play ${ep.title}` : undefined}
              className={isReleased ? 'episode-tile silver-hover' : ''}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr 2fr',
                gap: '40px',
                alignItems: 'center',
                borderBottom: '1px solid rgba(200, 204, 209, 0.1)',
                paddingBottom: '60px',
                cursor: isReleased ? 'pointer' : (isSealed ? 'not-allowed' : 'wait'),
                opacity: isReleased ? 1.0 : 0.4,
                transition: 'opacity 0.4s, transform 0.4s',
              }}
            >
              {/* Left Third: Roman Numeral */}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '96px', color: 'var(--bone-white)' }}>
                {ep.num}
              </div>

              {/* Center Third: 16:9 Still Frame */}
              <div 
                style={{ 
                  aspectRatio: '16/9', 
                  overflow: 'hidden', 
                  backgroundColor: '#151515', 
                  border: '1px solid rgba(200, 204, 209, 0.15)',
                  position: 'relative'
                }}
              >
                <img 
                  src={ep.still} 
                  alt={ep.title} 
                  loading="lazy"
                  decoding="async"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    filter: isReleased ? 'grayscale(0.3) contrast(1.1)' : 'grayscale(1) blur(4px) brightness(0.5)',
                    transition: 'filter 0.4s'
                  }}
                />
                {!isReleased && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <span className="ui-text" style={{ color: 'var(--bone-white)', border: '1px solid var(--bone-white)', padding: '4px 8px' }}>
                      {ep.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Third: Text Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="ui-text" style={{ fontSize: '10px' }}>
                  {isReleased ? 'EPISODE AVAILABLE' : 'CHAMBER LOCKED'}
                </span>
                
                <h3 className="display-s" style={{ fontSize: '28px' }}>
                  {ep.title}
                </h3>
                
                <p className="body-s" style={{ color: 'var(--ash-grey)', fontSize: '14px', lineHeight: 1.5 }}>
                  {ep.desc}
                </p>

                {isReleased && ep.directorNote && (
                  <p className="body-s" style={{ fontStyle: 'italic', marginTop: '10px', fontSize: '13px', borderLeft: '1px solid var(--cold-silver)', paddingLeft: '12px' }}>
                    "{ep.directorNote}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .episodes-container div[onClick] {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            text-align: center;
          }
          .episodes-container img {
            max-width: 320px;
            margin: 0 auto;
          }
          .episodes-container div {
            align-items: center !important;
          }
        }
      `}} />

    </div>
  );
}
