# Authentication and admin routing

Covers FR-013, FR-016 and FR-021. Source: `src/pages/Login.jsx`, `src/context/AppContext.jsx`, `src/pages/admin/AdminLayout.jsx`.

## Sign-in redirect

```mermaid
flowchart TD
  A["/login?redirect=…"] --> B["safeInternalPath(redirect)<br/>fallback /home"]
  B --> C{"signInWithPassword ok?"}
  C -- no --> E["Show error<br/>'The email or password is incorrect…'"]
  C -- yes --> D["select is_admin from profiles"]
  D --> F{"is_admin and redirect<br/>not starting with /admin?"}
  F -- yes --> G["navigate /admin"]
  F -- no --> H["navigate redirect"]
```

## Admin guard and entry points

```mermaid
sequenceDiagram
  participant B as Browser
  participant C as AppContext
  participant S as Supabase
  participant L as AdminLayout

  B->>C: app loads
  C->>S: auth.getSession()
  S-->>C: session (or null)
  C->>S: profiles.is_admin for session.user.id
  Note over C: isAdmin = null until the answer for this user ID arrives
  S-->>C: is_admin
  C-->>B: Navigation shows "Admin" link if isAdmin
  B->>L: open /admin/...
  alt not loaded or isAdmin === null
    L-->>B: render nothing
  else no user
    L-->>B: Navigate /login?redirect=<path>
  else isAdmin false
    L-->>B: "Not authorized."
  else isAdmin true
    L-->>B: studio
  end
```

The UI guard is display-only. Data protection depends on RLS (R-02).
