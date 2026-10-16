import { useEffect, useState } from 'react';
import { freshHome, normalizeHome } from '../lib/homepage';
import { loadPublicHomeCatalog, loadPublishedHome } from '../lib/homepage-api';
import HomeExperience from '../components/HomeExperience';

export default function Home() {
  const [content, setContent] = useState(freshHome);
  const [contentReady, setContentReady] = useState(false);
  const [catalog, setCatalog] = useState({ products: [], castes: [], episodes: [] });
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    loadPublicHomeCatalog().then(result => { if (active) setCatalog(result); }).catch(() => {
      if (active) setCatalog({ products: [], castes: [], episodes: [], failed: true });
    }).finally(() => { if (active) setLoading(false); });
    loadPublishedHome().then(data => {
      if (active && data) setContent(normalizeHome(data));
    }).catch(() => {}).finally(() => { if (active) setContentReady(true); });
    return () => { active = false; };
  }, [attempt]);
  // Hold the hero until published content settles, so the default copy never flashes first
  if (!contentReady) return <section className="home-hero" aria-busy="true" aria-label="Loading" />;
  return <>
    {catalog.failed && <div className="home-load-error" role="alert">Some collections could not load. <button onClick={() => setAttempt(n => n + 1)}>Try again</button></div>}
    <HomeExperience content={content} catalog={catalog} loading={loading} />
  </>;
}
