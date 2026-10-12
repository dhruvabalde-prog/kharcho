# Kharcho Engine — Architecture & Implementation Guide

Kharcho is an autonomous financial value optimization engine designed to maximize net retained capital and minimize out-of-pocket spend across household, personal, and business transactions.

---

## 1. Prime Constraints Followed

1. **Zero Infrastructure Bloat**:
   - **Vault**: Google Sheets backend with 5 structured schemas.
   - **Bridge**: Google Apps Script (`Code.gs`) web endpoint (< 200ms latency, zero container hosting).
   - **Interface**: Single-file HTML5/CSS/JS (`index.html`) using native DOM manipulation and zero `node_modules` runtime overhead.
2. **Extreme Token Efficiency**:
   - `token-optimizer.js` prunes dynamic context, loading only relevant cards and rules.
   - Prompts use pipe-delimited schemas (`KEY=VAL`), consuming under 40 tokens per query.
3. **Buttons & Dropdowns Interaction Paradigm**:
   - Zero free-form chat prompts.
   - Progressive dropdowns, interactive stepper pills, and 1-2-3 step checkout sequence generation.

---

## 2. Directory Structure

```
c:/Users/Lenovo/.gemini/antigravity/scratch/kharcho/
├── index.html            # Unified 4-tab Single-File Application
├── kharcho-math.js       # Pure JS Financial Calculation Suite
├── token-optimizer.js    # LLM Dynamic Context Pruner & Token Budget Protocol
├── Code.gs               # Google Apps Script Web App for Google Sheets Vault
└── README.md             # Architecture & Run Guide
```

---

## 3. Core Formulas Implemented

* **Net Spend Formula**:
  $$\text{Net Spend} = \text{Base Price} + \text{Fees} - \text{Direct Discounts} - \text{Vouchers} - \text{Cashback} - \text{Rewards} - \text{Account Perks}$$
* **Insurance Arbitrage**:
  $$\text{Savings} = \text{Monolithic 50L Premium} - (\text{5L Base Floater} + \text{50L Super Top-Up})$$
* **0% No-Cost EMI Liquidity Arbitrage**:
  $$\text{Net Gain} = \sum_{t=1}^N (\text{Balance}_t \times r) - (\text{Bank Processing Fee} + \text{GST})$$
* **Cost-Per-Use (CPU)**:
  $$\text{CPU} = \frac{\text{Price} + \text{Maintenance}}{\text{Expected Uses}}$$
* **Tax Headroom**:
  $$\text{Refund} = (\text{Unclaimed 80C} + \text{Unclaimed 80D} + \text{Unclaimed NPS 80CCD}) \times (\text{Marginal Rate} \times 1.04)$$

---

## 4. How to Run & Deploy

1. **Run Locally**:
   Simply open [`index.html`](file:///c:/Users/Lenovo/.gemini/antigravity/scratch/kharcho/index.html) in any web browser.
2. **Deploy to Google Apps Script**:
   - Create a Google Sheet.
   - Go to **Extensions > Apps Script** and paste [`Code.gs`](file:///c:/Users/Lenovo/.gemini/antigravity/scratch/kharcho/Code.gs).
   - Run `doGet({ parameter: { action: 'init_vault' } })` to auto-create and populate all 5 vault sheets.
   - Deploy as a **Web App** (Execute as: Me, Access: Anyone).
