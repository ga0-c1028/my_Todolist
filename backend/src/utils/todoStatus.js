function toDateOnly(value) {
  if (!(value instanceof Date)) return value;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodoStatus(startDate, endDate, isCompleted) {
  if (isCompleted) return 'completed';
  const today = toDateOnly(new Date());
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (end < today) return 'overdue';
  if (today < start) return 'notStarted';
  return 'inProgress';
}

module.exports = { getTodoStatus, toDateOnly };
