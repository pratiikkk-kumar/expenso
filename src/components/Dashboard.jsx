import React, { useMemo, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { getBillingCycle, isDateInCycle, formatCurrency } from '../utils/dateUtils';
import { TrendingUp, TrendingDown, Trash2, Wallet } from 'lucide-react';

const CATEGORY_COLORS = {
  'Food': '#FF6B6B',
  'Transport': '#4ECDC4',
  'Cloth': '#A78BFA',
  'Laundry': '#60A5FA',
  'Entertainment': '#F59E0B',
  'Hostel Accommodations': '#34D399',
  'Health': '#F87171',
  'Shopping': '#FB923C',
  'Other': '#9CA3AF',
};

const CATEGORY_ICONS = {
  'Food': '🍜',
  'Transport': '🚌',
  'Cloth': '👗',
  'Laundry': '🧺',
  'Entertainment': '🎮',
  'Hostel Accommodations': '🏠',
  'Health': '💊',
  'Shopping': '🛍️',
  'Other': '📦',
};

function SpendingRing({ spent, total }) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dashoffset = circ - (pct / 100) * circ;

  const color = pct > 80 ? '#FF4D4D' : pct > 60 ? '#F5A623' : '#00C896';

  return (
    <div className="ring-svg-wrap" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.4s' }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-center-pct">{pct.toFixed(0)}%</span>
        <span className="ring-center-label">used</span>
      </div>
    </div>
  );
}

function TxIcon({ t }) {
  const bg = t.type === 'income'
    ? 'rgba(0,200,150,0.12)'
    : `${CATEGORY_COLORS[t.category] || '#9CA3AF'}20`;
  const emoji = t.type === 'income' ? '💰' : (CATEGORY_ICONS[t.category] || '📦');
  return (
    <div className="tx-icon" style={{ background: bg }}>
      <span style={{ fontSize: '1rem' }}>{emoji}</span>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const allTransactions = useLiveQuery(() => db.transactions.orderBy('timestamp').reverse().toArray()) || [];
  const budget = useLiveQuery(() => db.settings.get('monthly_budget')) || null;

  // Recompute cycle when the date changes (handles midnight rollover, especially on the 10th)
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const timer = setTimeout(() => setToday(new Date()), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [today]);

  const cycle = useMemo(() => getBillingCycle(today), [today]);

  const cycleTransactions = useMemo(() =>
    allTransactions.filter(t => isDateInCycle(t.date, cycle.startDate, cycle.endDate)),
    [allTransactions, cycle]
  );

  const cycleIncome = useMemo(() =>
    cycleTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [cycleTransactions]
  );

  const cycleExpense = useMemo(() =>
    cycleTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [cycleTransactions]
  );

  const balance = cycleIncome - cycleExpense;
  const budgetVal = budget ? Number(budget.value) : cycleIncome;

  // Category breakdown for current cycle expenses
  const catMap = useMemo(() => {
    const m = {};
    cycleTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Other';
      m[cat] = (m[cat] || 0) + t.amount;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [cycleTransactions]);

  const recentTx = cycleTransactions.slice(0, 6);

  const handleDelete = async (id) => {
    await db.transactions.delete(id);
  };

  return (
    <div className="page">
      {/* Balance Hero */}
      <div className="balance-hero anim-fade-up">
        <p className="balance-label">Current Cycle Balance</p>
        <p className={`balance-amount ${balance < 0 ? 'negative' : ''}`}>
          {balance < 0 ? '-' : ''}{formatCurrency(Math.abs(balance))}
        </p>
        <p className="balance-cycle">{cycle.label}</p>
      </div>

      {/* Stat Row */}
      <div className="stat-row stagger anim-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="stat-chip income">
          <div className="stat-chip-label">Income</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="stat-chip-icon"><TrendingUp size={14} /></div>
            <div className="stat-chip-amount">{formatCurrency(cycleIncome)}</div>
          </div>
        </div>
        <div className="stat-chip expense">
          <div className="stat-chip-label">Spent</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="stat-chip-icon"><TrendingDown size={14} /></div>
            <div className="stat-chip-amount">{formatCurrency(cycleExpense)}</div>
          </div>
        </div>
      </div>

      {/* Spending Ring + Category Legend */}
      {cycleExpense > 0 && (
        <div style={{ padding: '0 20px 24px', animationDelay: '140ms' }} className="anim-fade-up">
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-1)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20 }}>
              Spending Overview
            </div>
            <div className="ring-container" style={{ padding: 0 }}>
              <SpendingRing spent={cycleExpense} total={budgetVal || cycleIncome || cycleExpense} />
              <div className="ring-legend">
                {catMap.slice(0, 4).map(([cat, val]) => (
                  <div key={cat} className="ring-legend-item">
                    <div className="ring-legend-dot" style={{ background: CATEGORY_COLORS[cat] || '#9CA3AF' }} />
                    <div>
                      <div className="ring-legend-text">{cat}</div>
                      <div className="ring-legend-amount">{formatCurrency(val)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="section-head anim-fade-up" style={{ animationDelay: '200ms' }}>
        <span className="section-title">Recent Activity</span>
        {cycleTransactions.length > 6 && (
          <span className="section-action" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>
            See all →
          </span>
        )}
      </div>

      <div className="tx-list stagger">
        {recentTx.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon"><Wallet size={24} /></div>
            <div className="empty-state-title">No transactions yet</div>
            <div className="empty-state-sub">Tap + to record your first income or expense</div>
          </div>
        ) : recentTx.map(t => (
          <div key={t.id} className="tx-item anim-fade-up">
            <TxIcon t={t} />
            <div className="tx-info">
              <div className="tx-title">{t.type === 'expense' ? t.category : (t.reason || 'Income')}</div>
              <div className="tx-sub">
                {t.type === 'expense' && t.reason ? `${t.reason} · ` : ''}
                {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            <div className={`tx-amount ${t.type}`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </div>
            <button className="tx-delete-btn" onClick={() => handleDelete(t.id)} title="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
