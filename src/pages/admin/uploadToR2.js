import { supabase, edgeFunctionErrorMessage } from '../../lib/supabase';

// Spaces/parentheses/unicode in a raw filename can get encoded differently
// between the edge function's presign step and the browser's actual PUT,
// which breaks the AWS SigV4 signature and R2 rejects the upload with a 403.
// Strip the key down to safe characters so signing and the request always match.
export function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

// Asks the admin-upload-url Edge Function (checks is_admin server-side) to
// sign an R2 request URL for the given method.
async function getSignedR2Url(key, method) {
  const { data, error } = await supabase.functions.invoke('admin-upload-url', {
    body: { key, method },
  });
  if (error) throw new Error(await edgeFunctionErrorMessage(error));
  return data.url;
}

// Uploads a file directly to R2 via a presigned PUT URL. Uses XMLHttpRequest
// instead of fetch for the actual PUT - fetch has no way to report upload
// progress, XHR's upload.onprogress does.
export async function uploadToR2(key, file, onProgress) {
  const url = await getSignedR2Url(key, 'PUT');

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 upload failed (${xhr.status})${xhr.responseText ? `: ${xhr.responseText}` : ''}`));
      }
    };
    xhr.onerror = () => reject(new Error('R2 upload failed: network error'));
    xhr.send(file);
  });
}

// Deletes an object from R2 by key - same presigned-URL pattern as uploads,
// just signed for DELETE instead of PUT. A 404 counts as success: the object
// not existing is the desired end state either way.
export async function deleteFromR2(key) {
  const url = await getSignedR2Url(key, 'DELETE');
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    const detail = await res.text().catch(() => '');
    throw new Error(`R2 delete failed (${res.status})${detail ? `: ${detail}` : ''}`);
  }
}
