# Homepage draft, preview and publish

Covers FR-003 and FR-027. Source: `src/pages/admin/AdminHomepage.jsx`, `supabase/migrations/202610150001_homepage.sql`. Guide: [docs/homepage.md](../docs/homepage.md).

```mermaid
sequenceDiagram
  participant A as Admin editor
  participant P as Preview /admin/homepage/preview<br/>(side frame or own tab)
  participant DB as homepage_content
  participant V as Visitor /home

  A->>DB: select draft, published, revision, updated_at (RLS: admins only)
  DB-->>A: draft, published, revision = r, updated_at
  P->>A: postMessage hp-ready
  loop Each edit (sections, media uploaded to R2)
    A->>P: postMessage hp-draft (draft, catalog)
    P->>P: render HomeExperience(draft, preview=true)<br/>links and signup disabled
  end
  alt Save draft
    A->>DB: save_homepage(content, expected_revision=r, publish=false)
  else Publish (no draft save needed first)
    A->>DB: save_homepage(content, expected_revision=r, publish=true)
  end
  alt revision matches and caller is admin
    DB-->>A: r+1
    A->>A: draft: message "Draft saved. Visitors still see the published homepage."<br/>publish: toast "Published. The homepage is now live."
  else stale revision
    DB-->>A: "Another editor saved changes. Reload before saving."
    A->>A: conflict banner
    alt Load their version
      A->>DB: select draft, published, revision, updated_at
      DB-->>A: their draft, revision = r2
    else Replace theirs with mine
      A->>DB: select revision
      DB-->>A: r2
      A->>DB: save_homepage(content, expected_revision=r2, publish=false)
      DB-->>A: r2+1
    end
  end
  V->>DB: get_homepage() through /api/home (Redis-cached, NFR-008)
  DB-->>V: published only
  V->>V: normalizeHome() then render (defaults if null)
```
