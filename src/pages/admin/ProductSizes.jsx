import { OFFERED_SIZES, sortSizes } from '../../lib/products';

const label = size => (size === 'ONE SIZE' ? 'One size' : size);

// Which sizes a garment comes in, and which are in stock. Changes are written on Save.
export default function ProductSizes({ sizes, onChange, disabled }) {
  const options = [...new Set([...OFFERED_SIZES, ...sizes.map(s => s.size)])].map(size => ({ size })).sort(sortSizes).map(s => s.size);
  const offered = size => sizes.some(s => s.size === size);
  const toggleOffered = size => onChange(offered(size) ? sizes.filter(s => s.size !== size) : [...sizes, { size, in_stock: true }].sort(sortSizes));
  const setStock = (size, inStock) => onChange(sizes.map(s => (s.size === size ? { ...s, in_stock: inStock } : s)));

  return <div className="pe-sizes">
    <div className="hp-chips" role="group" aria-label="Sizes this garment comes in">
      {options.map(size => <button key={size} type="button" aria-pressed={offered(size)} disabled={disabled} onClick={() => toggleOffered(size)}>{label(size)}</button>)}
    </div>
    {sizes.length === 0 ? <p className="hp-hint is-warning">Choose at least one size.</p> : <>
      <ul className="pe-stock">
        {sizes.map(s => <li key={s.size}>
          <label className="hp-switch">
            <span className="pe-stock-size">{label(s.size)}</span>
            <span className={s.in_stock ? 'pe-stock-state is-in' : 'pe-stock-state'}>{s.in_stock ? 'In stock' : 'Sold out'}</span>
            <input type="checkbox" role="switch" checked={s.in_stock} disabled={disabled} onChange={event => setStock(s.size, event.target.checked)} aria-label={`${label(s.size)} in stock`} />
          </label>
        </li>)}
      </ul>
      <div className="pe-row">
        <button type="button" className="hp-btn" disabled={disabled} onClick={() => onChange(sizes.map(s => ({ ...s, in_stock: true })))}>All in stock</button>
        <button type="button" className="hp-btn" disabled={disabled} onClick={() => onChange(sizes.map(s => ({ ...s, in_stock: false })))}>All sold out</button>
      </div>
    </>}
  </div>;
}
