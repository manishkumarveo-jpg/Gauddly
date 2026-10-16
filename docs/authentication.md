# Sign-in and password recovery

The sign-in page uses the existing Supabase password authentication. Explicit internal `redirect` destinations are preserved through sign-in, signup and recovery. Direct admin sign-ins still open `/admin`; other direct sign-ins open `/home`.

The desktop photograph comes from an existing catalog asset. Set `VITE_AUTH_IMAGE_URL` to another public image URL or R2 key to replace it, then restart/rebuild Vite. Mobile uses a tiny inline image source and hides the photograph to avoid the desktop download.

## Password recovery setup

`/forgot-password` sends a Supabase recovery email. `/reset-password` waits for Supabase to read the recovery session from the email link, then updates the password. Missing or expired sessions offer a fresh reset link. Existing signed-in sessions can also update their own password here.

In Supabase Authentication → URL Configuration, allow the reset callback for each deployment, including its query string. For local development on this port, the redirect pattern is `http://localhost:5173/reset-password**`. Add the equivalent HTTPS URL for the actual production domain. Keep the Site URL set to the intended deployed website. The email template must use Supabase's confirmation URL so that the recovery session is established before redirecting.

Email delivery requires a functioning Supabase email provider/SMTP setup. Browser verification uses intercepted auth responses and does not send emails or change a real account password. Verify delivery with a designated test account after checking the project's redirect allowlist and email settings.
