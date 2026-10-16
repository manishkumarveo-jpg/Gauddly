import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppContext } from './app-context';

function readStoredJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function AppProvider({ children }) {
  // Cart state
  const [cart, setCart] = useState(() => readStoredJson('gauddly_cart', []));

  // Auth session
  const [session, setSession] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('gauddly_sound_enabled') === 'true';
  });

  // Entry sequence bypass (30 days expiry)
  const [isEntered, setIsEntered] = useState(() => {
    const enteredAt = localStorage.getItem('gauddly_entered_at');
    if (enteredAt) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(enteredAt, 10) < thirtyDays) {
        return true;
      }
    }
    return false;
  });

  // Codex unlocked chapters state (unlocked over time / release cycle)
  const [unlockedChapters, setUnlockedChapters] = useState(() => {
    // Default: Chapter 1 is always unlocked.
    return readStoredJson('gauddly_unlocked_chapters', [1]);
  });

  // Cart Drawer open state
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('gauddly_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync sound setting to local storage
  useEffect(() => {
    localStorage.setItem('gauddly_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  // Enter the Sanctum (sets the entry timestamp)
  const enterSanctum = () => {
    localStorage.setItem('gauddly_entered_at', Date.now().toString());
    setIsEntered(true);
  };

  // Skip the entry directly
  const skipEntry = () => {
    enterSanctum();
  };

  // Reset entry (for testing / manual retry after 30 days)
  const resetEntry = () => {
    localStorage.removeItem('gauddly_entered_at');
    setIsEntered(false);
  };

  // Add to cart silently
  const addToCart = (item) => {
    setCart((prev) => {
      // Check if item of same id AND size exists
      const existing = prev.find(i => i.id === item.id && i.size === item.size);
      if (existing) {
        return prev.map(i => 
          (i.id === item.id && i.size === item.size) 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Remove from cart
  const removeFromCart = (itemId, size) => {
    setCart((prev) => prev.filter(i => !(i.id === itemId && i.size === size)));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Unlock a Codex chapter
  const unlockChapter = (chapterNum) => {
    setUnlockedChapters((prev) => {
      if (prev.includes(chapterNum)) return prev;
      const next = [...prev, chapterNum];
      localStorage.setItem('gauddly_unlocked_chapters', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isEntered,
        enterSanctum,
        skipEntry,
        resetEntry,
        soundEnabled,
        setSoundEnabled,
        unlockedChapters,
        unlockChapter,
        isCartOpen,
        setIsCartOpen,
        session,
        user: session?.user ?? null,
        sessionLoaded,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
