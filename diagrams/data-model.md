# Data model

Explained in [architecture/data-model.md](../architecture/data-model.md). Only `HOMEPAGE_CONTENT` is defined in the repository. Every other entity and relationship is inferred from frontend queries.

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "id"
  PROFILES ||--o{ ORDERS : "places (inferred owner column)"
  ORDERS ||--|{ ORDER_ITEMS : contains
  CASTES ||--o{ PRODUCTS : groups
  PRODUCTS ||--o{ PRODUCT_IMAGES : has
  PRODUCTS ||--o{ PRODUCT_SIZES : has

  PROFILES {
    uuid id PK
    boolean is_admin
    text full_name
    jsonb default_address
  }
  CASTES {
    text id PK
    text name
    text hero_r2_key
    text passage
    int sort_order
  }
  PRODUCTS {
    text id PK
    text caste_id FK
    text name
    text num
    text sku
    numeric price
    text passage
    text craft
    boolean is_published
    text video_r2_key
    int sort_order
  }
  PRODUCT_IMAGES {
    id id PK
    text product_id FK
    text r2_key
    int sort_order
    text alt
  }
  PRODUCT_SIZES {
    text product_id FK
    text size
    boolean in_stock
  }
  ORDERS {
    uuid id PK
    text email
    text name
    text phone
    text status
    numeric subtotal
    numeric total
    timestamptz created_at
  }
  ORDER_ITEMS {
    uuid order_id FK
    text product_name
    text size
    numeric unit_price
    int quantity
  }
  EPISODES {
    text id PK
    text num
    text title
    text status
    text still_r2_key
    text video_r2_key
    text description
    text director_note
    date release_date
    int sort_order
  }
  WAITLIST_SIGNUPS {
    text email UK
  }
  HOMEPAGE_CONTENT {
    text id PK "always 'homepage'"
    jsonb draft
    jsonb published
    bigint revision
    timestamptz updated_at
  }
```

`TOP_PRODUCTS` (ASSUMPTION-009) is a read-only view over `ORDER_ITEMS` and `ORDERS`, so it is not drawn as an entity.
