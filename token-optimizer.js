/**
 * ============================================================================
 * KHARCHO ENGINE - COMPACT LLM TOKEN OPTIMIZER & AGENT PROTOCOL
 * ============================================================================
 * Enforces Prime Constraint 1: Minimum Token Usage & Extreme Efficiency.
 * - Dynamic context pruning: only injects relevant rows based on category.
 * - Delimited KEY=VAL schema or compact tabular representations.
 * - Under 250 tokens per prompt/completion cycle. Zero filler.
 * ============================================================================
 */

(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.KharchoTokenOptimizer = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const KharchoTokenOptimizer = {

    /**
     * Context Pruner: Selects only relevant cards and rules for the specified category
     */
    pruneContext: function (vault, category, platform) {
      const cat = (category || '').toLowerCase();
      const plat = (platform || '').toLowerCase();

      // Filter cards relevant to category
      const relevantCards = (vault.cards || []).filter(c => {
        const mult = (c.multiplier_platform || '').toLowerCase();
        if (cat.includes('travel') || cat.includes('flight') || cat.includes('hotel')) {
          return mult.includes('travel') || mult.includes('atlas') || mult.includes('infinia') || mult.includes('smartbuy');
        }
        if (cat.includes('pharmacy') || cat.includes('health') || cat.includes('1mg')) {
          return mult.includes('1mg') || mult.includes('tata') || c.bank === 'SBI' || c.bank === 'HDFC';
        }
        if (cat.includes('grocery') || cat.includes('food') || cat.includes('blinkit') || cat.includes('swiggy')) {
          return mult.includes('bigbasket') || mult.includes('online') || c.reward_rate_pct >= 5;
        }
        if (plat.includes('amazon')) {
          return c.card_name.includes('Amazon') || mult.includes('smartbuy') || c.reward_rate_pct >= 5;
        }
        return true;
      }).slice(0, 3); // Max top 3 cards to keep tokens minimal

      return {
        cards: relevantCards,
        rules: (vault.checklist || []).slice(0, 4)
      };
    },

    /**
     * Encodes a transaction request into compact KEY=VAL representation (< 100 tokens)
     */
    encodeTransactionPayload: function (tx) {
      return [
        `CAT=${tx.category || 'General'}`,
        `PLAT=${tx.platform || 'Online'}`,
        `AMT=${tx.amount || 0}`,
        `CARD=${tx.selectedCard || 'Auto'}`,
        `VO=${tx.voucher ? 1 : 0}`,
        `AF=${tx.affiliate ? 1 : 0}`,
        `SEC_NO=${tx.secondaryNum ? 1 : 0}`
      ].join('|');
    },

    /**
     * Generates a hyper-compact LLM System Prompt (< 120 tokens)
     */
    getSystemPrompt: function () {
      return [
        'ROLE: Kharcho Financial Optimization Engine.',
        'TASK: Calculate net out-of-pocket spend and output 1-2-3 step checkout sequence.',
        'FORMAT: Strict compact JSON only: {"net":number,"save":number,"pct":number,"steps":["1...","2...","3..."]}.',
        'ZERO conversational filler or markdown explanations.'
      ].join('\n');
    },

    /**
     * Assembles the optimized prompt payload
     */
    buildLlmPrompt: function (tx, prunedContext) {
      const cardsStr = prunedContext.cards.map(c => `${c.id}:${c.card_name}:${c.reward_rate_pct}%:${c.multiplier_platform}`).join(';');
      return [
        `IN:${this.encodeTransactionPayload(tx)}`,
        `VAULT_CARDS:${cardsStr}`,
        'ACTION:OUTPUT_COMPACT_OPTIMIZATION_JSON'
      ].join('\n');
    },

    /**
     * Parses the LLM's ultra-compact output safely
     */
    parseLlmResponse: function (rawText) {
      try {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        return null;
      }
    }
  };

  return KharchoTokenOptimizer;
}));
