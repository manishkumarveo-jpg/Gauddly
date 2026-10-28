// Facts only the owner can supply. They render in [BRACKETS] until filled in, and must be completed
// before launch: the E-Commerce Rules and the DPDP Act require the seller and grievance details.
export const FACTS = {
  legalName: '[LEGAL ENTITY NAME]',
  address: '[REGISTERED ADDRESS]',
  gstin: '[GSTIN]',
  grievanceName: '[FULL NAME]',
  grievanceTitle: '[TITLE]',
  grievanceEmail: '[EMAIL]',
  lastUpdated: '[DATE]',
  shippingRates: '[Rates for India and international orders]',
  faultRemedy: '[a repair, replacement or refund]',
};

export const mail = subject => `mailto:contact@gauddly.com?subject=${encodeURIComponent(subject)}`;
