import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  getCycleFromKey,
  isDateInCycle, formatCurrency
} from '../utils/dateUtils';
import { ChevronDown, ChevronUp, Trash2, Clock } from 'lucide-react';

const CATEGORY_ICONS = {
  'Food': '🍜', 'Transport': '🚌', 'Cloth': '👗', 'Laundry': '🧺',
  'Entertainment': '🎮', 'Hostel Accommodations': '🏠', 'Health': '💊',
  'Shopping': '🛍️', 'Other': '📦',
};

const CATEGORY_COLORS = {
  'Food': '#FF6B6B', 'Transport': '#4ECDC4', 'Cloth': '#A78BFA',
  'Laundry': '#60A5FA', 'Entertainment': '#F59E0B', 'Hostel Accommodations': '#34D399',
  'Health': '#F87171', 'Shopping': '#FB923C', 'Other': '#9CA3AF',
};

function TxRow({ t, onDelete }) {
  const icon = t.type === 'income' ? '💰' : (CATEGORY_ICONS[t.category] || '📦');
  const iconBg = t.type === 'income'
    ? 'rgba(0,200,150,0.12)'
    : `${CATEGORY_COLORS[t.category] || '#9CA3AF'}20`;

  return (
    <div className="tx-item">
      <div className="tx-icon" style={{ background: iconBg }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
      </div>
      <div className="tx-info">
        <div className="tx-title">{t.type === 'expense' ? (t.category || 'Expense') : 'Income'}</div>
        <div className="tx-sub">
          {t.note || t.reason
            ? `${t.note || t.reason} · `
            : ''}
          {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
        </div>
      </div>
      <div className={`tx-amount ${t.type}`}>
        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
      </div>
      <button className="tx-delete-btn" onClick={() => onDelete(t.id)} title="Delete">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function CycleCard({ cycleKey, transactions, onDelete }) {
  const [open, setOpen] = useState(true);
  const cycle = getCycleFromKey(cycleKey);

  const cycleTx = transactions.filter(t => isDateInCycle(t.date, cycle.startDate, cycle.endDate));
  const income = cycleTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = cycleTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  if (cycleTx.length === 0) return null;

  return (
    <div className="history-cycle-card" style={{ marginBottom: 12 }}>
      <div className="history-cycle-header" onClick={() => setOpen(o => !o)}>
        <div>
          <div className="history-cycle-label">{cycle.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            {cycleTx.length} transactions
          </div>
        </div>
        <div className="history-cycle-meta">
          <div className="history-cycle-net" style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </div>
          {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {open && (
        <>
          {/* Quick summary bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            borderBottom: '1px solid var(--border-1)',
          }}>
            <div style={{ padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Income</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'var(--green)' }}>{formatCurrency(income)}</div>
            </div>
            <div style={{ padding: '10px 18px', textAlign: 'center', borderLeft: '1px solid var(--border-1)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Spent</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'var(--red)' }}>{formatCurrency(expense)}</div>
            </div>
          </div>
          {/* Transactions */}
          <div style={{ padding: '8px 2px' }}>
            {[...cycleTx].sort((a, b) => b.timestamp - a.timestamp).map(t => (
              <TxRow key={t.id} t={t} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const History = () => {
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];

  const handleDelete = async (id) => {
    await db.transactions.delete(id);
  };




  // Also handle transactions without cycleKey by assigning on the fly
  const enriched = useMemo(() => {
    return allTransactions.map(t => {
      if (!t.cycleKey && t.date) {
        const d = new Date(t.date);
        const day = d.getDate();
        const mo = d.getMonth();
        const yr = d.getFullYear();
        const ck = day >= 10
          ? `${yr}-${String(mo + 1).padStart(2, '0')}`
          : `${mo === 0 ? yr - 1 : yr}-${String(mo === 0 ? 12 : mo).padStart(2, '0')}`;
        return { ...t, cycleKey: ck };
      }
      return t;
    });
  }, [allTransactions]);

  const allCycleKeys = useMemo(() => {
    const keys = new Set(enriched.map(t => t.cycleKey).filter(Boolean));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [enriched]);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <p className="eyebrow">All records</p>
        <h1>History</h1>
      </div>

      {allCycleKeys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Clock size={24} /></div>
          <div className="empty-state-title">No history yet</div>
          <div className="empty-state-sub">Your past transactions will appear here by billing cycle</div>
        </div>
      ) : (
        <div style={{ paddingBottom: 8 }}>
          {allCycleKeys.map(key => (
            <CycleCard
              key={key}
              cycleKey={key}
              transactions={enriched}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
