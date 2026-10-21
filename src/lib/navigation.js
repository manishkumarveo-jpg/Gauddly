export function safeInternalPath(value, fallback = '/home') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}

// Title and description for each public route (used for page metadata and the homepage editor's link picker).
export const PAGE_META = {
  '/': ['The Sanctum', 'Enter Gauddly: a house of hand-dyed, made-to-order garments from Delhi.'],
  '/home': ['The Old World', 'Enter the Old World and discover the garments, films, and chapters of the Sanctum.'],
  '/store': ['Store', 'Explore every made-to-order Gauddly garment, gathered from the castes of the Sanctum.'],
  '/codex': ['Codex', 'Read the unfolding chapters and mythology of the Gauddly Sanctum.'],
  '/the-sanctum': ['The Sanctum', 'Discover the world, craft, and creative direction behind Gauddly.'],
  '/old-world': ['Archive', 'Explore garments and relics from the Gauddly archive.'],
  '/episodes': ['Films', 'Watch the chronicles and films of the Gauddly Sanctum.'],
  '/await': ['Await', 'Join the Gauddly list and be told when the next chamber opens.'],
  '/checkout': ['Checkout', 'Confirm your Gauddly claim and delivery details.'],
  '/login': ['Sign In', 'Sign in to your Gauddly account.'],
  '/forgot-password': ['Forgot Password', 'Request a password-reset link for your Gauddly account.'],
  '/reset-password': ['Reset Password', 'Choose a new password for your Gauddly account.'],
  '/signup': ['Create Account', 'Create a Gauddly account to claim garments and track orders.'],
  '/account': ['Account', 'Manage your Gauddly profile and review your claims.'],
  '/shipping': ['Shipping', 'Shipping timelines and delivery information for Gauddly made-to-order garments.'],
  '/returns': ['Returns', 'Returns, exchanges, and order-change information for Gauddly garments.'],
  '/privacy': ['Privacy', 'How Gauddly handles account, order, and website information.'],
  '/terms': ['Terms', 'Terms governing use of the Gauddly website and made-to-order purchases.'],
  '/size-care': ['Size & Care', 'Fit guidance and care instructions for Gauddly garments.'],
  '/contact': ['Contact', 'Write to the Gauddly studio about a claim, fit, care or press.'],
};
