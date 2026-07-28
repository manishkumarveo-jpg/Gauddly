import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition
 * Wraps page content in a fade+translateY animation whenever the route changes.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    setDisplayChildren(children);
    setKey(location.pathname);
  }, [location.pathname, children]);

  return (
    <div
      key={key}
      className="page-enter"
      style={{ minHeight: '100%' }}
    >
      {displayChildren}
    </div>
  );
}
