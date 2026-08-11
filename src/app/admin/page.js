'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllOrders, updateOrderStatus } from '@/lib/db';
import { sentinelProducts } from '@/lib/mock-data';

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'sbsecurity2024';

// Build a quick cost-price lookup by product id
const COST_MAP = Object.fromEntries(sentinelProducts.map(p => [p.id, p.costPrice ?? 0]));
const PRICE_MAP = Object.fromEntries(sentinelProducts.map(p => [p.id, p.price]));

const STATUS_COLORS = {
  pending:   { bg: '#92400e', text: '#fef3c7' },
  confirmed: { bg: '#1e3a5f', text: '#93c5fd' },
  shipped:   { bg: '#3b0764', text: '#d8b4fe' },
  delivered: { bg: '#14532d', text: '#86efac' },
  cancelled: { bg: '#450a0a', text: '#fca5a5' },
};

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function AdminPage() {
  const [authed, setAuthed]   = useState(false);
  const [pass, setPass]       = useState('');
  const [passErr, setPassErr] = useState(false);

  const tryLogin = () => {
    if (pass === ADMIN_PASS) {
      setAuthed(true);
      sessionStorage.setItem('sl_admin', '1');
    } else {
      setPassErr(true);
      setTimeout(() => setPassErr(false), 2000);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('sl_admin') === '1') setAuthed(true);
  }, []);

  if (!authed) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <div className="login-icon">⚙️</div>
          <h1 className="login-title">Admin Access</h1>
          <p className="login-sub">SafeLink Sales Dashboard</p>
          <input
            type="password"
            className={`login-input ${passErr ? 'input-err' : ''}`}
            placeholder="Enter admin passphrase"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryLogin()}
            autoFocus
          />
          {passErr && <p className="err-msg">Incorrect passphrase</p>}
          <button className="login-btn" onClick={tryLogin}>Enter Dashboard</button>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          body { background: #0f1923; }
          .admin-login {
            min-height: 100vh; display: flex;
            align-items: center; justify-content: center;
            background: #0f1923; padding: 24px;
          }
          .login-card {
            background: rgba(22,34,49,0.9);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px; padding: 40px 32px;
            width: 100%; max-width: 380px; text-align: center;
            box-shadow: 0 8px 40px rgba(0,0,0,0.5);
          }
          .login-icon { font-size: 40px; margin-bottom: 16px; }
          .login-title { font-size: 24px; font-weight: 900; color: #fff; margin: 0 0 6px; }
          .login-sub { font-size: 14px; color: #64748b; margin: 0 0 28px; }
          .login-input {
            width: 100%; padding: 14px 16px; border-radius: 10px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: #fff; font-size: 15px; box-sizing: border-box; margin-bottom: 8px;
            transition: border-color 0.2s; outline: none;
          }
          .login-input:focus { border-color: #f7bb23; }
          .input-err { border-color: #e53e3e !important; animation: shake 0.3s; }
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            25%      { transform: translateX(-6px); }
            75%      { transform: translateX(6px); }
          }
          .err-msg { color: #fc8181; font-size: 13px; margin: 0 0 12px; }
          .login-btn {
            width: 100%; padding: 15px; margin-top: 12px;
            background: #f7bb23; border: none; border-radius: 10px;
            color: #000; font-size: 15px; font-weight: 800;
            cursor: pointer; transition: opacity 0.2s;
          }
          .login-btn:hover { opacity: 0.9; }
        `}} />
      </div>
    );
  }

  return <AdminDashboard onLogout={() => { sessionStorage.removeItem('sl_admin'); setAuthed(false); }} />;
}

function AdminDashboard({ onLogout }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const advanceStatus = async (orderId, currentStatus) => {
    const idx  = STATUS_FLOW.indexOf(currentStatus);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, next);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next } : o));
    } finally {
      setUpdating(null);
    }
  };

  // Compute profit for a single order
  const orderProfit = (order) => {
    if (!order.items || !Array.isArray(order.items)) return { revenue: 0, cost: 0, profit: 0 };
    let revenue = 0, cost = 0;
    for (const item of order.items) {
      const salePrice = item.price ?? PRICE_MAP[item.id] ?? 0;
      const costPrice = COST_MAP[item.id] ?? 0;
      revenue += salePrice * (item.qty || item.quantity || 1);
      cost    += costPrice * (item.qty || item.quantity || 1);
    }
    return { revenue, cost, profit: revenue - cost };
  };

  // Summary stats
  const stats = orders.reduce((acc, o) => {
    const { revenue, cost, profit } = orderProfit(o);
    acc.revenue += revenue;
    acc.cost    += cost;
    acc.profit  += profit;
    return acc;
  }, { revenue: 0, cost: 0, profit: 0 });

  const marginPct = stats.revenue > 0
    ? ((stats.profit / stats.revenue) * 100).toFixed(1)
    : '0.0';

  // Filter
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.id?.toLowerCase().includes(q) ||
      o.referralCode?.toLowerCase().includes(q) ||
      o.delivery?.name?.toLowerCase().includes(q)
    );
  });

  // CSV export
  const exportCSV = () => {
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Status', 'Referral Code', 'Revenue (R)', 'Cost (R)', 'Profit (R)', 'Margin %'],
      ...orders.map(o => {
        const { revenue, cost, profit } = orderProfit(o);
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';
        const date   = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-ZA') : '—';
        return [
          o.id, date, o.delivery?.name || o.uid, o.status,
          o.referralCode || '—',
          revenue.toFixed(2), cost.toFixed(2), profit.toFixed(2), `${margin}%`,
        ];
      }),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `safelink-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="admin-wrap">
      {/* Top bar */}
      <div className="admin-topbar">
        <div>
          <div className="admin-logo">🛡️ <span>SafeLink</span></div>
          <div className="admin-role">Admin Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="admin-btn-sm" onClick={exportCSV}>⬇ CSV</button>
          <button className="admin-btn-sm admin-btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">R{stats.revenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value" style={{ color: '#fc8181' }}>R{stats.cost.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value" style={{ color: '#68d391' }}>R{stats.profit.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Margin</div>
          <div className="stat-value" style={{ color: '#f7bb23' }}>{marginPct}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Orders</div>
          <div className="stat-value">{orders.length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="admin-search-row">
        <input
          className="admin-search"
          placeholder="Search by name, order ID, or referral code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="admin-btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="admin-loading">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-loading">No orders found.</div>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Referral Code</th>
                <th>Items</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Profit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const { revenue, cost, profit } = orderProfit(order);
                const margin   = revenue > 0 ? ((profit / revenue) * 100).toFixed(0) : 0;
                const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                const nextStatus  = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
                const date = order.createdAt?.toDate
                  ? order.createdAt.toDate().toLocaleDateString('en-ZA')
                  : '—';

                return (
                  <tr key={order.id} className="order-row">
                    <td className="td-date">{date}</td>
                    <td className="td-name">
                      <div>{order.delivery?.name || '—'}</div>
                      <div className="td-id">#{order.id.slice(0, 8)}</div>
                    </td>
                    <td className="td-ref">
                      <span className="ref-pill">{order.referralCode || '—'}</span>
                    </td>
                    <td className="td-items">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="td-item-row">
                          {item.qty || item.quantity || 1}× {item.name}
                        </div>
                      ))}
                    </td>
                    <td className="td-money">R{revenue.toLocaleString()}</td>
                    <td className="td-money td-cost">R{cost.toLocaleString()}</td>
                    <td className="td-money td-profit">
                      <div>R{profit.toLocaleString()}</div>
                      <div className="td-margin">{margin}%</div>
                    </td>
                    <td>
                      <span
                        className="status-pill"
                        style={{ background: statusStyle.bg, color: statusStyle.text }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {nextStatus && (
                        <button
                          className="advance-btn"
                          onClick={() => advanceStatus(order.id, order.status)}
                          disabled={updating === order.id}
                        >
                          {updating === order.id ? '…' : `→ ${nextStatus}`}
                        </button>
                      )}
                      {!nextStatus && order.status === 'delivered' && (
                        <span style={{ color: '#68d391', fontSize: 12 }}>✓ Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        *, *::before, *::after { box-sizing: border-box; }
        body { background: #0a1117; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e2e8f0; }

        .admin-wrap { min-height: 100vh; background: #0a1117; }

        /* Topbar */
        .admin-topbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px;
          background: rgba(15,25,35,0.95);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          position: sticky; top: 0; z-index: 10;
        }
        .admin-logo { font-size: 18px; font-weight: 900; color: #f7bb23; }
        .admin-logo span { margin-left: 6px; }
        .admin-role { font-size: 12px; color: #64748b; margin-top: 2px; }

        .admin-btn-sm {
          padding: 8px 14px; border-radius: 8px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          color: #e2e8f0; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.2s;
        }
        .admin-btn-sm:hover { background: rgba(255,255,255,0.12); }
        .admin-btn-logout { color: #fc8181; border-color: rgba(252,129,129,0.3); }

        /* Stats */
        .stats-row {
          display: flex; gap: 12px; padding: 20px 24px; overflow-x: auto;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .stat-card {
          background: rgba(22,34,49,0.8);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 16px 20px;
          min-width: 140px; flex: 1;
        }
        .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .stat-value { font-size: 22px; font-weight: 900; color: #f1f5f9; }

        /* Search */
        .admin-search-row { display: flex; gap: 10px; padding: 16px 24px; }
        .admin-search {
          flex: 1; padding: 10px 14px; border-radius: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; font-size: 14px; outline: none;
        }
        .admin-search:focus { border-color: #f7bb23; }

        /* Table */
        .admin-loading { padding: 60px; text-align: center; color: #64748b; font-size: 15px; }
        .orders-table-wrap { overflow-x: auto; padding: 0 24px 40px; }
        .orders-table {
          width: 100%; border-collapse: collapse; font-size: 13px;
          min-width: 900px;
        }
        .orders-table th {
          text-align: left; padding: 10px 12px;
          background: rgba(22,34,49,0.8);
          border-bottom: 2px solid rgba(255,255,255,0.07);
          color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;
          position: sticky; top: 60px;
        }
        .order-row td { padding: 12px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: top; }
        .order-row:hover td { background: rgba(255,255,255,0.02); }
        .td-date { color: #94a3b8; white-space: nowrap; font-size: 12px; }
        .td-name { font-weight: 600; }
        .td-id { font-size: 11px; color: #64748b; margin-top: 2px; }
        .td-ref .ref-pill {
          background: rgba(247,187,35,0.12); color: #f7bb23;
          border: 1px solid rgba(247,187,35,0.2);
          padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
          white-space: nowrap;
        }
        .td-items { color: #94a3b8; font-size: 12px; }
        .td-item-row { margin-bottom: 2px; }
        .td-money { font-weight: 700; white-space: nowrap; }
        .td-cost { color: #fc8181; }
        .td-profit { color: #68d391; }
        .td-margin { font-size: 11px; color: #a0aec0; font-weight: 500; }
        .status-pill {
          display: inline-block; padding: 4px 10px; border-radius: 8px;
          font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .advance-btn {
          padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 700;
          background: rgba(44,90,133,0.3); border: 1px solid rgba(44,90,133,0.5);
          color: #93c5fd; cursor: pointer; transition: background 0.2s;
          white-space: nowrap;
        }
        .advance-btn:hover { background: rgba(44,90,133,0.5); }
        .advance-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}} />
    </div>
  );
}
