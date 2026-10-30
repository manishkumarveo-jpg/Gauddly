// Shared by the customer Claims view and the admin claims queue
export const CLAIM_KINDS = {
  return: 'Return or exchange',
  alteration: 'Alteration or fit',
  damage: 'Damaged or faulty item',
  delivery: 'Delivery problem',
  other: 'Something else',
};

export const CLAIM_STATUS = {
  open: { label: 'Open', colour: '#d9a65a' },
  in_progress: { label: 'In progress', colour: '#7fb2d9' },
  resolved: { label: 'Resolved', colour: '#8fbf8f' },
  cancelled: { label: 'Cancelled', colour: 'var(--ash-grey)' },
};
