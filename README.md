# ⬡ AI Hedge Fund — n8n Workflow

An automated investment analysis system that simulates a committee of 5 world-class investors analyzing any stock ticker, then delivers a beautifully formatted HTML report straight to your inbox.

---

## 🧠 How It Works

1. You set a stock ticker (e.g. `TSLA`, `AAPL`, `NVDA`)
2. The workflow fetches **live market data, fundamentals, financials, and news** via APIs
3. Five independent AI agents — each prompted as a legendary investor — analyze the data
4. A **Chief Risk Officer** agent synthesizes all 5 opinions into a final decision
5. A formatted **HTML email report** is automatically sent to your inbox

---

## 👥 The Investment Committee

| Agent | Style | Focus |
|-------|-------|-------|
| 🟦 **Steve Cohen** | Tactical / Multi-Strategy | Entry points, risk management, short-term trades |
| 🟩 **Charlie Munger** | Value / Behavioral | Mental models, cognitive biases, circle of competence |
| 🟨 **Warren Buffett** | Long-Term Value | Economic moats, intrinsic value, management quality |
| 🟥 **Bill Ackman** | Activist Long | Corporate governance, catalyst-driven opportunities |
| 🩵 **Ray Dalio** | Macro / Risk Parity | Economic cycles, diversification, portfolio construction |

---

## 📊 Sample Output

The workflow sends a dark-themed HTML email containing:

- **Verdict banner** — REJECT / SELL / BUY with color coding
- **Key stats** — Position size, risk rating (1–10), avg conviction
- **Committee table** — Each analyst's position, conviction bar, and allocation
- **Consensus factors** — Top 4 agreed-upon risks or opportunities
- **Full Risk Officer analysis** — Complete AI-generated narrative

---

## 🛠️ Tech Stack

- **[n8n](https://n8n.io)** — Workflow automation
- **Google Gemini** (`gemini-1.5-flash`) — Powers all 6 AI agents
- **[Polygon.io](https://polygon.io)** — Market data, fundamentals, financials
- **[NewsAPI](https://newsapi.org)** — Recent news and sentiment
- **Gmail** — Email delivery

---

## 🚀 Setup Guide

### 1. Prerequisites

- n8n instance (self-hosted or cloud)
- Google Gemini API key — [Get one free](https://ai.google.dev)
- Polygon.io API key — [Get one free](https://polygon.io)
- NewsAPI key — [Get one free](https://newsapi.org)
- Gmail account connected to n8n via OAuth2

### 2. Import the Workflow

1. Download `ai-hedge-fund-workflow.json`
2. In n8n, go to **Workflows** → **Import from file**
3. Select the downloaded JSON file

### 3. Configure API Keys

Open each of these nodes and add your API keys:

| Node | Where to add key |
|------|-----------------|
| `Daily Market Data` | `apikey` query parameter |
| `Company Fundamentals` | `apikey` query parameter |
| `Financial Statements` | `apikey` query parameter |
| `News & Sentiment` | `apiKey` query parameter |

> 💡 **Better approach:** Use n8n credentials store instead of hardcoding keys directly in nodes.

### 4. Configure Gmail

1. Open the `Send a message` node
2. Connect your Gmail account via OAuth2
3. Update the `To` field with your email address

### 5. Add the HTML Email Code Node

1. Add a **Code** node between `Risk Management1` and `Send a message`
2. Paste the contents of `format_html_email.js` into it
3. In the Gmail node **Message** field, set: `{{ $json.htmlEmail }}`
4. Set **Email Type** to `HTML`

### 6. Change the Ticker

Open the `Set Stock Ticker` node and change the value:

```
TSLA  →  AAPL  (or any valid US stock ticker)
```

### 7. Run It

Click **Execute Workflow** — you'll receive the full report in your inbox within ~60 seconds.

---

## ⚠️ Rate Limits

The workflow makes **6 Gemini API calls** per run. On the free tier:

| Model | Free Limit |
|-------|-----------|
| `gemini-2.5-flash` | 20 requests/day |
| `gemini-1.5-flash` | 1,500 requests/day ✅ Recommended |

**Recommended:** Use `gemini-1.5-flash` in all 6 Gemini Chat Model nodes to avoid hitting limits.

---

## 📁 File Structure

```
ai-hedge-fund-n8n/
├── README.md                     # This file
├── ai-hedge-fund-workflow.json   # n8n workflow export
└── format_html_email.js          # Code node for HTML email generation
```

---

## 🔧 Customization

**Change the stock ticker:** Edit the `Set Stock Ticker` node — the entire report rebuilds automatically.

**Add more agents:** Duplicate any agent node, change the system prompt to a new investor persona, and add it to the `Investment Committee1` merge node.

**Change the AI model:** Swap out any `Google Gemini Chat Model` node for OpenAI, Claude, or any other LLM supported by n8n.

**Schedule it:** Add a `Schedule Trigger` node instead of `Manual Trigger` to run automatically every morning.

---

## ⚠️ Disclaimer

This project is for **educational purposes only**. The AI-generated analysis does not constitute financial advice. Always consult a qualified financial advisor before making investment decisions. Past performance does not guarantee future results.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with n8n + Google Gemini · Inspired by the world's greatest investors*
