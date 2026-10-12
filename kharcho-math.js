/**
 * ============================================================================
 * KHARCHO ENGINE - MATHEMATICAL VALUE CALCULATION SUITE
 * ============================================================================
 * Pure, zero-dependency, unit-tested financial formulas for Kharcho.
 * Supports:
 * - Net-effective spend calculation (Base + Fees - Discounts - Vouchers - Cashback - Reward Realization)
 * - Insurance Super Top-Up Restructuring arbitrage
 * - 0% No-Cost EMI Liquidity Arbitrage (Liquid Fund at 7% p.a.)
 * - Cost-per-Use (CPU) Lifetime Utility
 * - Statutory Tax Headroom tracking (Sec 80C, 80D, 80CCD(1B))
 * ============================================================================
 */

(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.KharchoMath = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const KharchoMath = {

    /**
     * Net-Effective Spend Engine
     * Net Spend = Base Price + Fees - Direct Discounts - Voucher Arbitrage - Affiliate Cashback - Card Reward Realization - Special Account Perks
     *
     * @param {Object} p
     * @param {number} p.basePrice - Item listed price
     * @param {number} [p.convenienceFee=0] - Platform / handling fees
     * @param {number} [p.directDiscount=0] - Platform promo code / cart discount
     * @param {number} [p.voucherSavings=0] - Value gained from gift card discount / Gyftr arbitrage
     * @param {number} [p.affiliateCashback=0] - CashKaro / EarnKaro desktop tracked cashback
     * @param {number} [p.cardRewardValue=0] - Realized points/miles conversion value
     * @param {number} [p.accountPerkValue=0] - Special credits, new user arbitrage cap, loyalty perks
     * @returns {Object} { netSpend, grossSavings, savingsPct, breakdown }
     */
    calculateNetSpend: function (p) {
      const base = Number(p.basePrice) || 0;
      const fees = Number(p.convenienceFee) || 0;
      const direct = Number(p.directDiscount) || 0;
      const voucher = Number(p.voucherSavings) || 0;
      const affiliate = Number(p.affiliateCashback) || 0;
      const cardReward = Number(p.cardRewardValue) || 0;
      const accountPerk = Number(p.accountPerkValue) || 0;

      const grossSavings = direct + voucher + affiliate + cardReward + accountPerk;
      const netSpend = Math.max(0, (base + fees) - grossSavings);
      const totalOutlay = base + fees;
      const savingsPct = totalOutlay > 0 ? ((grossSavings / totalOutlay) * 100) : 0;

      return {
        basePrice: base,
        fees: fees,
        grossSavings: Math.round(grossSavings * 100) / 100,
        netSpend: Math.round(netSpend * 100) / 100,
        savingsPct: Math.round(savingsPct * 10) / 10,
        breakdown: {
          directDiscount: direct,
          voucherSavings: voucher,
          affiliateCashback: affiliate,
          cardRewardRealization: cardReward,
          accountPerks: accountPerk
        }
      };
    },

    /**
     * Card Reward Realization Calculator
     * Evaluates effective monetary cashback or point realization for a given card & platform.
     *
     * @param {number} amount - Net payable on card
     * @param {number} rewardRatePct - e.g. 5.0 for SBI Cashback, 3.3 for Infinia base
     * @param {number} [multiplier=1] - e.g. 5 for SmartBuy Infinia, 3 for Atlas Travel
     * @param {number} [pointRedemptionValue=1.0] - Conversion rate to INR (e.g. 1.0 for Infinia flights/hotels, 0.20 for cash)
     * @returns {number} Value in INR
     */
    calculateCardRewards: function (amount, rewardRatePct, multiplier, pointRedemptionValue) {
      const amt = Number(amount) || 0;
      const rate = Number(rewardRatePct) || 0;
      const mult = Number(multiplier) || 1;
      const pointVal = Number(pointRedemptionValue) !== undefined ? Number(pointRedemptionValue) : 1.0;

      const rawReward = amt * (rate / 100) * mult;
      return Math.round(rawReward * pointVal * 100) / 100;
    },

    /**
     * Insurance Restructuring Arbitrage:
     * Compare monolithic high base policy (e.g., ₹25L/₹50L base) vs
     * Restructured portfolio (₹5L Base Floater + ₹20L/₹50L Super Top-Up with ₹5L Deductible).
     * Typically produces ~45% annual premium savings while retaining identical or superior hospital coverage.
     *
     * @param {number} currentMonolithicPremium - e.g. ₹38,000 for a ₹25L-50L single base cover
     * @param {number} base5LPremium - e.g. ₹18,500
     * @param {number} superTopUpPremium - e.g. ₹6,200 for ₹50L Super Top-Up with ₹5L Deductible
     * @returns {Object}
     */
    calculateInsuranceArbitrage: function (currentMonolithicPremium, base5LPremium, superTopUpPremium) {
      const mono = Number(currentMonolithicPremium) || 36000;
      const base = Number(base5LPremium) || 18500;
      const topUp = Number(superTopUpPremium) || 6500;

      const restructuredTotal = base + topUp;
      const annualSavings = Math.max(0, mono - restructuredTotal);
      const savingsPct = mono > 0 ? ((annualSavings / mono) * 100) : 0;
      const tenYearCompoundSavings = Math.round(annualSavings * 14.78); // approx 7% p.a. compound factor over 10 yrs

      return {
        currentMonolithicPremium: mono,
        restructuredBase: base,
        restructuredTopUp: topUp,
        restructuredTotal: restructuredTotal,
        annualSavings: annualSavings,
        savingsPct: Math.round(savingsPct * 10) / 10,
        tenYearCompoundSavings: tenYearCompoundSavings
      };
    },

    /**
     * 0% No-Cost EMI Liquidity Arbitrage Calculator
     * Calculates the net monetary gain when opting for 0% No-Cost EMI (with processing fee & GST accounted for)
     * and parking the upfront purchase amount into a 7.0% p.a. liquid fund or arbitrage fund.
     *
     * @param {number} purchaseAmount - Full price of the item
     * @param {number} tenureMonths - 3, 6, 9, 12, or 24 months
     * @param {number} [liquidFundYieldPct=7.0] - Annual yield on liquid/arbitrage fund
     * @param {number} [processingFeeWithGst=234.82] - ₹199 + 18% GST (Standard bank fee)
     * @returns {Object}
     */
    calculateNoCostEmiArbitrage: function (purchaseAmount, tenureMonths, liquidFundYieldPct, processingFeeWithGst) {
      const p = Number(purchaseAmount) || 0;
      const n = Number(tenureMonths) || 6;
      const r = (Number(liquidFundYieldPct) || 7.0) / 100 / 12; // monthly rate
      const procFee = (processingFeeWithGst !== undefined && processingFeeWithGst !== null) ? Number(processingFeeWithGst) : (199 * 1.18);

      if (p <= 0 || n <= 0) {
        return { grossInterestEarned: 0, processingFee: 0, netArbitrageGain: 0, recommendation: 'Pay upfront' };
      }

      // Decreasing balance monthly model
      const monthlyEmi = p / n;
      let totalInterestEarned = 0;
      let remainingBalance = p;

      for (let month = 1; month <= n; month++) {
        // Interest earned on balance during the month
        const monthlyInterest = remainingBalance * r;
        totalInterestEarned += monthlyInterest;
        remainingBalance -= monthlyEmi;
      }

      const grossInterest = Math.round(totalInterestEarned * 100) / 100;
      const netGain = Math.round((grossInterest - procFee) * 100) / 100;

      return {
        purchaseAmount: p,
        tenureMonths: n,
        monthlyEmi: Math.round(monthlyEmi * 100) / 100,
        grossInterestEarned: grossInterest,
        processingFee: Math.round(procFee * 100) / 100,
        netArbitrageGain: netGain,
        isProfitable: netGain > 0,
        recommendation: netGain > 200 ? 'Take 0% No-Cost EMI & Park in Liquid Fund' : 'Pay in Full (Processing fee negates interest gain)'
      };
    },

    /**
     * Cost-per-Use (CPU) Lifetime Utility Calculator
     * CPU = Price / Expected Uses
     * Discourages fast-fashion and disposable low-utility spending traps.
     *
     * @param {number} price - Purchase price
     * @param {number} expectedLifetimeUses - Estimated times used over product life
     * @param {number} [maintenanceCost=0] - Any upkeep, dry-cleaning, or recurring repairs
     * @returns {Object}
     */
    calculateCostPerUse: function (price, expectedLifetimeUses, maintenanceCost) {
      const p = Number(price) || 0;
      const uses = Math.max(1, Number(expectedLifetimeUses) || 1);
      const maint = Number(maintenanceCost) || 0;

      const totalCost = p + maint;
      const cpu = Math.round((totalCost / uses) * 100) / 100;

      let verdict = 'Optimal Value';
      let verdictColor = 'emerald';
      if (cpu > (p * 0.25)) {
        verdict = 'High-Risk Disposable Purchase (Reconsider)';
        verdictColor = 'rose';
      } else if (cpu < (p * 0.02)) {
        verdict = 'Generational / Essential Utility Asset';
        verdictColor = 'blue';
      }

      return {
        totalCost: totalCost,
        expectedLifetimeUses: uses,
        costPerUse: cpu,
        verdict: verdict,
        verdictColor: verdictColor
      };
    },

    /**
     * Statutory Tax Headroom Calculator
     * Analyzes unclaimed Indian Income Tax allowances under:
     * - Section 80C: Cap ₹1,50,000 (PPF, ELSS, EPF, Life Insurance, School Tuition)
     * - Section 80D: Cap ₹25,000 (Self/Family) + ₹50,000 (Senior Parents) + ₹5,000 Preventive Health Checkup
     * - Section 80CCD(1B): Cap ₹50,000 (Exclusive NPS Tier-1)
     *
     * @param {Object} claimed
     * @param {number} [claimed.sec80c=0]
     * @param {number} [claimed.sec80d_self=0]
     * @param {number} [claimed.sec80d_parents=0]
     * @param {number} [claimed.sec80ccd_nps=0]
     * @param {number} [taxBracketPct=30] - Marginal tax bracket (e.g., 30% + 4% cess = 31.2%)
     * @returns {Object}
     */
    calculateTaxHeadroom: function (claimed, taxBracketPct) {
      const c80c = Number(claimed && claimed.sec80c) || 0;
      const c80dSelf = Number(claimed && claimed.sec80d_self) || 0;
      const c80dParents = Number(claimed && claimed.sec80d_parents) || 0;
      const cNps = Number(claimed && claimed.sec80ccd_nps) || 0;

      const bracket = (Number(taxBracketPct) || 30) * 1.04 / 100; // incl 4% cess

      const max80c = 150000;
      const max80dSelf = 25000;
      const max80dParents = 50000;
      const maxNps = 50000;

      const headroom80c = Math.max(0, max80c - c80c);
      const headroom80dSelf = Math.max(0, max80dSelf - c80dSelf);
      const headroom80dParents = Math.max(0, max80dParents - c80dParents);
      const headroomNps = Math.max(0, maxNps - cNps);

      const totalUnclaimedHeadroom = headroom80c + headroom80dSelf + headroom80dParents + headroomNps;
      const potentialDirectTaxRefund = Math.round(totalUnclaimedHeadroom * bracket);

      return {
        section80C: { cap: max80c, claimed: c80c, headroom: headroom80c },
        section80D_Self: { cap: max80dSelf, claimed: c80dSelf, headroom: headroom80dSelf },
        section80D_Parents: { cap: max80dParents, claimed: c80dParents, headroom: headroom80dParents },
        section80CCD_NPS: { cap: maxNps, claimed: cNps, headroom: headroomNps },
        totalUnclaimedHeadroom: totalUnclaimedHeadroom,
        potentialDirectTaxRefund: potentialDirectTaxRefund,
        taxBracketEffectivePct: Math.round(bracket * 1000) / 10
      };
    },

    /**
     * Personal Value Score (0 - 100)
     * Evaluates financial optimization hygiene across 5 dimensions:
     * 1. Card Spend Routing Efficiency (25 pts)
     * 2. Insurance Structure (Super Top-up vs Monolithic) (20 pts)
     * 3. SaaS / Subscription Cleanliness (15 pts)
     * 4. Pre-Sale Runway & Gifting Preparedness (20 pts)
     * 5. Statutory Tax Optimization (20 pts)
     */
    calculateValueScore: function (metrics) {
      let score = 0;
      const breakdown = {};

      // 1. Card Routing
      const cardEff = metrics.cardEfficiencyPct !== undefined ? metrics.cardEfficiencyPct : 85;
      const cardScore = Math.min(25, Math.round((cardEff / 100) * 25));
      score += cardScore;
      breakdown.cardRouting = { score: cardScore, max: 25 };

      // 2. Insurance
      const hasSuperTopUp = Boolean(metrics.hasSuperTopUp);
      const insScore = hasSuperTopUp ? 20 : 10;
      score += insScore;
      breakdown.insuranceStructure = { score: insScore, max: 20 };

      // 3. SaaS audit
      const unusedSaas = Number(metrics.unusedSaaSCost) || 0;
      const saasScore = unusedSaas === 0 ? 15 : unusedSaas < 5000 ? 10 : 5;
      score += saasScore;
      breakdown.subscriptionHygiene = { score: saasScore, max: 15 };

      // 4. Milestone preparedness
      const upcomingSalesTracked = Number(metrics.upcomingSalesTracked) || 2;
      const giftingScore = upcomingSalesTracked >= 2 ? 20 : 10;
      score += giftingScore;
      breakdown.giftingRunway = { score: giftingScore, max: 20 };

      // 5. Tax Headroom
      const taxHeadroom = Number(metrics.taxHeadroom) || 0;
      const taxScore = taxHeadroom === 0 ? 20 : taxHeadroom < 50000 ? 14 : 8;
      score += taxScore;
      breakdown.taxOptimization = { score: taxScore, max: 20 };

      return {
        totalScore: Math.min(100, Math.max(0, score)),
        grade: score >= 90 ? 'Elite Value Optimizer' : score >= 75 ? 'Sharp Spender' : score >= 55 ? 'Moderate Leakage' : 'Sub-Optimal',
        breakdown: breakdown
      };
    }
  };

  return KharchoMath;
}));
