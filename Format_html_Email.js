
"""
Created on Tue Feb 24 00:15:45 2026

"""

// ─────────────────────────────────────────────
// n8n CODE NODE — "Format HTML Email"
// Place this between Risk Management1 and Send a message
// ─────────────────────────────────────────────

const rawOutput = $input.first().json.output || '';
const ticker = $('Set Stock Ticker').first().json.ticker || 'UNKNOWN';
const now = new Date();
const dateStr = now.toISOString().replace('T', ' · ').slice(0, 19) + ' UTC';

// ── Helper: extract value from output text ──
function extract(pattern, fallback) {
  const m = rawOutput.match(pattern);
  return m ? m[1].trim() : fallback;
}

// ── Parse the Risk Officer output ──
const decision     = extract(/PORTFOLIO DECISION:\s*\[?([^\]\n*]+)\]?/i, 'UNKNOWN');
const positionSize = extract(/FINAL POSITION SIZE:\s*([\d.]+%?[^*\n]*)/i, 'N/A');
const riskRating   = extract(/RISK RATING:\s*\[?(\d+)/i, '?');
const riskSummary  = extract(/RISK OFFICER SUMMARY[:\s"]+([^"*\n]{30,})/i, rawOutput.slice(0, 300));

// ── Parse each committee member from the summary ──
// The committee_summary has each agent's raw output. We pull key fields.
const committeeSummary = $('Aggregate Committee').first().json.committee_summary || '';

function parseAgent(name, abbr, avClass, defaultPosition, defaultConviction, defaultAlloc, badgeClass) {
  // Try to find conviction level
  const convMatch = committeeSummary.match(new RegExp(name + '[\\s\\S]{0,800}?CONVICTION[^:]*:\\s*\\[?(\\d+)', 'i'));
  const conviction = convMatch ? parseInt(convMatch[1]) : defaultConviction;
  const pct = Math.round((conviction / 10) * 100);

  // Try to find recommendation/position
  const posPatterns = [
    new RegExp(name + '[\\s\\S]{0,500}?(?:TRADE|POSITION|RECOMMENDATION|ANALYSIS|STRATEGY):\\s*\\[?([A-Z /]+)', 'i'),
  ];
  let position = defaultPosition;
  for (const p of posPatterns) {
    const m = committeeSummary.match(p);
    if (m) { position = m[1].trim().slice(0, 25); break; }
  }

  // Try to find allocation
  const allocMatch = committeeSummary.match(new RegExp(name + '[\\s\\S]{0,600}?(?:ALLOCATION|POSITION SIZE|TARGET ALLOCATION):\\s*\\[?([0-9%\\-]+[^\\]*\\n]{0,10})', 'i'));
  const alloc = allocMatch ? allocMatch[1].trim().slice(0, 10) : defaultAlloc;

  return { name, abbr, avClass, position, conviction, pct, alloc, badgeClass };
}

const agents = [
  parseAgent('Steve Cohen',   'SC', 'av-blue',   'SHORT',         8,  8,  'Short',   'badge-red'),
  parseAgent('Charlie Munger','CM', 'av-green',  'AVOID',         9,  9,  '0%',      'badge-gray'),
  parseAgent('Warren Buffett','WB', 'av-yellow', 'SELL',          9,  9,  '0%',      'badge-red'),
  parseAgent('Bill Ackman',   'BA', 'av-red',    'ACTIVIST LONG', 9,  9,  '10–15%',  'badge-purple'),
  parseAgent('Ray Dalio',     'RD', 'av-teal',   'AVOID',         9,  9,  '0%',      'badge-gray'),
];

const avgConviction = (agents.reduce((s, a) => s + a.conviction, 0) / agents.length).toFixed(1);

