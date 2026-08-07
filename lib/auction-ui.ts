import { isSfxMuted } from '@/lib/audio-prefs';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    return new Ctx();
  } catch {
    return null;
  }
}

/** Short bid tick (any new bid on the lot). */
export function playBidSound() {
  if (isSfxMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
    window.setTimeout(() => void ctx.close().catch(() => undefined), 300);
  } catch {
    try {
      void ctx.close();
    } catch {
      // ignore
    }
  }
}

/** Bright confirmation when *you* place a successful bid. */
export function playBidAcceptedSound() {
  if (isSfxMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = t + i * 0.06;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
    window.setTimeout(() => void ctx.close().catch(() => undefined), 500);
  } catch {
    try {
      void ctx.close();
    } catch {
      // ignore
    }
  }
}

/** Soft descending tone when someone else outbids you / lot bid rises. */
export function playOutbidSound() {
  if (isSfxMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.22);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
    window.setTimeout(() => void ctx.close().catch(() => undefined), 400);
  } catch {
    try {
      void ctx.close();
    } catch {
      // ignore
    }
  }
}

/** Download a CSV file from rows. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Open a print-friendly summary window (user can Save as PDF). */
export function printSummaryHtml(title: string, htmlBody: string) {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;color:#111}
      h1{font-size:22px;margin:0 0 8px} h2{font-size:16px;margin:20px 0 8px}
      table{border-collapse:collapse;width:100%;margin:8px 0 16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
      th{background:#f5f5f5}
      .muted{color:#666;font-size:12px}
      @media print{button{display:none}}
    </style></head><body>
    <button onclick="window.print()" style="padding:8px 16px;margin-bottom:16px;cursor:pointer">Print / Save as PDF</button>
    <h1>${title}</h1>
    ${htmlBody}
    </body></html>`);
  w.document.close();
}

/** Share / print a single lot moment for social or stream overlays. */
export function shareLotMoment(options: {
  playerName: string;
  role?: string | null;
  currentBid: number;
  highestTeam?: string | null;
  auctionStatus?: string | null;
  formatMoney: (n?: number | null) => string;
}) {
  if (typeof window === 'undefined') return;

  const title = `${options.playerName} — ${options.formatMoney(options.currentBid)}`;
  const body = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;padding:32px;border-radius:24px;background:#0f172a;color:#fff;text-align:center">
      <p style="letter-spacing:.2em;text-transform:uppercase;font-size:11px;color:#fbbf24;font-weight:800">APL Auction Moment</p>
      <h1 style="font-size:36px;margin:12px 0 8px;line-height:1.1">${escapeHtml(options.playerName)}</h1>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px">${escapeHtml(options.role || 'Player')} · ${escapeHtml(options.auctionStatus || 'LIVE')}</p>
      <p style="font-size:42px;font-weight:900;color:#fbbf24;margin:0">${escapeHtml(options.formatMoney(options.currentBid))}</p>
      <p style="margin-top:12px;color:#e2e8f0;font-size:16px">Highest: <strong>${escapeHtml(options.highestTeam || 'No bids yet')}</strong></p>
      <p style="margin-top:28px;font-size:11px;color:#64748b">Ashoka Premier League</p>
    </div>
    <div style="text-align:center;margin-top:16px">
      <button onclick="window.print()" style="padding:10px 18px;border-radius:999px;border:0;background:#f59e0b;font-weight:800;cursor:pointer">Print / Save image</button>
    </div>
  `;

  const shareText = `${options.playerName} is at ${options.formatMoney(options.currentBid)}${options.highestTeam ? ` — ${options.highestTeam}` : ''} | APL Auction`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    void navigator.share({ title, text: shareText, url: window.location.href }).catch(() => {
      openLotMomentWindow(title, body);
    });
    return;
  }

  openLotMomentWindow(title, body);
}

function openLotMomentWindow(title: string, body: string) {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=560,height=720');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>body{margin:0;background:#020617}@media print{button{display:none!important}}</style>
    </head><body>${body}</body></html>`);
  w.document.close();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
