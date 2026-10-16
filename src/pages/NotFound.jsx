import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <div className="fade-in not-found">
      <Seo title="Not Found" description="The requested chamber could not be found." noIndex />
      <span className="ui-text">Error 404</span>
      <h1 className="display-l">This chamber does not exist.</h1>
      <p className="body-l">The path has vanished from the Sanctum.</p>
      <Link to="/home" className="underlined-link">Return to the Old World →</Link>
    </div>
  );
}

