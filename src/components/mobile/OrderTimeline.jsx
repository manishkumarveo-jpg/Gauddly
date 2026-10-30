import React from 'react';
import './mobile.css';

export default function OrderTimeline({ status, createdAt }) {
  // Map internal status ('pending', 'paid', 'fulfilled', 'cancelled') to 5-step pipeline:
  // Step 1: Order Placed
  // Step 2: Production
  // Step 3: Quality Check
  // Step 4: Shipped
  // Step 5: Delivered

  const isCancelled = status === 'cancelled' || status === 'failed';

  let currentStep = 1;
  if (status === 'paid') currentStep = 2; // In Production
  if (status === 'fulfilled') currentStep = 4; // Shipped / Out for delivery

  const dateStr = createdAt ? new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : 'Recently';

  const timeStr = createdAt ? new Date(createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }) : '';

  const steps = [
    {
      id: 1,
      title: 'Order Placed',
      meta: `${dateStr}${timeStr ? ` · ${timeStr}` : ''}`,
      activeSubtext: 'Your made-to-order garment has been recorded.',
    },
    {
      id: 2,
      title: 'Production',
      meta: currentStep >= 2 ? 'In Progress' : 'Pending',
      activeSubtext: 'Hand-dyeing and crafting in our Delhi atelier.',
    },
    {
      id: 3,
      title: 'Quality Check',
      meta: currentStep >= 3 ? 'Completed' : 'Pending',
      activeSubtext: 'Detailed inspection of stitch and dye uniformity.',
    },
    {
      id: 4,
      title: 'Shipped',
      meta: currentStep >= 4 ? 'Dispatched' : 'Pending',
      activeSubtext: 'Dispatched via premium express courier.',
    },
    {
      id: 5,
      title: 'Delivered',
      meta: currentStep >= 5 ? 'Delivered' : 'Pending',
      activeSubtext: 'Arrived at your sanctuary.',
    },
  ];

  if (isCancelled) {
    return (
      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '14px' }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Order Cancelled</div>
        <div style={{ fontSize: '12px', color: 'var(--ash-grey)' }}>This order was cancelled and will not proceed into production.</div>
      </div>
    );
  }

  return (
    <div className="order-stepper" aria-label="Production and Fulfillment Timeline">
      <div className="order-stepper-track" />
      {steps.map((step) => {
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isPending = currentStep < step.id;

        return (
          <div
            key={step.id}
            className={`order-step ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''} ${isPending ? 'is-pending' : ''}`}
          >
            <div className="order-step-node" aria-hidden="true">
              {isDone ? '✓' : isActive ? '●' : '○'}
            </div>
            <div className="order-step-title">
              {step.title}
            </div>
            <div className="order-step-meta">
              {step.meta}
            </div>
            {isActive && step.activeSubtext && (
              <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                {step.activeSubtext}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

