# Checkout

Covers FR-009, FR-010 and FR-011. Source: `src/pages/PieceDetail.jsx`, `src/components/CartDrawer.jsx`, `src/pages/Checkout.jsx`.

## As built

```mermaid
sequenceDiagram
  participant U as Customer
  participant P as PieceDetail
  participant Ctx as AppContext (localStorage)
  participant CK as Checkout
  participant F as create-order (not in repo)
  participant DB as Postgres

  U->>P: select size, "Claim garment"
  P->>Ctx: addToCart({id, name, price, size, image})
  Ctx-->>U: cart drawer opens
  U->>CK: /checkout
  alt no session
    CK-->>U: redirect /login?redirect=/checkout
  end
  U->>CK: shipping details, "Confirm claim"
  CK->>F: { items: [{productId, size, quantity}], shipping }
  F->>DB: insert orders + order_items (pricing assumed server-side, ASSUMPTION-007)
  alt success
    F-->>CK: { orderId }
    CK->>Ctx: clearCart()
    CK-->>U: "Your claim has been received." Claim #xxxxxxxx
  else error
    F-->>CK: 4xx/5xx { error }
    CK-->>U: role="alert" message, cart kept
  end
  Note over DB: status later changed by an admin by hand (ADR-011)
```

## Planned payment step (FR-011, PH-4, not built)

```mermaid
sequenceDiagram
  participant CK as Checkout
  participant F as create-order
  participant PP as Payment provider (to be chosen)
  participant W as payment-webhook (planned)
  participant DB as Postgres

  CK->>F: items + shipping
  F->>DB: order status = pending, server-computed total
  F->>PP: create payment for total
  F-->>CK: provider session
  CK->>PP: customer pays
  PP->>W: signed event
  W->>W: verify signature
  W->>DB: status = paid or failed
```
