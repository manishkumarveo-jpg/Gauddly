import { supabase } from '../../lib/supabase';
import { deleteFromR2 } from './uploadToR2';

const FOREIGN_KEY_VIOLATION = '23503';
// Only our own bucket keys can be deleted: /public files and full URLs are left alone.
export const isStorageKey = key => Boolean(key) && !key.startsWith('/') && !/^https?:\/\//i.test(key);

// Deletes a garment, then its files. One statement, so the database removes everything or nothing: photos
// and sizes cascade, and order_items keep their own copy with product_id set to null (live schema, 2026-10-19).
export async function deleteProduct(product) {
  const { data, error } = await supabase.from('products').delete().eq('id', product.id).select('id');
  if (error) {
    throw new Error(error.code === FOREIGN_KEY_VIOLATION
      ? `“${product.name}” is part of past orders, so it can’t be deleted. Move it to draft instead.`
      : error.message);
  }
  // RLS turns a refused delete into zero rows, not an error; files must stay while the garment does.
  if (!data?.length) throw new Error(`“${product.name}” could not be deleted. Reload the page and try again.`);
  const keys = [...(product.product_images || []).map(image => image.r2_key), product.video_r2_key].filter(isStorageKey);
  const failedFiles = [];
  for (const key of keys) {
    try { await deleteFromR2(key); } catch { failedFiles.push(key); }
  }
  return { failedFiles };
}
