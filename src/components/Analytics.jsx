import React, { useMemo, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  getBillingCycle, getCycleFromKey, getPreviousCycleKey, getNextCycleKey,
  isDateInCycle, formatCurrency
} from '../utils/dateUtils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { ChevronLeft, ChevronRight, BarChart2, TrendingUp } from 'lucide-react';

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#A78BFA', '#60A5FA', '#F59E0B',
  '#34D399', '#F87171', '#FB923C', '#9CA3AF'
];

const CATEGORY_LIST = [
  'Food', 'Transport', 'Cloth', 'Laundry', 'Entertainment',
  'Hostel Accommodations', 'Health', 'Shopping', 'Other'
];

const CATEGORY_ICONS = {
  'Food': '🍜', 'Transport': '🚌', 'Cloth': '👗', 'Laundry': '🧺',
  'Entertainment': '🎮', 'Hostel Accommodations': '🏠', 'Health': '💊',
  'Shopping': '🛍️', 'Other': '📦',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-surface-2)',
      border: '1px solid var(--border-2)',
      borderRadius: 8,
      padding: '8px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600 }}>
          {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
}

const Analytics = () => {
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];

  // Recompute when date changes (midnight rollover, especially on the 10th)
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const timer = setTimeout(() => setToday(new Date()), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [today]);

  const currentCycle = useMemo(() => getBillingCycle(today), [today]);
  const [viewCycleKey, setViewCycleKey] = useState(() => getBillingCycle(new Date()).cycleKey);

  const cycle = useMemo(() => getCycleFromKey(viewCycleKey), [viewCycleKey]);
  const isCurrentCycle = viewCycleKey === currentCycle.cycleKey;

  // Enrich with cycleKey if missing
  const enriched = useMemo(() => allTransactions.map(t => {
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
  }), [allTransactions]);

  const cycleTx = useMemo(() =>
    enriched.filter(t => isDateInCycle(t.date, cycle.startDate, cycle.endDate)),
    [enriched, cycle]
  );

  const income = useMemo(() => cycleTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [cycleTx]);
  const expense = useMemo(() => cycleTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [cycleTx]);
  const savings = income - expense;

  // Category breakdown
  const catBreakdown = useMemo(() => {
    const m = {};
    cycleTx.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Other';
      m[cat] = (m[cat] || 0) + t.amount;
    });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [cycleTx]);

  // Multi-cycle trend (last 5 cycles)
  const trendData = useMemo(() => {
    const cycles = [];
    let ck = currentCycle.cycleKey;
    for (let i = 0; i < 5; i++) {
      const c = getCycleFromKey(ck);
      const txs = enriched.filter(t => isDateInCycle(t.date, c.startDate, c.endDate));
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const [y, m] = ck.split('-').map(Number);
      cycles.unshift({ name: monthNames[m - 1], income: inc, expense: exp, cycleKey: ck });
      ck = getPreviousCycleKey(ck);
    }
    return cycles;
  }, [enriched, currentCycle]);

  // All-time stats
  const allTimeIncome = enriched.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allTimeExpense = enriched.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalTx = enriched.length;

  // Pie chart data
  const pieData = catBreakdown.map((c, i) => ({
    name: c.name,
    value: c.value,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  }));

  const hasData = cycleTx.length > 0;

  const goBack = () => setViewCycleKey(k => getPreviousCycleKey(k));
  const goForward = () => { if (!isCurrentCycle) setViewCycleKey(k => getNextCycleKey(k)); };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <p className="eyebrow">Insights</p>
        <h1>Analytics</h1>
      </div>

      {/* All-time mini cards */}
      <div className="analytics-summary" style={{ marginBottom: 28 }}>
        <div className="analytics-mini-card">
          <div className="analytics-mini-value" style={{ color: 'var(--green)' }}>{formatCurrency(allTimeIncome)}</div>
          <div className="analytics-mini-label">All Income</div>
        </div>
        <div className="analytics-mini-card">
          <div className="analytics-mini-value" style={{ color: 'var(--red)' }}>{formatCurrency(allTimeExpense)}</div>
          <div className="analytics-mini-label">All Spent</div>
        </div>
        <div className="analytics-mini-card">
          <div className="analytics-mini-value">{totalTx}</div>
          <div className="analytics-mini-label">Records</div>
        </div>
      </div>

      {/* 5-month trend chart */}
      {trendData.some(d => d.income > 0 || d.expense > 0) && (
        <div style={{ padding: '0 20px', marginBottom: 28 }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-1)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 16px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp size={14} color="var(--text-muted)" />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                5-Month Trend
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trendData} barSize={14} barGap={4}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'DM Sans' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="income" fill="var(--green)" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="expense" fill="var(--red)" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Income</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expense</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cycle selector */}
      <div className="cycle-nav">
        <button className="cycle-nav-btn" onClick={goBack}>
          <ChevronLeft size={16} />
        </button>
        <div>
          <div className="cycle-nav-label">{cycle.label}</div>
          <div className="cycle-nav-sublabel">{cycleTx.length} transactions</div>
        </div>
        <button className="cycle-nav-btn" onClick={goForward} disabled={isCurrentCycle}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cycle summary */}
      <div className="stat-row" style={{ marginBottom: 24 }}>
        <div className="stat-chip income">
          <div className="stat-chip-label">Income</div>
          <div className="stat-chip-amount">{formatCurrency(income)}</div>
        </div>
        <div className="stat-chip expense">
          <div className="stat-chip-label">Spent</div>
          <div className="stat-chip-amount">{formatCurrency(expense)}</div>
        </div>
      </div>

      {/* Savings banner */}
      {hasData && (
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
          <div style={{
            background: savings >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
            border: `1px solid ${savings >= 0 ? 'rgba(0,200,150,0.25)' : 'rgba(255,77,77,0.25)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              {savings >= 0 ? 'Cycle Savings' : 'Cycle Deficit'}
            </span>
            <span style={{
              fontFamily: 'Syne',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: savings >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {savings >= 0 ? '+' : '-'}{formatCurrency(Math.abs(savings))}
            </span>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {catBreakdown.length > 0 ? (
        <>
          <div className="section-head">
            <span className="section-title">Where money went</span>
          </div>

          {/* Pie chart */}
          {catBreakdown.length > 1 && (
            <div style={{ padding: '0 20px', marginBottom: 20 }}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-1)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}>
                <div style={{ flexShrink: 0 }}>
                  <PieChart width={110} height={110}>
                    <Pie
                      data={pieData}
                      cx={55} cy={55}
                      innerRadius={32} outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {pieData.slice(0, 4).map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                        {CATEGORY_ICONS[d.name] || '📦'} {d.name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {((d.value / expense) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category bars */}
          <div style={{ padding: '0 20px', marginBottom: 32 }}>
            {catBreakdown.map((item, i) => {
              const pct = expense > 0 ? (item.value / expense) * 100 : 0;
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <div key={item.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-1)',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{CATEGORY_ICONS[item.name] || '📦'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</span>
                      <span style={{ fontFamily: 'Syne', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                    <div className="progress-bar-wrap">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><BarChart2 size={24} /></div>
          <div className="empty-state-title">
            {hasData ? 'No expenses yet' : 'No data for this cycle'}
          </div>
          <div className="empty-state-sub">
            {hasData
              ? 'Income recorded. Add an expense to see the breakdown.'
              : 'Add some transactions to see insights'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
