import { supabase, edgeFunctionErrorMessage } from '../../lib/supabase';

// Requests a presigned R2 PUT URL from the admin-upload-url Edge Function
// (which checks is_admin server-side) and uploads the file directly to R2.
export async function uploadToR2(key, file) {
  const { data, error } = await supabase.functions.invoke('admin-upload-url', {
    body: { key, contentType: file.type },
  });
  if (error) throw new Error(await edgeFunctionErrorMessage(error));

  const putRes = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error(`R2 upload failed (${putRes.status})`);
}
