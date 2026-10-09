import Dexie from 'dexie';

export const db = new Dexie('ExpenseTrackerDB');

db.version(2).stores({
  transactions: '++id, type, amount, category, reason, note, date, timestamp, cycleKey',
  settings: 'key'
});

// Utility: get YYYY-MM-DD string
export const toDateStr = (date = new Date()) => date.toISOString().split('T')[0];
