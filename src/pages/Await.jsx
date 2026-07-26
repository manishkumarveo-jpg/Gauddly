import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SilverRain from '../components/SilverRain';
import { supabase } from '../lib/supabase';

export default function Await() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSubmitted) {
      // Hold for 3 seconds, then redirect to home
      const timer = setTimeout(() => {
        navigate('/home');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email.trim()) {
      // Ignore errors here (e.g. duplicate signup) - either way the visitor gets the same confirmation
      await supabase.from('waitlist_signups').insert({ email: email.trim() });
      setIsSubmitted(true);
    }
  };

  return (
    <div 
      style={{ 
        backgroundColor: 'var(--void-black)', 
        color: 'var(--bone-white)', 
        height: '100vh', 
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 4000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 24px',
      }}
      className="fade-in"
    >
      {/* Subtle 15% opacity Silver Rain canvas */}
      <SilverRain opacity={0.15} />

      <div style={{ zIndex: 10, textAlign: 'center', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {!isSubmitted ? (
          <>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, marginBottom: '16px' }}>
                The chamber is sealed.
              </h1>
              <p className="body-l" style={{ fontStyle: 'italic', color: 'var(--bone-white)' }}>
                You will be told when it opens.
              </p>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginTop: '20px', width: '100%' }}>
              <input 
                type="email" 
                required
                placeholder="your address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--cold-silver)',
                  padding: '8px 0',
                  color: 'var(--bone-white)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '20px',
                  outline: 'none',
                }}
                className="silver-hover system-cursor-override"
              />
              
              <button 
                type="submit" 
                className="silver-hover"
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  color: 'var(--bone-white)',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--cold-silver)',
                  paddingBottom: '6px',
                  outline: 'none',
                }}
              >
                Enter.
              </button>
            </form>
          </>
        ) : (
          <div className="fade-in">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300 }}>
              You will be told.
            </h2>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        input::placeholder {
          color: var(--ash-grey) !important;
          opacity: 0.5;
          font-style: italic;
        }
      `}} />
    </div>
  );
}
