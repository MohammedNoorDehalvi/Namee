/** Currency / points display — always includes ₹ for scanability in live bidding. */
export function formatMoney(value?: number | null) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '₹0';
  if (amount >= 1000) {
    const compact = amount / 1000;
    const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
    return `₹${text}k`;
  }
  return `₹${Math.round(amount)}`;
}

/** Full amount without compacting (reports, print). */
export function formatMoneyFull(value?: number | null) {
  const amount = Math.round(Number(value || 0));
  if (!Number.isFinite(amount)) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function initials(name?: string | null) {
  return (name || 'APL')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Normalize mixed status enums for display badges. */
export function displayPlayerStatus(player: {
  status?: string | null;
  auction_status?: string | null;
  approval_status?: string | null;
}) {
  const auction = (player.auction_status || '').toUpperCase();
  if (auction === 'SOLD' || player.status === 'Sold') return 'Sold';
  if (auction === 'UNSOLD' || player.status === 'Unsold') return 'Unsold';
  if (auction === 'CURRENT') return 'Live';
  if (player.approval_status === 'Rejected' || player.status === 'Rejected') return 'Rejected';
  if (player.approval_status === 'Pending') return 'Pending';
  if (player.status === 'Available' || auction === 'AVAILABLE' || auction === '') return 'Available';
  return player.status || 'Available';
}

export function statusClass(status?: string | null) {
  const key = (status || '').toLowerCase();
  if (key === 'sold') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (key === 'unsold' || key === 'rejected') return 'border-red-400/30 bg-red-400/10 text-red-200';
  if (key === 'live' || key === 'current') return 'border-amber-300/35 bg-amber-300/15 text-amber-100';
  if (key === 'pending') return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
  return 'border-white/15 bg-white/10 text-white/80';
}
