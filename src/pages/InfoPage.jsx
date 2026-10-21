import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { mediaUrl } from '../lib/supabase';
import { SIZE_CHART, formatMeasure } from '../lib/products';
import { CareNav, Contents, Facts, Hero, Placeholder, Section, Steps, Summary } from '../components/ClientCare';
import { FACTS, mail } from '../lib/client-care';
import './info-page.css';

// Hero photographs: house imagery already in R2.
const IMAGES = {
  size: ['castes/fallen/1785235867984-nimbus-black.png', 'A distressed linen garment on a dress form in a sunlit studio'],
  shipping: ['products/dust-robe/1785227982380-Jeans_with_skeletal_bone_appliqu-_202607281348.jpeg', 'A hooded figure in bone-appliqué denim standing in a stone cathedral corridor'],
  returns: ['products/dust-robe/1785231359779-BONER_FLARED.png_202607281504.jpeg', 'Close-up of hand-stitched blue bone appliqué on pale denim'],
};
const hero = key => ({ image: mediaUrl(IMAGES[key][0]), alt: IMAGES[key][1] });

const ICONS = {
  light: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M3 3l18 18" /></>,
  air: <><path d="M10 5a2 2 0 1 1 2 2v1.5" /><path d="M12 8.5L3.4 15.2a1 1 0 0 0 .6 1.8h16a1 1 0 0 0 .6-1.8L12 8.5" /></>,
  chemicals: <><path d="M9 3h6M10 3v6L5 18.5A1.5 1.5 0 0 0 6.3 21h11.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3" /><path d="M3 3l18 18" /></>,
  label: <><path d="M3 3h8l10 10-8 8L3 11z" /><circle cx="7.5" cy="7.5" r="1.25" /></>,
  wash: <><path d="M3 7l2 12h14l2-12" /><path d="M3.6 10.5c1.4 1 2.8 1 4.2 0s2.8-1 4.2 0 2.8 1 4.2 0 2.8-1 4.2 0" /></>,
  cold: <><path d="M3 7l2 12h14l2-12" /><path d="M3.6 10.5c1.4 1 2.8 1 4.2 0s2.8-1 4.2 0 2.8 1 4.2 0 2.8-1 4.2 0" /><circle cx="12" cy="15" r="0.9" fill="currentColor" /></>,
  soak: <><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /><path d="M4 4l16 16" /></>,
  shade: <><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 8l5-5M3 12.5l9.5-9.5" /></>,
};
const CareIcons = ({ items }) => <ul className="cc-icons">
  {items.map(([icon, title, text]) => <li key={title}>
    <span className="cc-icon"><svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[icon]}</svg></span>
    <div>{title}<p className="cc-text">{text}</p></div>
  </li>)}
</ul>;

const Help = ({ question, children }) => <section className="cc-help" aria-label="Help">
  <p>{question} <a className="cc-link" href="mailto:contact@gauddly.com">contact@gauddly.com</a></p>
  {children}
</section>;

