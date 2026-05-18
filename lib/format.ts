export function formatMoney(value?: number | null) {
  const amount = Number(value || 0);
  if (amount >= 1000) return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `${amount}`;
}
export function initials(name?: string | null) {
  return (name || 'APL').split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();
}
export function statusClass(status?: string | null) {
  if (status === 'Sold') return 'border-green-400/30 bg-green-400/10 text-green-200';
  if (status === 'Unsold' || status === 'Rejected') return 'border-red-400/30 bg-red-400/10 text-red-200';
  if (status === 'Live') return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
  return 'border-white/15 bg-white/10 text-white/80';
}
