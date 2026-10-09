import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatCurrency } from '../utils/dateUtils';
import { Wallet, Trash2, Check, AlertTriangle } from 'lucide-react';

const Profile = () => {
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const budgetSetting = useLiveQuery(() => db.settings.get('monthly_budget')) || null;
  const nameSetting = useLiveQuery(() => db.settings.get('user_name')) || null;

  const [budget, setBudget] = useState('');
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  useEffect(() => {
    if (budgetSetting?.value) setBudget(budgetSetting.value);
  }, [budgetSetting]);

  useEffect(() => {
    if (nameSetting?.value) setName(nameSetting.value);
  }, [nameSetting]);

  const allTimeIncome = allTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allTimeExpense = allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netSavings = allTimeIncome - allTimeExpense;

  const handleSave = async () => {
    let didSave = false;
    const trimmedBudget = String(budget).trim();
    const trimmedName = name.trim();
    if (trimmedBudget && Number(trimmedBudget) > 0) {
      await db.settings.put({ key: 'monthly_budget', value: trimmedBudget });
      didSave = true;
    }
    if (trimmedName) {
      await db.settings.put({ key: 'user_name', value: trimmedName });
      didSave = true;
    }
    if (didSave) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClearAll = async () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 4000);
      return;
    }
    await db.transactions.clear();
    setClearConfirm(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Settings</p>
        <h1>Profile</h1>
      </div>

      {/* All-time stats */}
      <div style={{ padding: '0 20px', marginBottom: 28 }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-1)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              All-Time Overview
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              { label: 'Earned', value: formatCurrency(allTimeIncome), color: 'var(--green)' },
              { label: 'Spent', value: formatCurrency(allTimeExpense), color: 'var(--red)' },
              { label: 'Saved', value: formatCurrency(Math.abs(netSavings)), color: netSavings >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map((item, i) => (
              <div key={item.label} style={{
                padding: '16px 12px',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid var(--border-1)' : 'none',
              }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1rem', color: item.color, marginBottom: 4 }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-1)', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {allTransactions.length} total transactions recorded
            </span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-1)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Preferences
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Name */}
            <div className="field-group" style={{ gap: 8 }}>
              <label className="field-label">Your Name</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Rahul"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Budget */}
            <div className="field-group" style={{ gap: 8 }}>
              <label className="field-label">Monthly Budget (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'Syne', fontWeight: 700, color: 'var(--text-muted)', fontSize: '1.1rem',
                }}>₹</span>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 5000"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  style={{ paddingLeft: 32 }}
                  min="0"
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Used to calculate spending % on the dashboard ring
              </p>
            </div>

            <button
              className="submit-btn"
              onClick={handleSave}
              style={{
                background: saved ? 'var(--green)' : undefined,
                color: saved ? '#000' : undefined,
                transition: 'all 0.3s',
              }}
            >
              {saved ? (
                <><Check size={16} style={{ display: 'inline', marginRight: 6 }} />Saved!</>
              ) : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Billing cycle info */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(245,166,35,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Wallet size={16} color="var(--amber)" />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>
                Billing Cycle: 10th – 9th
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Your budget resets on the <strong style={{ color: 'var(--text-secondary)' }}>10th of every month</strong>.
                Transactions are grouped from the 10th to the 9th of the next month.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ padding: '0 20px', marginBottom: 40 }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${clearConfirm ? 'rgba(255,77,77,0.4)' : 'var(--border-1)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          transition: 'border-color 0.2s',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--red-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertTriangle size={16} color="var(--red)" />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Danger Zone</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {clearConfirm
                  ? '⚠️ This will delete ALL your transaction history. Tap again to confirm.'
                  : 'Permanently delete all transaction data. This cannot be undone.'}
              </div>
            </div>
          </div>
          <button
            onClick={handleClearAll}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: clearConfirm ? 'var(--red)' : 'transparent',
              border: `1px solid ${clearConfirm ? 'var(--red)' : 'rgba(255,77,77,0.3)'}`,
              color: clearConfirm ? '#fff' : 'var(--red)',
              fontFamily: 'Syne',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Trash2 size={14} />
            {clearConfirm ? 'Confirm — Delete Everything' : 'Clear All Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
