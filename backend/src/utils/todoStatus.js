function toDateOnly(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
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
