// utils/dateUtils.js 생성
export function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMonthKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getMonthStartEnd(year, month) {
  // month는 1-based (1 = 1월)
  const start = new Date(year, month - 1, 1); // 해당 월 1일
  const end = new Date(year, month - 1 + 1, 0); // 다음 월 0일 = 해당 월 마지막날
  return { start, end };
}
