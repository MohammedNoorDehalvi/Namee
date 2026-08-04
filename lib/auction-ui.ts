/** Play a short bid tick sound (no external asset needed). */
export function playBidSound() {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => void ctx.close(), 300);
  } catch {
    // ignore audio errors (autoplay policy, etc.)
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
