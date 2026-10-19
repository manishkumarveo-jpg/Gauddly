# Homepage draft, preview and publish

Covers FR-003 and FR-027. Source: `src/pages/admin/AdminHomepage.jsx`, `supabase/migrations/202610150001_homepage.sql`. Guide: [docs/homepage.md](../docs/homepage.md).

```mermaid
sequenceDiagram
  participant A as Admin editor
  participant DB as homepage_content
  participant V as Visitor /home

  A->>DB: select draft, revision (RLS: admins only)
  DB-->>A: draft, revision = r
  A->>A: edit sections, upload media to R2
  opt Preview
    A->>A: render HomeExperience(draft, preview=true)<br/>links and signup disabled
  end
  A->>DB: save_homepage(content, expected_revision=r, publish=false)
  alt revision matches and caller is admin
    DB-->>A: r+1 ("Draft saved. The public homepage has not changed.")
  else stale revision
    DB-->>A: "Another editor saved changes. Reload before saving."
  end
  A->>DB: save_homepage(content, r+1, publish=true)
  DB-->>A: r+2 ("Published. The homepage is now live.")
  V->>DB: get_homepage()
  DB-->>V: published only
  V->>V: normalizeHome() then render (defaults if null)
```