// ── Decide verdict color ──
const decisionUpper = decision.toUpperCase();
let verdictClass = 'badge-gray', dotClass = '', verdictColor = '#8888a8';
if (decisionUpper.includes('REJECT') || decisionUpper.includes('SELL')) {
  verdictClass = 'badge-red'; dotClass = ''; verdictColor = '#ef4444';
} else if (decisionUpper.includes('IMPLEMENT') || decisionUpper.includes('BUY')) {
  verdictClass = 'badge-green'; dotClass = 'green'; verdictColor = '#22c55e';
} else if (decisionUpper.includes('MODIFY') || decisionUpper.includes('MONITOR')) {
  verdictClass = 'badge-orange'; dotClass = 'orange'; verdictColor = '#f97316';
}

// Risk gauge: dasharray for circle r=32 is ~201. Fill proportionally.
const riskNum = parseInt(riskRating) || 5;
const circumference = 201;
const dashOffset = circumference - (circumference * riskNum / 10);

// ── Build committee rows ──
function badgeColors(cls) {
  const map = {
    'badge-red':    'background:#2a0808;color:#ef4444;border:1px solid #7f1d1d',
    'badge-gray':   'background:#181820;color:#8888a8;border:1px solid #2a2a40',
    'badge-green':  'background:#001a08;color:#22c55e;border:1px solid #14532d',
    'badge-purple': 'background:#1a0a2a;color:#a78bfa;border:1px solid #4c1d95',
    'badge-orange': 'background:#2a1200;color:#f97316;border:1px solid #7c2d12',
  };
  return map[cls] || map['badge-gray'];
}
function avColors(cls) {
  const map = {
    'av-blue':   'background:#1e1e4a;color:#818cf8',
    'av-green':  'background:#0f2a1a;color:#4ade80',
    'av-yellow': 'background:#2a2000;color:#facc15',
    'av-red':    'background:#2a0f0f;color:#f87171',
    'av-teal':   'background:#0f2a28;color:#2dd4bf',
  };
  return map[cls] || '';
}
function allocColor(cls) {
  if (cls === 'badge-red') return '#ef4444';
  if (cls === 'badge-green') return '#22c55e';
  if (cls === 'badge-purple') return '#a78bfa';
  if (cls === 'badge-orange') return '#f97316';
  return '#8888a8';
}

const rows = agents.map(a => `
  <tr>
    <td style="padding:12px;border-bottom:1px solid #111125;vertical-align:middle">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;
          font-family:'Syne',sans-serif;font-size:11px;font-weight:800;flex-shrink:0;${avColors(a.avClass)}">${a.abbr}</div>
        <div>
          <div style="font-weight:500;color:#d0d0e8;font-size:13px">${a.name}</div>
        </div>
      </div>
    </td>
    <td style="padding:12px;border-bottom:1px solid #111125;vertical-align:middle">
      <span style="display:inline-block;padding:3px 10px;border-radius:4px;
        font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:0.05em;
        ${badgeColors(a.badgeClass)}">${a.position}</span>
    </td>
    <td style="padding:12px;border-bottom:1px solid #111125;vertical-align:middle">
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:60px;height:4px;background:#1a1a2e;border-radius:2px;overflow:hidden">
          <div style="width:${a.pct}%;height:100%;border-radius:2px;background:linear-gradient(90deg,#ef4444,#f87171)"></div>
        </div>
        <span style="font-family:'DM Mono',monospace;font-size:11px;color:#6666aa">${a.conviction}/10</span>
      </div>
    </td>
    <td style="padding:12px;border-bottom:1px solid #111125;vertical-align:middle">
      <span style="font-family:'DM Mono',monospace;font-size:12px;color:${allocColor(a.badgeClass)}">${a.alloc}</span>
    </td>
  </tr>`).join('');