function SizeCare() {
  const [unit, setUnit] = useState('cm');
  const hasChart = SIZE_CHART.some(row => row.slice(1).some(value => value != null));
  return <>
    <div className="cc-intro-block">
      <CareNav />
      <Hero eyebrow="Garment guide" title="Size & Care" {...hero('size')} aside={<nav className="cc-toc" aria-label="On this page">
        <span className="cc-label">On this page</span>
        <ol>{[['measure', 'Measure yourself'], ['chart', 'Size chart'], ['between', 'Between sizes'], ['care', 'Caring for your garment']].map(([id, label], i) =>
          <li key={id}><a href={`#${id}`}><span>0{i + 1}</span>{label}</a></li>)}</ol>
      </nav>}>
        <p className="cc-intro">Choose the size you normally wear unless a product description says the silhouette is intentionally fitted or oversized.</p>
      </Hero>
    </div>

    <Section id="measure" number="01" title="Measure yourself" lead="Three measurements are all you need. Take them over light clothing, with a soft tape.">
      <div className="cc-measure">
        <figure className="cc-figure-measure">
          <svg role="img" aria-label="Dress form showing where to measure the chest, waist and seat" viewBox="0 0 290 350" width="100%" style={{ maxWidth: 280 }} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M104 18h32v14h-32z" stroke="#7F7A74" strokeWidth="1.25" />
            <path d="M104 32C100 44 70 48 52 60C40 68 40 90 46 110C52 140 70 170 80 190C84 202 80 222 68 240C56 262 56 286 72 300L168 300C184 286 184 262 172 240C160 222 156 202 160 190C170 170 188 140 194 110C200 90 200 68 188 60C170 48 140 44 136 32" stroke="#F4F1EA" strokeWidth="1.25" />
            <path d="M120 300v32M96 334h48" stroke="#7F7A74" strokeWidth="1.25" />
            <ellipse cx="120" cy="112" rx="77" ry="9" stroke="#C8CCD1" strokeWidth="1.25" strokeDasharray="4 4" />
            <ellipse cx="120" cy="190" rx="41" ry="7" stroke="#C8CCD1" strokeWidth="1.25" strokeDasharray="4 4" />
            <ellipse cx="120" cy="266" rx="62" ry="8" stroke="#C8CCD1" strokeWidth="1.25" strokeDasharray="4 4" />
            <path d="M197 112h22M161 190h58M182 266h37" stroke="#7F7A74" strokeWidth="1" />
            <text x="226" y="117" fill="#F4F1EA" fontFamily="EB Garamond, Georgia, serif" fontSize="15">Chest</text>
            <text x="226" y="195" fill="#F4F1EA" fontFamily="EB Garamond, Georgia, serif" fontSize="15">Waist</text>
            <text x="226" y="271" fill="#F4F1EA" fontFamily="EB Garamond, Georgia, serif" fontSize="15">Seat</text>
          </svg>
        </figure>
        <div>
          <Steps stack items={[
            ['Chest', 'Around the fullest part of your chest, keeping the tape level.'],
            ['Waist', 'Around your natural waist, without pulling the tape tight.'],
            ['Seat', 'Around the fullest part of your hips and seat.'],
          ]} />
          <p className="cc-note"><strong>Tip</strong> · Keep the tape level and comfortably close to the body. Note each measurement before you open the chart.</p>
        </div>
      </div>
    </Section>

    <Section id="chart" number="02" title="Size chart" lead="Find the row closest to your three measurements. Chest usually decides tops; waist and seat decide trousers.">
      <div className="cc-chart-bar">
        <span className="cc-label">Body measurements</span>
        <div className="cc-units" role="group" aria-label="Units">
          {[['cm', 'cm'], ['in', 'in']].map(([value, label]) => <button key={value} type="button" aria-pressed={unit === value} onClick={() => setUnit(value)}>{label}</button>)}
        </div>
      </div>
      <div className="cc-table-wrap">
        <table className="cc-table">
          <caption className="sr-only">Body measurements by size, in {unit === 'cm' ? 'centimetres' : 'inches'}</caption>
          <thead><tr><th scope="col">Size</th><th scope="col">Chest ({unit})</th><th scope="col">Waist ({unit})</th><th scope="col">Seat ({unit})</th></tr></thead>
          <tbody>{SIZE_CHART.map(([size, ...cm]) => <tr key={size}><th scope="row">{size}</th>{cm.map((value, i) => <td key={i}>{formatMeasure(value, unit)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="cc-text">These are body measurements. Garment-specific measurements are available from our studio.{!hasChart && <> <Placeholder>[Size measurements to be supplied]</Placeholder></>}</p>
    </Section>

    <Section id="between" number="03" title="Between sizes" lead="Decide by how you want the garment to sit. Every piece is made to order, so choose with care.">
      <div className="cc-grid">
        <div className="cc-card"><span className="cc-label">Closer silhouette</span><p className="cc-fact__value" style={{ fontSize: 32 }}>Choose the smaller size</p><p className="cc-text">For a sharper line that follows the body.</p></div>
        <div className="cc-card"><span className="cc-label">Ease and layering</span><p className="cc-fact__value" style={{ fontSize: 32 }}>Choose the larger size</p><p className="cc-text">For room to move and to wear over other pieces.</p></div>
      </div>
      <div className="cc-card cc-card--outline">
        <div><p className="cc-h3">Still unsure?</p><p className="cc-text">Email the studio your chest, waist and seat measurements with the garment name, and we will guide you before you order.</p></div>
        <a className="cc-btn" href={mail('Fit guidance')}>Ask for fit guidance →</a>
      </div>
      <p className="cc-text">Ordered the wrong size? Email us within 24 hours of your claim. Changes depend on whether production has begun. <Link className="cc-link" to="/returns">Returns &amp; Exchanges</Link></p>
    </Section>

    <Section id="care" number="04" title="Caring for your garment" lead="Simple habits keep a piece right for years. Always follow any care label supplied with the individual piece.">
      <span className="cc-label">Every garment</span>
      <CareIcons items={[
        ['light', 'Store away from light', 'Keep pieces out of direct light between wears.'],
        ['air', 'Air between wears', 'Hang the garment to breathe after each wear.'],
        ['chemicals', 'Avoid harsh chemicals', 'Keep bleach and strong cleaners away from the cloth.'],
        ['label', 'Follow the care label', "A piece's own label comes before this guide."],
      ]} />
      <span className="cc-label">Hand-dyed garments</span>
      <CareIcons items={[
        ['wash', 'Wash only when needed', 'And always separately from other garments.'],
        ['cold', 'Cold water, mild detergent', 'Never warm or hot water.'],
        ['soak', 'Do not soak', 'Wash and rinse without leaving it in water.'],
        ['shade', 'Dry in the shade', 'Away from direct sunlight.'],
      ]} />
      <p className="cc-note"><strong>Slight colour movement can occur.</strong> Hand finishing and dyeing give every piece small variations; they are part of its character.</p>
    </Section>

    <Help question="Questions about fit or care?"><Link className="cc-btn cc-btn--ghost" to="/store">Return to the store →</Link></Help>
  </>;
}

function Shipping() {
  return <>
    <div className="cc-intro-block">
      <CareNav />
      <Hero wide eyebrow="Client care" title="Shipping" {...hero('shipping')}>
        <p className="cc-intro">Every garment is prepared in Delhi after your claim is confirmed, then sent to you with tracking.</p>
      </Hero>
    </div>
    <Facts label="At a glance" items={[
      ['Making time', '14–21 days', 'before dispatch. Every piece is made to order.'],
      ['Tracking', 'By email', 'A tracking link is sent as your garment leaves the studio.'],
      ['Rates & destinations', <Placeholder key="r">[Rates]</Placeholder>, <Placeholder key="t">{FACTS.shippingRates}</Placeholder>],
    ]} />
    <Section id="journey" number="01" title="From claim to door" lead="What happens after you claim a garment." flush>
      <ol className="cc-steps cc-journey">
        {[['Claim confirmed', 'Your order is accepted once Gauddly confirms it. Making begins in our Delhi studio.'],
          ['Made for you', 'Normally 14–21 days. If a piece needs longer, we email you at the address on your order.'],
          ['Dispatched', 'A tracking link is sent to your email as the garment leaves the studio.'],
          ['Delivered', 'Delivery time starts at dispatch and varies by destination and carrier.']].map(([title, text], i) =>
          <li key={title}><span className="cc-label">Step {i + 1}</span><h3 className="cc-h3">{title}</h3><p className="cc-text">{text}</p></li>)}
      </ol>
    </Section>
    <Section id="changes" number="02" title="If something changes" lead="Have your claim number ready. It is in your confirmation email and your account.">
      <div className="cc-grid">
        <div className="cc-card"><h3 className="cc-h3">Changing your address</h3><p className="cc-text">Email us as soon as possible with your claim number. We cannot guarantee an address change after dispatch.</p><a className="cc-btn cc-btn--ghost" href={mail('Address change')}>Request a change →</a></div>
        <div className="cc-card"><h3 className="cc-h3">Delayed or lost parcel</h3><p className="cc-text">If tracking has not moved or a parcel appears lost, tell us and we will investigate with the carrier.</p><a className="cc-btn cc-btn--ghost" href={mail('Delivery problem')}>Report a delay →</a></div>
      </div>
    </Section>
    <Help question="Questions about delivery?"><Link className="cc-btn cc-btn--ghost" to="/store">Return to the store →</Link></Help>
  </>;
}

function Returns() {
  return <>
    <div className="cc-intro-block">
      <CareNav />
      <Hero eyebrow="Client care" title="Returns & Exchanges" {...hero('returns')}>
        <p className="cc-statement">Every Gauddly garment is made to order for you, so we do not accept returns or exchanges.</p>
        <p className="cc-intro">Please review your size and details carefully before confirming a claim. If something arrives wrong, we will put it right.</p>
        <Link className="cc-btn" to="/size-care">Check the size guide →</Link>
      </Hero>
    </div>
    <Facts label="Policy at a glance" items={[
      ['Made to order', 'Final sale', 'No returns or exchanges for change of mind, fit or size.'],
      ['Order changes', '24 hours', 'to change size or address after your claim, if making has not begun.'],
      ['If it arrives wrong', '48 hours', 'after delivery to tell us. We will make it right.'],
    ]} />
    <Section id="before" number="01" title="Before you claim" lead="A few minutes here is the surest way to love what arrives." flush>
      <ul className="cc-checks">
        <li><span>Measure yourself and <Link className="cc-link" to="/size-care#chart">check the size chart</Link></span></li>
        <li>Read the piece's fit notes</li>
        <li>Confirm your delivery address</li>
        <li><span>Unsure? <a className="cc-link" href={mail('Fit guidance')}>Ask for fit guidance</a></span></li>
      </ul>
    </Section>
    <Section id="wrong" number="02" title="If something is wrong" lead="Our final-sale policy never applies to these.">
      <div className="cc-grid">
        {[['Damaged or defective', 'Arrived torn, flawed or faulty.'], ['Not as described', 'The wrong garment, size or details.'], ['Delivered late', 'Later than the time we promised.']].map(([title, text]) =>
          <div className="cc-card" key={title}><h3 className="cc-h3">{title}</h3><p className="cc-text">{text}</p></div>)}
      </div>
      <p className="cc-text cc-text--strong">We will offer <Placeholder>{FACTS.faultRemedy}</Placeholder> once we have reviewed the issue.</p>
      <Steps items={[
        ['Write within 48 hours', 'From the moment your garment is delivered.'],
        ['Add your claim number', 'It is in your confirmation email and your account.'],
        ['Attach clear photographs', 'Of the garment and of its packaging.'],
        ['We review and resolve', 'We look into it and arrange the resolution.'],
      ]} />
      <a className="cc-btn" href={mail('Problem on arrival')}>Report a problem →</a>
    </Section>
    <Section id="change" number="03" title="Changing your order">
      <div className="cc-card cc-card--outline">
        <div><p className="cc-text cc-text--strong">Email us within 24 hours of your claim to change its size or delivery address.</p><p className="cc-text">Changes depend on whether production has begun. Include your claim number.</p></div>
        <a className="cc-btn cc-btn--ghost" href={mail('Order change')}>Request a change →</a>
      </div>
      <p className="cc-fine">Nothing in this policy limits your rights under the Consumer Protection Act, 2019.</p>
    </Section>
    <Help question="Questions about an order?"><Link className="cc-btn cc-btn--ghost" to="/terms">Terms of sale →</Link></Help>
  </>;
}

const Clause = ({ id, number, title, children }) => <section id={id} className="cc-clause" aria-labelledby={`${id}-title`}>
  <h2 id={`${id}-title`}><span>{number}.</span> {title}</h2>
  {children}
</section>;

function Legal({ kind, title, intro, summary, contents, children }) {
  return <>
    <div className="cc-intro-block">
      <CareNav />
      <Hero eyebrow={`Legal · ${kind}`} title={title} aside={<Summary items={summary} />}>
        <p className="cc-intro">{intro}</p>
        <p className="cc-meta">Last updated {FACTS.lastUpdated}</p>
      </Hero>
    </div>
    <div className="cc-legal">
      <Contents items={contents} />
      <div className="cc-legal__body">{children}</div>
    </div>
  </>;
}

function Privacy() {
  const rows = [
    ['Name, email, phone and address', 'Running your account, confirming and delivering claims'],
    ['Sign-in details', 'Keeping your account secure'],
    ['Orders and messages', 'Fulfilling claims, answering you and keeping records the law requires'],
    ['Waitlist email', 'Sending the updates you asked for'],
  ];
  return <Legal kind="Privacy notice" title="Privacy"
    intro="We collect only what we need to run your account, fulfil your claims and reply to you."
    summary={['We use your details to run your account and deliver your claims.', 'Providers receive only what their service needs.', 'You can access, correct or erase your data at any time.']}
    contents={[['who', 'Who we are'], ['collect', 'What we collect'], ['share', 'Sharing and storage'], ['keep', 'Retention and security'], ['rights', 'Your rights'], ['grievance', 'Grievance officer'], ['notice-changes', 'Children and changes']]}>
    <Clause id="who" number={1} title="Who we are"><p>Gauddly is operated by <Placeholder>{FACTS.legalName}</Placeholder>, <Placeholder>{FACTS.address}</Placeholder>, the data fiduciary under the Digital Personal Data Protection Act, 2023.</p></Clause>
    <Clause id="collect" number={2} title="What we collect">
      <div className="cc-table-wrap" style={{ borderTop: 0 }}>
        <table className="cc-table">
          <thead><tr><th scope="col">Information</th><th scope="col">Why we use it</th></tr></thead>
          <tbody>
            {rows.map(([what, why]) => <tr key={what}><th scope="row" style={{ fontFamily: 'var(--font-body)', fontSize: 17 }}>{what}</th><td>{why}</td></tr>)}
            <tr><th scope="row" style={{ fontFamily: 'var(--font-body)', fontSize: 17 }}><Placeholder>[Payment details]</Placeholder></th><td><Placeholder>[If online payment is added: processed by PAYMENT PROVIDER]</Placeholder></td></tr>
          </tbody>
        </table>
      </div>
      <p>Your cart, sound setting and Codex progress stay in your own browser. <Placeholder>[Analytics: name the tool, or remove this sentence.]</Placeholder></p>
    </Clause>
    <Clause id="share" number={3} title="Sharing and storage">
      <ul className="cc-chips">
        <li>Supabase<small>Sign-in and database</small></li>
        <li>Cloudflare<small>Hosting and media</small></li>
        <li><Placeholder>[Courier]</Placeholder><small>Delivery</small></li>
      </ul>
      <p>These providers receive only what their service needs. Account data is stored in Australia; transfers outside India follow the Act.</p>
    </Clause>
    <Clause id="keep" number={4} title="Retention and security"><p>Connections are encrypted and each customer can see only their own records. We keep data only as long as needed <Placeholder>[e.g. until you delete your account; order records as tax law requires]</Placeholder>, and will tell you and the Data Protection Board of any breach.</p></Clause>
    <Clause id="rights" number={5} title="Your rights">
      <p>You can access, correct or erase your data, withdraw consent, nominate someone to act for you, and complain to us or the Data Protection Board of India.</p>
      <div className="cc-card cc-card--outline">
        <div><p className="cc-text cc-text--strong">Email us to use any of these rights.</p></div>
        <a className="cc-btn" href={mail('Privacy request')}>Make a request →</a>
      </div>
    </Clause>
    <Clause id="grievance" number={6} title="Grievance officer">
      <div className="cc-card cc-fields">
        <div><span className="cc-label">Name</span><Placeholder>{FACTS.grievanceName}, {FACTS.grievanceTitle}</Placeholder></div>
        <div><span className="cc-label">Email</span><Placeholder>{FACTS.grievanceEmail}</Placeholder></div>
      </div>
      <p>We acknowledge complaints within 48 hours and resolve them within one month.</p>
    </Clause>
    <Clause id="notice-changes" number={7} title="Children and changes"><p><Placeholder>[Accounts are for adults aged 18 and over.]</Placeholder> When this notice changes, we update the date at the top.</p></Clause>
  </Legal>;
}

function Terms() {
  return <Legal kind="Terms of sale" title="Terms"
    intro="These terms apply when you use Gauddly or submit a claim for a garment."
    summary={['An order stands once Gauddly confirms it.', 'Garments are made to order and are final sale, except when they arrive wrong.', 'Our designs, films and writing may not be reused without permission.']}
    contents={[['seller', 'Who we are'], ['orders', 'Orders'], ['prices', 'Prices and payment'], ['final', 'Made to order, final sale'], ['variation', 'Variation in each piece'], ['delivery', 'Delivery'], ['account', 'Your account'], ['content', 'Website content'], ['liability', 'Liability'], ['law', 'Governing law and disputes'], ['contact', 'Grievances and contact'], ['terms-changes', 'Changes to these terms']]}>
    <Clause id="seller" number={1} title="Who we are">
      <div className="cc-card cc-fields">
        <div><span className="cc-label">Seller</span><Placeholder>{FACTS.legalName}</Placeholder></div>
        <div><span className="cc-label">Registered address</span><Placeholder>{FACTS.address}</Placeholder></div>
        <div><span className="cc-label">GSTIN</span><Placeholder>{FACTS.gstin}</Placeholder></div>
        <div><span className="cc-label">Contact</span>contact@gauddly.com</div>
      </div>
    </Clause>
    <Clause id="orders" number={2} title="Orders"><p>An order is accepted only when Gauddly confirms it. We may contact you if stock, sizing, pricing, delivery, or production information needs correction.</p></Clause>
    <Clause id="prices" number={3} title="Prices and payment"><p>Prices are shown in Indian rupees. <Placeholder>[Confirm whether prices include GST, and list the payment methods you accept.]</Placeholder></p></Clause>
    <Clause id="final" number={4} title="Made to order, final sale">
      <p>Every garment is made to order. We do not accept returns or exchanges for change of mind, fit or size. You may ask to change size or address within 24 hours of your claim, if making has not begun. <Placeholder>[Cancellation: state whether a claim can be cancelled before making begins, and any charge.]</Placeholder></p>
      <p className="cc-note" style={{ color: 'var(--bone-white)' }}>If a garment arrives damaged, defective, not as described, or later than promised, we will put it right. <Link className="cc-link" to="/returns">How to report a problem</Link></p>
    </Clause>
    <Clause id="variation" number={5} title="Variation in each piece"><p>Hand finishing and dye processes can produce small variations. These are part of the garment's character and are not necessarily defects. <Link className="cc-link" to="/size-care#care">Caring for hand-dyed pieces</Link></p></Clause>
    <Clause id="delivery" number={6} title="Delivery"><p>Making normally takes 14–21 days before dispatch, and a tracking link follows by email. <Link className="cc-link" to="/shipping">Shipping</Link></p></Clause>
    <Clause id="account" number={7} title="Your account"><p><Placeholder>[Clause for counsel: keeping account details accurate and private, and when an account may be suspended for misuse.]</Placeholder></p></Clause>
    <Clause id="content" number={8} title="Website content"><p>Gauddly artwork, films, writing, photography, garment designs, and branding may not be reproduced or commercially used without permission.</p></Clause>
    <Clause id="liability" number={9} title="Liability"><p><Placeholder>[Clause for counsel: limits of liability, written so they do not reduce rights under the Consumer Protection Act, 2019.]</Placeholder></p></Clause>
    <Clause id="law" number={10} title="Governing law and disputes"><p>These terms are governed by the laws of India. <Placeholder>[Courts at CITY have jurisdiction; describe any dispute-resolution step first.]</Placeholder></p></Clause>
    <Clause id="contact" number={11} title="Grievances and contact">
      <div className="cc-card cc-card--outline">
        <div><p className="cc-text cc-text--strong">Questions about an order or these terms go to the studio. Complaints can also go to our <Link className="cc-link" to="/privacy#grievance">grievance officer</Link>.</p></div>
        <a className="cc-btn" href={mail('Question about the terms')}>Email the studio →</a>
      </div>
    </Clause>
    <Clause id="terms-changes" number={12} title="Changes to these terms"><p>We update the date at the top when these terms change. <Placeholder>[Clause for counsel: which version of the terms applies to an order placed before a change.]</Placeholder></p></Clause>
  </Legal>;
}

function Contact() {
  return <>
    <div className="cc-intro-block">
      <CareNav />
      <Hero eyebrow="Client care" title="Contact">
        <p className="cc-intro">Every message is read by the studio in Delhi. Tell us what you need and we will answer by email.</p>
      </Hero>
    </div>
    <Facts label="At a glance" items={[
      ['Email', 'Write to us', <a key="e" className="cc-link" href="mailto:contact@gauddly.com">contact@gauddly.com</a>],
      ['Response', 'Within 48 hours', 'We reply to every message within two days.'],
      ['Studio', 'Delhi, India', 'Where every garment is made to order.'],
    ]} />
    <Section id="topics" number="01" title="How can we help?" lead="Choose a topic and your email opens with the subject filled in. For a claim, include your claim number.">
      <div className="cc-grid">
        {[['A claim in progress', 'Making times, tracking, or a change of size or address.', 'Claim enquiry'],
          ['Fit advice', 'Tell us your measurements and the garment, and we will suggest a size.', 'Fit advice'],
          ['Care and repair', 'Questions about washing, wear, or a piece that needs attention.', 'Care and repair'],
          ['Press and collaborations', 'Editorial, styling and partnership requests.', 'Press and collaborations']].map(([title, text, subject]) =>
          <div className="cc-card" key={title}><h3 className="cc-h3">{title}</h3><p className="cc-text">{text}</p><a className="cc-btn cc-btn--ghost" href={mail(subject)}>Write to us →</a></div>)}
      </div>
    </Section>
    <Section id="formal" number="02" title="Complaints and formal matters" lead="If an answer from the studio has not resolved your concern, you can write to our grievance officer.">
      <div className="cc-grid">
        <div className="cc-card"><h3 className="cc-h3">Grievance officer</h3><p className="cc-text">Complaints are acknowledged within 48 hours and resolved within one month.</p><Link className="cc-btn cc-btn--ghost" to="/privacy#grievance">Officer details →</Link></div>
        <div className="cc-card"><h3 className="cc-h3">Seller details</h3><p className="cc-text">Our legal name, registered address and GSTIN.</p><Link className="cc-btn cc-btn--ghost" to="/terms#seller">View seller details →</Link></div>
      </div>
    </Section>
    <Help question="Prefer to follow the house?"><a className="cc-btn cc-btn--ghost" href="https://instagram.com/gauddly" target="_blank" rel="noopener noreferrer">Instagram ↗</a></Help>
  </>;
}

const PAGES = { shipping: Shipping, returns: Returns, 'size-care': SizeCare, privacy: Privacy, terms: Terms, contact: Contact };

export default function InfoPage() {
  const { pathname } = useLocation();
  const Page = PAGES[pathname.slice(1)] || Shipping;
  return <div className="fade-in cc-page"><Page /></div>;
}
