import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { getCycleKey } from '../utils/dateUtils';
import { ArrowLeft, Check } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { label: 'Food', icon: '🍜' },
  { label: 'Transport', icon: '🚌' },
  { label: 'Cloth', icon: '👗' },
  { label: 'Entertainment', icon: '🎮' },
  { label: 'Laundry', icon: '🧺' },
  { label: 'Hostel Accommodations', icon: '🏠' },
  { label: 'Health', icon: '💊' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Other', icon: '📦' },
];

const toLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const TransactionForm = () => {
  const navigate = useNavigate();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(toLocalDateStr());
  const [saving, setSaving] = useState(false);
  const amountRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || isNaN(num) || num <= 0) {
      amountRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      await db.transactions.add({
        type,
        amount: num,
        category: type === 'expense' ? category : null,
        reason: note,
        note,
        date,
        timestamp: Date.now(),
        cycleKey: getCycleKey(date),
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="form-page">
      {/* Header */}
      <div className="form-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h1>Add Record</h1>
      </div>

      {/* Type Toggle */}
      <div className="type-toggle">
        <button
          type="button"
          className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
          onClick={() => setType('expense')}
        >
          <span style={{ fontSize: '1rem' }}>💸</span>
          Expense
        </button>
        <button
          type="button"
          className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
          onClick={() => setType('income')}
        >
          <span style={{ fontSize: '1rem' }}>💰</span>
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Amount */}
        <div className="amount-display">
          <input
            ref={amountRef}
            type="number"
            className="amount-input"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            inputMode="decimal"
            min="0"
            step="any"
            autoFocus
          />
          <p className="amount-label">Amount in rupees</p>
        </div>

        <div className="form-fields">
          {/* Category (expense only) */}
          {type === 'expense' && (
            <div className="field-group">
              <label className="field-label">Category</label>
              <div className="cat-pills">
                {EXPENSE_CATEGORIES.map(c => (
                  <button
                    key={c.label}
                    type="button"
                    className={`cat-pill ${category === c.label ? 'selected' : ''}`}
                    onClick={() => setCategory(c.label)}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note / Source */}
          <div className="field-group">
            <label className="field-label">
              {type === 'expense' ? 'Note (optional)' : 'Source / From whom'}
            </label>
            <input
              type="text"
              className="field-input"
              placeholder={type === 'expense' ? 'e.g. Lunch at canteen' : 'e.g. Dad, Scholarship'}
              value={note}
              onChange={e => setNote(e.target.value)}
              required={type === 'income'}
            />
          </div>

          {/* Date */}
          <div className="field-group">
            <label className="field-label">Date</label>
            <input
              type="date"
              className="field-input"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={toLocalDateStr()}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={saving}>
          {saving ? 'Saving…' : (
            <>
              <Check size={16} style={{ display: 'inline', marginRight: 6 }} />
              Save Record
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