// ── Full narrative from output (strip markdown-ish formatting) ──
const cleanOutput = rawOutput
  .replace(/\*\*/g, '')
  .replace(/#{1,3} /g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

// Split into paragraphs for the detail section
const paragraphs = cleanOutput.split('\n\n').slice(0, 12).map(p =>
  `<p style="margin:0 0 10px 0;font-size:12px;color:#7070a0;line-height:1.7;font-family:'DM Sans',sans-serif">${p.replace(/\n/g, '<br>')}</p>`
).join('');

// ── Build full HTML ──
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:32px 16px;background:#0a0a0f;font-family:'DM Sans',sans-serif;color:#e8e8f0">
<div style="max-width:680px;margin:0 auto">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0d0d1a,#12121f);border:1px solid #1e1e35;border-radius:16px 16px 0 0;padding:36px 40px 28px;position:relative;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#6366f1">⬡ AI Hedge Fund</div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:#555570;background:#111125;padding:5px 10px;border-radius:20px;border:1px solid #1e1e35">${dateStr}</div>
    </div>
    <div style="font-family:'Syne',sans-serif;font-size:48px;font-weight:800;color:#fff;letter-spacing:-0.02em;line-height:1;margin-bottom:8px">$<span style="color:#6366f1">${ticker}</span></div>
    <div style="font-family:'DM Mono',monospace;font-size:12px;color:#55556a;letter-spacing:0.05em;text-transform:uppercase">Investment Committee Report</div>
  </div>

  <!-- VERDICT -->
  <div style="background:#0d0d1a;border:1px solid #1e1e35;border-top:none;padding:24px 40px;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
    <div style="display:inline-flex;align-items:center;gap:8px;background:#1a0505;border:1px solid #7f1d1d;border-radius:8px;padding:10px 18px">
      <div style="width:8px;height:8px;border-radius:50%;background:${verdictColor};box-shadow:0 0 8px ${verdictColor};flex-shrink:0"></div>
      <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${verdictColor}">${decision}</div>
    </div>
    <div style="display:flex;gap:20px;flex-wrap:wrap">
      <div style="text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:${verdictColor};line-height:1">${positionSize}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:#555570;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px">Position Size</div>
      </div>
      <div style="text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#f97316;line-height:1">${riskRating}/10</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:#555570;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px">Risk Rating</div>
      </div>
      <div style="text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;line-height:1">${avgConviction}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:#555570;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px">Avg Conviction</div>
      </div>
    </div>
  </div>

  <!-- COMMITTEE TABLE -->
  <div style="background:#0d0d1a;border:1px solid #1e1e35;border-top:none;padding:28px 40px">
    <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6366f1;margin-bottom:16px">// Investment Committee</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#444460;text-align:left;padding:0 12px 10px;border-bottom:1px solid #1a1a2e">Analyst</th>
          <th style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#444460;text-align:left;padding:0 12px 10px;border-bottom:1px solid #1a1a2e">Position</th>
          <th style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#444460;text-align:left;padding:0 12px 10px;border-bottom:1px solid #1a1a2e">Conviction</th>
          <th style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#444460;text-align:left;padding:0 12px 10px;border-bottom:1px solid #1a1a2e">Allocation</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- FULL ANALYSIS -->
  <div style="background:#0d0d1a;border:1px solid #1e1e35;border-top:1px solid #111125;padding:28px 40px">
    <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6366f1;margin-bottom:16px">// Full Risk Officer Analysis</div>
    <div style="background:#080812;border:1px solid #161628;border-radius:8px;padding:20px">
      ${paragraphs}
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:#080810;border:1px solid #1e1e35;border-top:1px solid #111125;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center">
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:#333345;line-height:1.7;letter-spacing:0.03em">
      <strong style="color:#444460">⚠ DISCLAIMER</strong><br>
      AI-generated analysis for educational purposes only. Not financial advice.<br>Consult a qualified financial advisor before making investment decisions.
    </div>
    <div style="margin-top:12px;font-family:'DM Mono',monospace;font-size:10px;color:#2a2a45">
      Generated by <span style="color:#6366f1">AI Hedge Fund Analysis System</span> · Powered by n8n + Gemini
    </div>
  </div>

</div>
</body>
</html>`;

return [{ json: { htmlEmail: html, ticker, decision, riskRating, positionSize } }];