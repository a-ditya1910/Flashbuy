import { useState, useEffect, useCallback } from 'react';
import api from '../api';

interface Sale {
  id: number;
  product_name: string;
  price: number;
  image_url: string;
  description: string;
  total_inventory: number;
  remaining_inventory: number;
  ends_at: string;
}

interface OrderResult {
  orderId: string;
  status: string;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [orderMap, setOrderMap] = useState<Record<number, OrderResult>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const fetchSales = useCallback(async () => {
    const res = await api.get('/sales');
    setSales(res.data);
  }, []);

  useEffect(() => {
    fetchSales();
    const interval = setInterval(fetchSales, 2000); // live inventory poll
    return () => clearInterval(interval);
  }, [fetchSales]);

  // poll order status until confirmed
  useEffect(() => {
    const pending = Object.entries(orderMap).filter(([, o]) => o.status === 'pending');
    if (!pending.length) return;
    const interval = setInterval(async () => {
      for (const [saleId, order] of pending) {
        const res = await api.get(`/orders/${order.orderId}`);
        if (res.data.status !== 'pending') {
          setOrderMap(prev => ({ ...prev, [saleId]: { orderId: order.orderId, status: res.data.status } }));
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [orderMap]);

  async function buy(saleId: number) {
    setLoading(prev => ({ ...prev, [saleId]: true }));
    try {
      const res = await api.post(`/orders/buy/${saleId}`);
      setOrderMap(prev => ({ ...prev, [saleId]: { orderId: res.data.orderId, status: 'pending' } }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(prev => ({ ...prev, [saleId]: false }));
    }
  }

  return (
    <div className="page">
      <h2>Live Flash Sales</h2>
      <div className="sale-grid">
        {sales.map(sale => {
          const pct = Math.round((sale.remaining_inventory / sale.total_inventory) * 100);
          const order = orderMap[sale.id];
          const endsIn = Math.max(0, Math.round((new Date(sale.ends_at).getTime() - Date.now()) / 60000));

          return (
            <div className="sale-card" key={sale.id}>
              <img src={sale.image_url} alt={sale.product_name} />
              <div className="sale-info">
                <h3>{sale.product_name}</h3>
                <p className="desc">{sale.description}</p>
                <p className="price">₹{Number(sale.price).toLocaleString('en-IN')}</p>
                <div className="inventory-bar">
                  <div className="bar-fill" style={{ width: `${pct}%`, background: pct < 20 ? '#ef4444' : '#22c55e' }} />
                </div>
                <p className="stock">{sale.remaining_inventory} / {sale.total_inventory} left · ends in {endsIn}m</p>

                {order?.status === 'pending' ? (
                  <div className="order-badge pending">⏳ Confirming...</div>
                ) : (
                  <>
                    {order?.status === 'confirmed' && <div className="order-badge confirmed" style={{marginBottom:'8px'}}>✅ Order Confirmed!</div>}
                    {order?.status === 'failed' && <div className="order-badge" style={{background:'#450a0a',color:'#fca5a5',marginBottom:'8px'}}>❌ Payment Failed</div>}
                    <button className="buy-btn" onClick={() => buy(sale.id)} disabled={loading[sale.id] || sale.remaining_inventory === 0}>
                      {loading[sale.id] ? 'Processing...' : sale.remaining_inventory === 0 ? 'Sold Out' : 'Buy Now'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {sales.length === 0 && <p className="empty">No active sales right now.</p>}
      </div>
    </div>
  );
}
