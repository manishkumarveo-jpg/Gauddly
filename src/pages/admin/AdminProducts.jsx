import React, { useEffect, useMemo, useState } from 'react';
import { supabase, mediaUrl } from '../../lib/supabase';
import { uploadToR2, safeFileName, deleteFromR2 } from './uploadToR2';
import { inputStyle, cardStyle, badgeStyle, iconButtonStyle, primaryButtonStyle } from './adminStyles';
import { PencilIcon, TrashIcon, PlusIcon } from './Icons';
import UploadLink from './UploadLink';
import Pagination from './Pagination';
import ProgressBar from './ProgressBar';
import { useConfirm } from './useConfirm';

const SIZES = ['S', 'M', 'L', 'XL'];
const PAGE_SIZE = 6;
const emptyDraft = { id: '', caste_id: '', name: '', num: '', sort_order: 0, price: 0, sku: '', passage: '', craft: '', is_published: false };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [castes, setCastes] = useState([]);
  const [editingId, setEditingId] = useState(null); // product id, or 'new'
  const [draft, setDraft] = useState(emptyDraft);
  const [uploadError, setUploadError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [confirmDialog, requestConfirm] = useConfirm();

  const [casteFilter, setCasteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const load = () => {
    supabase
      .from('products')
      .select('*, product_sizes(size, in_stock), product_images(id, r2_key, sort_order, alt)')
      .order('caste_id')
      .order('sort_order')
      .then(({ data }) => setProducts(data || []));
  };

  useEffect(() => {
    load();
    supabase.from('castes').select('id, name, sort_order').order('sort_order').then(({ data }) => setCastes(data || []));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (casteFilter !== 'all' && p.caste_id !== casteFilter) return false;
      if (statusFilter === 'published' && !p.is_published) return false;
      if (statusFilter === 'draft' && p.is_published) return false;
      return true;
    });
  }, [products, casteFilter, statusFilter]);

  useEffect(() => setPage(1), [casteFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const casteName = (id) => castes.find((c) => c.id === id)?.name;

  const startEdit = (p) => {
    setEditingId(p.id);
    setDraft({ id: p.id, caste_id: p.caste_id, name: p.name, num: p.num || '', sort_order: p.sort_order, price: p.price, sku: p.sku || '', passage: p.passage || '', craft: p.craft || '', is_published: p.is_published });
  };

  const startNew = () => {
    setEditingId('new');
    setDraft(emptyDraft);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const saveEdit = async () => {
    const isNew = editingId === 'new';
    if (!(await requestConfirm(isNew ? `Create product "${draft.name}"?` : `Save changes to "${draft.name}"?`))) return;

    setIsBusy(true);
    const payload = { ...draft, price: Number(draft.price), sort_order: Number(draft.sort_order) };
    if (isNew) {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { setIsBusy(false); return alert(error.message); }
      await supabase.from('product_sizes').insert(SIZES.map((size) => ({ product_id: payload.id, size, in_stock: true })));
    } else {
      const { id: _id, ...rest } = payload;
      const { error } = await supabase.from('products').update(rest).eq('id', editingId);
      if (error) { setIsBusy(false); return alert(error.message); }
    }
    setIsBusy(false);
    cancelEdit();
    load();
  };

  const deleteProduct = async (p) => {
    if (!(await requestConfirm(`Delete "${p.name}"? This cannot be undone.`, { danger: true }))) return;
    setIsBusy(true);
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    setIsBusy(false);
    if (error) return alert(error.message);
    load();
  };

  const toggleSizeStock = async (productId, size, inStock) => {
    setIsBusy(true);
    await supabase.from('product_sizes').update({ in_stock: !inStock }).eq('product_id', productId).eq('size', size);
    setIsBusy(false);
    load();
  };

  const handleUpload = async (productId, file) => {
    setUploadError('');
    setIsBusy(true);
    try {
      const key = `products/${productId}/${Date.now()}-${safeFileName(file.name)}`;
      await uploadToR2(key, file);
      await supabase.from('product_images').insert({ product_id: productId, r2_key: key, sort_order: 0, alt: productId });
      load();
    } catch (err) {
      setUploadError(err.message);
    }
    setIsBusy(false);
  };

  const handleVideoUpload = async (productId, file) => {
    setUploadError('');
    setIsBusy(true);
    try {
      const key = `products/${productId}/${Date.now()}-${safeFileName(file.name)}`;
      await uploadToR2(key, file);
      const { error } = await supabase.from('products').update({ video_r2_key: key }).eq('id', productId);
      if (error) throw new Error(error.message);
      load();
    } catch (err) {
      setUploadError(err.message);
    }
    setIsBusy(false);
  };

  const deleteVideo = async (product) => {
    if (!(await requestConfirm(`Remove the video for "${product.name}"? This deletes the file permanently.`, { danger: true }))) return;
    setIsBusy(true);
    try {
      await deleteFromR2(product.video_r2_key);
      const { error } = await supabase.from('products').update({ video_r2_key: null }).eq('id', product.id);
      if (error) throw new Error(error.message);
    } catch (err) {
      setUploadError(err.message);
    }
    setIsBusy(false);
    load();
  };

  const deleteImage = async (image) => {
    if (!(await requestConfirm('Remove this image? This deletes the file permanently.', { danger: true }))) return;
    setIsBusy(true);
    try {
      await deleteFromR2(image.r2_key);
      const { error } = await supabase.from('product_images').delete().eq('id', image.id);
      if (error) throw new Error(error.message);
    } catch (err) {
      setUploadError(err.message);
    }
    setIsBusy(false);
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="display-s">Products</h1>
          <p className="body-s" style={{ maxWidth: '520px', marginTop: '8px' }}>
            Curate and manage the garments of the Gauddly ecosystem.
          </p>
        </div>
        <button style={primaryButtonStyle} onClick={startNew}>+ New Product</button>
      </div>

      <ProgressBar active={isBusy} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '24px' }}>
        <label className="body-s" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Caste
          <select style={{ ...inputStyle, width: '180px' }} value={casteFilter} onChange={(e) => setCasteFilter(e.target.value)}>
            <option value="all">All</option>
            {castes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="body-s" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Status
          <select style={{ ...inputStyle, width: '140px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
      </div>

      {editingId === 'new' && (
        <div style={cardStyle}>
          <ProductForm draft={draft} setDraft={setDraft} castes={castes} onSave={saveEdit} onCancel={cancelEdit} isNew />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {pageItems.map((p) =>
          editingId === p.id ? (
            <div key={p.id} style={cardStyle}>
              <ProductForm draft={draft} setDraft={setDraft} castes={castes} onSave={saveEdit} onCancel={cancelEdit} />
            </div>
          ) : (
            <div key={p.id} style={{ ...cardStyle, flexDirection: 'row', gap: '20px' }}>
              <div style={{ position: 'relative', width: '120px', height: '160px', flexShrink: 0, backgroundColor: '#151515' }}>
                {p.product_images[0] && (
                  <img
                    src={mediaUrl(p.product_images[0].r2_key)}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <span style={{ position: 'absolute', top: '8px', left: '8px', ...badgeStyle(p.is_published) }}>
                  {p.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>{p.name}</strong>
                    <div className="body-s" style={{ fontSize: '11px' }}>{casteName(p.caste_id)}</div>
                  </div>
                  {p.num && <span className="body-s">№ {p.num}</span>}
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <div className="ui-text" style={{ fontSize: '9px' }}>Price</div>
                    <div className="body-s" style={{ color: 'var(--bone-white)' }}>₹{p.price.toLocaleString('en-IN')}</div>
                  </div>
                  {p.sku && (
                    <div>
                      <div className="ui-text" style={{ fontSize: '9px' }}>SKU</div>
                      <div className="body-s" style={{ color: 'var(--bone-white)' }}>{p.sku}</div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="ui-text" style={{ fontSize: '9px', marginBottom: '6px' }}>Inventory Matrix</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {SIZES.map((size) => {
                      const s = p.product_sizes.find((x) => x.size === size);
                      const inStock = s?.in_stock ?? false;
                      return (
                        <button
                          key={size}
                          onClick={() => toggleSizeStock(p.id, size, inStock)}
                          className="body-s"
                          style={{
                            background: inStock ? 'var(--ash-grey)' : 'none',
                            border: '1px solid var(--cold-silver)',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer',
                            color: inStock ? 'var(--void-black)' : 'var(--ash-grey)',
                            opacity: inStock ? 1 : 0.5,
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {p.product_images.map((img) => (
                    <div key={img.id} style={{ position: 'relative', width: '32px', height: '32px' }}>
                      <img src={mediaUrl(img.r2_key)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => deleteImage(img)}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--void-black)', border: '1px solid var(--cold-silver)', color: 'var(--ash-grey)', width: '14px', height: '14px', fontSize: '9px', cursor: 'pointer', lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label style={{ width: '32px', height: '32px', border: '1px dashed rgba(200, 204, 209, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ash-grey)' }}>
                    <PlusIcon width={14} height={14} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleUpload(p.id, e.target.files[0])} />
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="ui-text" style={{ fontSize: '9px' }}>Video</div>
                  {p.video_r2_key ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <video src={mediaUrl(p.video_r2_key)} controls style={{ width: '80px', height: '48px', objectFit: 'cover', backgroundColor: '#000' }} />
                      <UploadLink label="Replace →" accept="video/*" onFile={(file) => handleVideoUpload(p.id, file)} />
                      <button
                        onClick={() => deleteVideo(p)}
                        className="ui-text silver-hover"
                        style={{ background: 'none', border: 'none', color: '#ff5555', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <UploadLink label="Upload video →" accept="video/*" onFile={(file) => handleVideoUpload(p.id, file)} />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <button style={{ ...primaryButtonStyle, flex: 1, textAlign: 'center' }} onClick={() => startEdit(p)}>
                    <PencilIcon width={12} height={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Edit Product
                  </button>
                  <button style={iconButtonStyle} onClick={() => deleteProduct(p)}>
                    <TrashIcon width={14} height={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {filtered.length === 0 && <span className="body-s">No products match this filter.</span>}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalCount={filtered.length} pageSize={PAGE_SIZE} />

      {uploadError && <span className="body-s">Upload failed: {uploadError}</span>}
      {confirmDialog}
    </div>
  );
}

function ProductForm({ draft, setDraft, castes, onSave, onCancel, isNew }) {
  const set = (field) => (e) => setDraft({ ...draft, [field]: e.target.value });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isNew && (
        <label className="body-s">
          Slug (id) <input style={inputStyle} value={draft.id} onChange={set('id')} placeholder="e.g. new-garment" />
        </label>
      )}
      <label className="body-s">Name <input style={inputStyle} value={draft.name} onChange={set('name')} /></label>
      <label className="body-s">
        Caste
        <select style={inputStyle} value={draft.caste_id} onChange={set('caste_id')}>
          <option value="">—</option>
          {castes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <div style={{ display: 'flex', gap: '16px' }}>
        <label className="body-s" style={{ flex: 1 }}>Num <input style={inputStyle} value={draft.num} onChange={set('num')} placeholder="I, II, III..." /></label>
        <label className="body-s" style={{ flex: 1 }}>Sort order <input type="number" style={inputStyle} value={draft.sort_order} onChange={set('sort_order')} /></label>
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <label className="body-s" style={{ flex: 1 }}>Price (₹) <input type="number" style={inputStyle} value={draft.price} onChange={set('price')} /></label>
        <label className="body-s" style={{ flex: 1 }}>SKU <input style={inputStyle} value={draft.sku} onChange={set('sku')} placeholder="e.g. GA-OV-04-BLK" /></label>
      </div>
      <label className="body-s">Passage <textarea style={{ ...inputStyle, minHeight: '60px' }} value={draft.passage} onChange={set('passage')} /></label>
      <label className="body-s">Craft <textarea style={{ ...inputStyle, minHeight: '60px' }} value={draft.craft} onChange={set('craft')} /></label>
      <label className="body-s" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="checkbox" checked={draft.is_published} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} />
        Published
      </label>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button style={primaryButtonStyle} onClick={onSave}>Save</button>
        <button style={{ ...primaryButtonStyle, border: '1px solid var(--ash-grey)', color: 'var(--ash-grey)' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
