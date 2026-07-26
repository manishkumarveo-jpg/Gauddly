import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import SilverRain from '../components/SilverRain';

export default function Landing() {
  const { enterSanctum, skipEntry, soundEnabled, setSoundEnabled } = useContext(AppContext);
  const [step, setStep] = useState(0); // 0: Black, 1: Rain & First Text, 2: Enter button
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();

  // Web Audio elements for synthesising the low 40Hz sub-bass drone
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);

  // Sequence timings
  useEffect(() => {
    // 0.5s: Fades in Silver Rain and begins text sequence
    const t1 = setTimeout(() => {
      setStep(1);
      if (soundEnabled) {
        startDrone();
      }
    }, 500);

    // 5.0s: Transition to "Enter." button
    const t2 = setTimeout(() => {
      setStep(2);
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      stopDrone();
    };
  }, []);

  // Web Audio synth logic
  const startDrone = () => {
    try {
      if (audioCtxRef.current) return; // Already running

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 40; // 40Hz sub-bass drone

      // Set volume to 0 initially
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      // Volume ramps from 0 to -22dB (approx 0.08 linear gain) over 2.0s
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2.0);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();

      oscRef.current = osc;
      gainRef.current = gainNode;
    } catch (e) {
      console.warn("Web Audio drone failed to start:", e);
    }
  };

  const stopDrone = (fadeOutTime = 0.5) => {
    const ctx = audioCtxRef.current;
    const gainNode = gainRef.current;
    const osc = oscRef.current;

    if (ctx && gainNode && osc) {
      try {
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOutTime);
        
        setTimeout(() => {
          try {
            osc.stop();
            ctx.close();
          } catch(e) {}
          audioCtxRef.current = null;
          oscRef.current = null;
          gainRef.current = null;
        }, fadeOutTime * 1000);
      } catch (e) {
        console.warn("Error stopping drone:", e);
      }
    }
  };

  // Toggle sound mid-sequence
  const toggleSound = () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      stopDrone(0.2);
    } else {
      setSoundEnabled(true);
      // Need user gesture, which this click is
      startDrone();
    }
  };

  const handleEnterClick = () => {
    setFadeOut(true);
    stopDrone(0.6);
    setTimeout(() => {
      enterSanctum();
      navigate('/home');
    }, 600);
  };

  const handleSkipClick = () => {
    stopDrone(0.1);
    skipEntry();
    navigate('/home');
  };

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
        transition: 'opacity 0.6s ease',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Background canvas Silver Rain */}
      {step >= 1 && <SilverRain />}

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
          alignItems: 'center'
        }}
      >
        {step === 1 && (
          <p 
            className="fade-in"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              color: 'var(--bone-white)',
              letterSpacing: '0.05em',
              transition: 'opacity 0.6s ease',
              animationDuration: '0.8s'
            }}
          >
            Before the Sanctum, there was only the world.
          </p>
        )}

        {step === 2 && (
          <div className="fade-in">
            <button
              onClick={handleEnterClick}
              className="silver-hover"
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-display)',
                fontSize: '96px',
                color: 'var(--bone-white)',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--cold-silver)',
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-width 0.2s, border-bottom-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderBottomWidth = '2px';
                e.target.style.borderBottomColor = 'var(--bone-white)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderBottomWidth = '1px';
                e.target.style.borderBottomColor = 'var(--cold-silver)';
              }}
            >
              Enter.
            </button>
          </div>
        )}
      </div>

      {/* Bottom left corner: Logo branding */}
      <div 
        className="ui-text"
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '40px',
          color: 'var(--ash-grey)',
        }}
      >
        GAUDDLY
      </div>

      {/* Bottom right corner: Controls */}
      <div 
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          zIndex: 20
        }}
      >
        {/* Sound toggle button */}
        <button 
          onClick={toggleSound}
          className="ui-text silver-hover"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--ash-grey)', 
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {soundEnabled ? 'Sound: On' : 'Sound: Off'}
        </button>

        {/* Skip button */}
        <button 
          onClick={handleSkipClick}
          className="ui-text silver-hover"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--ash-grey)', 
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
