import { mediaUrl } from '../../lib/supabase';

export const formatPrice = (p) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

export const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// A readable reference derived from the order's uuid; also what customers quote to support
export const orderRef = (o) => `GD-${new Date(o.created_at).getFullYear()}-${o.id.slice(0, 6).toUpperCase()}`;

export const productPath = (p) => `/the-${p.caste_id}/${p.id}`;

export const firstImageUrl = (images = []) => {
  const first = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).find((i) => i.r2_key);
  return first ? mediaUrl(first.r2_key) : null;
};
