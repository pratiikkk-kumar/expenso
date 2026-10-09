export const getBillingCycle = (date = new Date()) => {
  const currentDay = date.getDate();
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  let startMonth = currentMonth;
  let startYear = currentYear;

  if (currentDay < 10) {
    startMonth = currentMonth - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = currentYear - 1;
    }
  }

  let endMonth = startMonth + 1;
  let endYear = startYear;
  if (endMonth > 11) {
    endMonth = 0;
    endYear = startYear + 1;
  }

  const startDate = new Date(startYear, startMonth, 10);
  const endDate = new Date(endYear, endMonth, 9, 23, 59, 59, 999);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const label = `${monthNames[startMonth]} 10 – ${monthNames[endMonth]} 09`;
  const cycleKey = `${startYear}-${String(startMonth + 1).padStart(2, '0')}`;

  return { startDate, endDate, label, cycleKey, startMonth, startYear };
};

export const getCycleFromKey = (cycleKey) => {
  const [year, month] = cycleKey.split('-').map(Number);
  const startYear = year;
  const startMonth = month - 1;

  let endMonth = startMonth + 1;
  let endYear = startYear;
  if (endMonth > 11) { endMonth = 0; endYear = startYear + 1; }

  const startDate = new Date(startYear, startMonth, 10);
  const endDate = new Date(endYear, endMonth, 9, 23, 59, 59, 999);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const label = `${monthNames[startMonth]} 10 – ${monthNames[endMonth]} 09`;

  return { startDate, endDate, label, cycleKey, startMonth, startYear };
};

// Parse date string as LOCAL date (avoids UTC midnight offset bugs on "YYYY-MM-DD" strings)
export const parseDateLocal = (dateString) => {
  if (!dateString) return new Date(NaN);
  const parts = dateString.split('-').map(Number);
  if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
  return new Date(dateString);
};

export const isDateInCycle = (dateString, cycleStart, cycleEnd) => {
  const d = parseDateLocal(dateString);
  return d >= cycleStart && d <= cycleEnd;
};

export const getPreviousCycleKey = (cycleKey) => {
  const [year, month] = cycleKey.split('-').map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
};

export const getNextCycleKey = (cycleKey) => {
  const [year, month] = cycleKey.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
};

export const getCycleKey = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  if (day >= 10) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  } else {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
  }
};

export const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};
