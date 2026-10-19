import { supabase, publicRead } from './supabase';
import { cachedRequest } from './request-cache';

export const loadPublicHomeCatalog = cachedRequest(async () => {
  const [products, castes, episodes] = await publicRead('home-catalog');
  return { products, castes, episodes, failed: false };
});
export const loadPublishedHome = cachedRequest(async () => (await publicRead('home'))[0]);

// Admin preview reads Supabase directly so editors always see live rows.

export async function loadHomeCatalog() {
  const results = await Promise.all([
    supabase.from('products').select('id,name,price,caste_id,passage,product_images(r2_key,sort_order)').eq('is_published', true).order('sort_order'),
    supabase.from('castes').select('id,name,hero_r2_key,passage').neq('id', 'old-world').order('sort_order'),
    supabase.from('episodes').select('id,title,status,still_r2_key,video_r2_key').eq('status', 'released').order('sort_order'),
  ]);
  return { products: results[0].data || [], castes: results[1].data || [], episodes: results[2].data || [], failed: results.some(r => r.error) };
}
