import { useState, useEffect } from 'react';
import api from '../api';

interface Product { id: number; name: string; price: number; }

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<'sales' | 'products'>('sales');

  // product form
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pImage, setPImage] = useState('');
  const [pDesc, setPDesc] = useState('');

  // sale form
  const [sProduct, setSProduct] = useState('');
  const [sInventory, setSInventory] = useState('');
  const [sStart, setSStart] = useState('');
  const [sEnd, setSEnd] = useState('');

  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data));
  }, []);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post('/products', { name: pName, price: Number(pPrice), image_url: pImage, description: pDesc });
      setMsg(`Product created — ID: ${res.data.productId}`);
      const updated = await api.get('/products');
      setProducts(updated.data);
      setPName(''); setPPrice(''); setPImage(''); setPDesc('');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  }

  async function createSale(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post('/sales', {
        product_id: Number(sProduct),
        total_inventory: Number(sInventory),
        starts_at: sStart,
        ends_at: sEnd,
      });
      setMsg(`Flash sale created — ID: ${res.data.saleId}`);
      setSProduct(''); setSInventory(''); setSStart(''); setSEnd('');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  }

  return (
    <div className="page">
      <h2>👑 Admin Panel</h2>
      <div className="admin-tabs">
        <button className={tab === 'sales' ? 'active' : ''} onClick={() => setTab('sales')}>Create Flash Sale</button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Add Product</button>
      </div>

      {msg && <div className="admin-msg">{msg}</div>}

      {tab === 'sales' && (
        <form className="admin-form" onSubmit={createSale}>
          <h3>New Flash Sale</h3>
          <label>Product</label>
          <select value={sProduct} onChange={e => setSProduct(e.target.value)} required>
            <option value="">Select product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{Number(p.price).toLocaleString('en-IN')}</option>)}
          </select>
          <label>Total Inventory</label>
          <input type="number" placeholder="e.g. 100" value={sInventory} onChange={e => setSInventory(e.target.value)} required />
          <label>Sale Start</label>
          <input type="datetime-local" value={sStart} onChange={e => setSStart(e.target.value)} required />
          <label>Sale End</label>
          <input type="datetime-local" value={sEnd} onChange={e => setSEnd(e.target.value)} required />
          <button type="submit">Launch Sale ⚡</button>
        </form>
      )}

      {tab === 'products' && (
        <form className="admin-form" onSubmit={createProduct}>
          <h3>New Product</h3>
          <label>Product Name</label>
          <input placeholder="e.g. Samsung Galaxy S24" value={pName} onChange={e => setPName(e.target.value)} required />
          <label>Price (₹)</label>
          <input type="number" placeholder="e.g. 79999" value={pPrice} onChange={e => setPPrice(e.target.value)} required />
          <label>Image URL</label>
          <input placeholder="https://..." value={pImage} onChange={e => setPImage(e.target.value)} />
          <label>Description</label>
          <input placeholder="Short description" value={pDesc} onChange={e => setPDesc(e.target.value)} />
          <button type="submit">Add Product</button>
        </form>
      )}
    </div>
  );
}
