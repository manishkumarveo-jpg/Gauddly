import React, { useEffect, useState, useContext, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/app-context';

export default function Landing() {
  const { isEntered, enterSanctum, skipEntry, soundEnabled, setSoundEnabled } = useContext(AppContext);
  const [step, setStep] = useState(0); // 0: Black, 1: Rain & First Text, 2: Enter button
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();

  // Web Audio elements for synthesising the low 40Hz sub-bass drone
  const audioCtxRef = useRef(null);
  const oscRef      = useRef(null);
  const gainRef     = useRef(null);

  // Sequence timings
  useEffect(() => {
    // 0.5s: Fades in Silver Rain and begins text sequence
    const t1 = setTimeout(() => {
      setStep(1);
      if (soundEnabled) startDrone();
    }, 500);

    // 5.0s: Transition to "Enter." button
    const t2 = setTimeout(() => setStep(2), 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      stopDrone();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Web Audio synth logic
  const startDrone = () => {
    try {
      if (audioCtxRef.current) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      const osc  = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 40;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2.0);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      oscRef.current  = osc;
      gainRef.current = gainNode;
    } catch (e) {
      console.warn('Web Audio drone failed to start:', e);
    }
  };

  const stopDrone = (fadeOutTime = 0.5) => {
    const ctx      = audioCtxRef.current;
    const gainNode = gainRef.current;
    const osc      = oscRef.current;
    if (ctx && gainNode && osc) {
      try {
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOutTime);
        setTimeout(() => {
          try { osc.stop(); ctx.close(); } catch {}
          audioCtxRef.current = null;
          oscRef.current      = null;
          gainRef.current     = null;
        }, fadeOutTime * 1000);
      } catch (e) {
        console.warn('Error stopping drone:', e);
      }
    }
  };

  const toggleSound = () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      stopDrone(0.2);
    } else {
      setSoundEnabled(true);
      startDrone();
    }
  };

  const handleEnterClick = () => {
    setFadeOut(true);
    stopDrone(0.6);
    setTimeout(() => {
      enterSanctum();
      navigate('/home');
    }, 650);
  };

  const handleSkipClick = () => {
    stopDrone(0.1);
    skipEntry();
    navigate('/home');
  };

  // Returning visitors (entered within 30 days) skip the 5s intro
  if (isEntered) return <Navigate to="/home" replace />;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--void-black)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'opacity 0.65s var(--ease-luxury)',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Background video: falling silver */}
      {step >= 1 && (
        <video
          autoPlay
          loop
          muted
          playsInline
          src="https://pub-5d519c8dedf642f59a07d4b6cbc2b766.r2.dev/silver-rain/Falling_liquid_silver_in_darkness_202607281829.mp4"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      )}

      {/* Main Content Area */}
      <div
        style={{
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '640px',
          padding: '0 24px',
          height: '180px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Step 1 — intro text with breathing pulse */}
        {step === 1 && (
          <p
            className="fade-in text-breathe"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              color: 'var(--bone-white)',
              letterSpacing: '0.05em',
              animationDuration: '0.8s',
              transformOrigin: 'center',
            }}
          >
            Before the Sanctum, there was only the world.
          </p>
        )}

        {/* Step 2 — "Enter." button with silver shimmer */}
        {step === 2 && (
          <div className="fade-in" style={{ animationDuration: '0.6s' }}>
            <button
              onClick={handleEnterClick}
              className="btn-liquid"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--cold-silver)',
                fontFamily: 'var(--font-display)',
                fontSize: '96px',
                paddingBottom: '8px',
                outline: 'none',
                transition: 'border-width 0.25s ease, border-bottom-color 0.25s ease',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderBottomWidth = '2px';
                e.currentTarget.style.borderBottomColor = 'var(--bone-white)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderBottomWidth = '1px';
                e.currentTarget.style.borderBottomColor = 'var(--cold-silver)';
              }}
            >
              {/* Silver shimmer applied to text span */}
              <span className="silver-shimmer-text">Enter.</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom left: Logo branding */}
      <div
        className="fade-in"
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '40px',
          animationDelay: '0.3s',
          animationFillMode: 'both',
        }}
      >
        <img src="/LOGO%20BLACK.png" alt="Gauddly" style={{ height: '18px', width: 'auto', filter: 'invert(1)', opacity: 0.85 }} />
      </div>

      {/* Bottom right: Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          zIndex: 20,
        }}
      >
        <button
          onClick={toggleSound}
          className="ui-text silver-hover"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ash-grey)',
            fontSize: '12px',
            transition: 'color 0.3s ease',
          }}
        >
          {soundEnabled ? 'Sound: On' : 'Sound: Off'}
        </button>
        <button
          onClick={handleSkipClick}
          className="ui-text silver-hover"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ash-grey)',
            fontSize: '12px',
            transition: 'color 0.3s ease',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
