import { useState, useEffect } from 'react';
import api from '../api';

interface Order {
  id: string; product_name: string; price: number;
  status: 'pending' | 'confirmed' | 'failed'; created_at: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => { const r = await api.get('/orders'); setOrders(r.data); };
    fetch();
    const t = setInterval(fetch, 2000);
    return () => clearInterval(t);
  }, []);

  async function downloadInvoice(orderId: string) {
    setDownloading(orderId);
    try {
      const token = localStorage.getItem('token');
      const base = import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:4002';
      const res = await fetch(`${base}/api/invoice/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert('Invoice not ready yet'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${orderId.slice(0, 8)}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } finally { setDownloading(null); }
  }

  const badge = (s: string) =>
    s === 'confirmed' ? '✅ Confirmed' : s === 'failed' ? '❌ Failed' : '⏳ Processing payment...';

  return (
    <div className="page">
      <h2>My Orders</h2>
      <div className="orders-list">
        {orders.map(o => (
          <div className="order-row" key={o.id}>
            <div>
              <p className="product-name">{o.product_name}</p>
              <p className="order-id">#{o.id.slice(0, 8)}</p>
              <p className="order-date">{new Date(o.created_at).toLocaleString()}</p>
            </div>
            <div className="order-right">
              <p className="price">₹{Number(o.price).toLocaleString('en-IN')}</p>
              <span className={`status-badge ${o.status}`}>{badge(o.status)}</span>
              {o.status === 'confirmed' && (
                <button className="invoice-btn" onClick={() => downloadInvoice(o.id)} disabled={downloading === o.id}>
                  {downloading === o.id ? 'Generating...' : '📄 Download Invoice'}
                </button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="empty">No orders yet.</p>}
      </div>
    </div>
  );
}
