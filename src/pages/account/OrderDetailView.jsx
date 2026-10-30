import React, { useState } from 'react';
import { formatPrice, formatDate, orderRef, firstImageUrl } from './format';
import OrderTimeline from '../../components/mobile/OrderTimeline';

export default function OrderDetailView({ order, onBack, onRaiseClaim }) {
  const [copied, setCopied] = useState(false);
  const ref = orderRef(order);
  const [first] = order.order_items || [];
  const image = first && firstImageUrl(first.products?.product_images);

  const handleCopy = () => {
    navigator.clipboard?.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPaid = order.status === 'paid' || order.status === 'fulfilled';

  return (
    <div className="order-detail-view" style={{ width: '100%', paddingBottom: '32px' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--ash-grey)',
          fontFamily: 'var(--font-body)',
          fontSize: '15px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
          marginBottom: '16px',
        }}
      >
        <span>&larr; Back to all orders</span>
      </button>

      {/* Header info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--bone-white)', margin: 0, fontWeight: 400 }}>
            Order Details
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--cold-silver)' }}>
              Order ID: {ref}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              style={{ background: 'none', border: 'none', color: 'var(--ash-grey)', cursor: 'pointer', fontSize: '12px' }}
              title="Copy Order ID"
            >
              {copied ? '✓ Copied' : '📋'}
            </button>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ash-grey)', marginTop: '2px' }}>
            Placed on {formatDate(order.created_at)}
          </div>
        </div>

        {order.invoice_url && (
          <a
            href={order.invoice_url}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid var(--cold-silver)',
              color: 'var(--bone-white)',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            Download Invoice &darr;
          </a>
        )}
      </div>

      {/* Garment Summary Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
        {order.order_items.map((item, idx) => {
          const itemImg = firstImageUrl(item.products?.product_images) || image;
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                backgroundColor: 'var(--mobile-card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--mobile-card-border)',
              }}
            >
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '8px',
                backgroundColor: '#161616',
                border: '1px solid var(--mobile-card-border)',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                {itemImg ? (
                  <img src={itemImg} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--ash-grey)' }}>Garment</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--bone-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product_name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--bone-white)' }}>
                    {formatPrice(item.unit_price)}
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ash-grey)', marginTop: '4px' }}>
                  Size: {item.size} • Qty: {item.quantity}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <span className={`pill-status ${isPaid ? 'pill-status--paid' : 'pill-status--pending'}`}>
                    <span className="pill-dot" />
                    {isPaid ? 'Paid' : 'Pending'}
                  </span>
                  <span className="pill-status pill-status--processing">
                    <span className="pill-dot" />
                    {order.status === 'fulfilled' ? 'Dispatched' : 'In production'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Production & Fulfillment Stepper Timeline */}
      <div style={{
        marginTop: '28px',
        padding: '24px 20px',
        backgroundColor: 'var(--mobile-card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--mobile-card-border)',
      }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ash-grey)', marginBottom: '4px' }}>
          Production &amp; Fulfillment
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ash-grey)', marginBottom: '16px' }}>
          Each made-to-order relic moves through hand-crafting in our Delhi atelier.
        </div>
        <OrderTimeline status={order.status} createdAt={order.created_at} />
      </div>

      {/* Shipping Address & Payment Breakdown */}
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: 'var(--mobile-card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--mobile-card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ash-grey)', marginBottom: '6px' }}>
            Shipping Address
          </div>
          <div style={{ fontSize: '14px', color: 'var(--bone-white)', lineHeight: 1.5 }}>
            {order.shipping_name && <div style={{ fontWeight: 500 }}>{order.shipping_name}</div>}
            {order.shipping_address_line1 && <div>{order.shipping_address_line1}</div>}
            {order.shipping_address_line2 && <div>{order.shipping_address_line2}</div>}
            {(order.shipping_city || order.shipping_postal_code) && (
              <div>{order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}</div>
            )}
            {!order.shipping_address_line1 && (
              <div style={{ color: 'var(--ash-grey)', fontStyle: 'italic' }}>Provided at checkout</div>
            )}
          </div>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--mobile-card-border)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--ash-grey)', marginBottom: '8px' }}>
            Payment Summary
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0' }}>
            <span style={{ color: 'var(--ash-grey)' }}>Payment Method</span>
            <span style={{ color: 'var(--bone-white)' }}>{order.payment_method || 'UPI / Online'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0' }}>
            <span style={{ color: 'var(--ash-grey)' }}>Payment Status</span>
            <span style={{ color: isPaid ? '#34d399' : '#fbbf24' }}>{isPaid ? 'Paid' : 'Pending'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 500, paddingTop: '8px', borderTop: '1px dashed var(--mobile-card-border)', marginTop: '4px' }}>
            <span style={{ color: 'var(--bone-white)' }}>Total</span>
            <span style={{ color: 'var(--bone-white)', fontFamily: 'var(--font-display)', fontSize: '20px' }}>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onRaiseClaim(order.id)}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '999px',
            backgroundColor: 'transparent',
            border: '1px solid var(--cold-silver)',
            color: 'var(--bone-white)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            cursor: 'pointer',
            textAlign: 'center',
            minWidth: '160px',
          }}
        >
          Raise a claim &rarr;
        </button>
        <a
          href="mailto:contact@gauddly.com"
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '999px',
            backgroundColor: 'var(--mobile-card-bg)',
            border: '1px solid var(--mobile-card-border)',
            color: 'var(--bone-white)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            textDecoration: 'none',
            textAlign: 'center',
            minWidth: '160px',
          }}
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
