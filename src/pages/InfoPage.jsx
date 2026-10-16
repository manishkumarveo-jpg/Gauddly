import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PAGES = {
  shipping: {
    eyebrow: 'Customer care',
    title: 'Shipping',
    intro: 'Every garment is prepared in Delhi after your claim is confirmed.',
    sections: [
      ['Making time', 'Made-to-order garments normally require 14–21 days before dispatch. If a piece needs longer, we will contact you at the email used for the order.'],
      ['Delivery', 'A tracking link is sent after dispatch. Delivery time begins after the garment leaves our studio and can vary by destination and carrier.'],
      ['Address changes', 'Email contact@gauddly.com as soon as possible with your claim number. We cannot guarantee an address change after dispatch.'],
      ['Delays or loss', 'If tracking has not moved or a parcel appears lost, contact us and we will investigate with the carrier.'],
    ],
  },
  returns: {
    eyebrow: 'Customer care',
    title: 'Returns & Exchanges',
    intro: 'Our garments are made to order. Please review your size and details carefully before confirming a claim.',
    sections: [
      ['Order changes', 'Request a size or address change within 24 hours by emailing contact@gauddly.com. Changes are subject to whether production has begun.'],
      ['Made-to-order pieces', 'Routine returns are not accepted once production begins. This does not affect remedies available for damaged, defective, or incorrectly supplied garments.'],
      ['Problems on arrival', 'Contact us within 48 hours of delivery with your claim number and clear photographs of the garment and packaging. We will review the issue and arrange the appropriate resolution.'],
      ['Return condition', 'Any approved return must be unworn, unwashed, unaltered, and sent with its original packaging and tags.'],
    ],
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy',
    intro: 'We collect only the information needed to operate accounts, fulfil claims, and communicate with you.',
    sections: [
      ['Information we use', 'This may include your name, email address, delivery address, phone number, account details, order history, and messages sent to us.'],
      ['Why we use it', 'We use this information to provide the website, process and deliver orders, prevent misuse, respond to support requests, and send updates you requested.'],
      ['Service providers', 'Trusted providers may process information for authentication, hosting, storage, delivery, analytics, and order operations. They receive only the information needed to perform their service.'],
      ['Your choices', 'You may request access, correction, or deletion of eligible personal information by emailing contact@gauddly.com.'],
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms',
    intro: 'These terms apply when you use Gauddly or submit a claim for a garment.',
    sections: [
      ['Orders', 'An order is accepted only when Gauddly confirms it. We may contact you if stock, sizing, pricing, delivery, or production information needs correction.'],
      ['Made-to-order variation', 'Hand finishing and dye processes can produce small variations. These are part of the garment character and are not necessarily defects.'],
      ['Website content', 'Gauddly artwork, films, writing, photography, garment designs, and branding may not be reproduced or commercially used without permission.'],
      ['Contact', 'Questions about an order or these terms can be sent to contact@gauddly.com.'],
    ],
  },
  'size-care': {
    eyebrow: 'Garment guide',
    title: 'Size & Care',
    intro: 'Choose the size you normally wear unless a product description says the silhouette is intentionally fitted or oversized.',
    sections: [
      ['Finding your size', 'Measure around the fullest part of your chest, your natural waist, and the fullest part of your seat. Keep the tape level and comfortably close to the body.'],
      ['Between sizes', 'For a closer silhouette choose the smaller size; for ease and layering choose the larger. Email contact@gauddly.com with your measurements and garment name for fit guidance before ordering.'],
      ['General care', 'Store garments away from direct light. Air between wears, avoid harsh chemicals, and follow any care label supplied with the individual piece.'],
      ['Hand-dyed garments', 'Wash separately only when required, using cold water and a mild detergent. Do not soak. Dry away from direct sunlight; slight colour movement can occur.'],
    ],
  },
};

export default function InfoPage() {
  const { pathname } = useLocation();
  const page = pathname.slice(1);
  const content = PAGES[page] || PAGES.shipping;

  return (
    <div className="fade-in info-page">
      <header className="info-page__header">
        <span className="ui-text">{content.eyebrow}</span>
        <h1 className="display-l">{content.title}</h1>
        <p className="body-l">{content.intro}</p>
      </header>

      <div className="info-page__sections">
        {content.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="display-s">{heading}</h2>
            <p className="body-m">{body}</p>
          </section>
        ))}
      </div>

      <p className="body-s info-page__contact">
        Need help? <a className="underlined-link" href="mailto:contact@gauddly.com">contact@gauddly.com</a>
      </p>
      <Link to="/store" className="underlined-link">Return to the store →</Link>
    </div>
  );
}
