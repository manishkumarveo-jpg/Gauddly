import { useLocation } from 'react-router-dom';
import Seo from './Seo';
import { PAGE_META } from '../lib/navigation';

export default function RouteSeo() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return <Seo title="Administration" noIndex />;
  const [title, description] = PAGE_META[pathname] || ['The Sanctum', undefined];
  return <Seo title={title} description={description} noIndex={['/login', '/forgot-password', '/reset-password'].includes(pathname)} />;
}

