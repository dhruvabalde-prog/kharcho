/**
 * ============================================================================
 * KHARCHO ENGINE - GOOGLE APPS SCRIPT WEB APP BACKEND (Code.gs)
 * ============================================================================
 * Zero-infrastructure bridge connecting the Kharcho Single-File App
 * to the Google Sheets Vault.
 *
 * 5 Vault Sheets:
 * 1. Cards_and_Perks
 * 2. Gifting_and_Sizing
 * 3. Insurance_and_Health
 * 4. Subscriptions_and_SaaS
 * 5. Pre_Flight_Checklist
 * ============================================================================
 */

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'read_all';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'read_all') {
      const payload = {
        status: 'success',
        timestamp: new Date().toISOString(),
        cards: readSheetAsJson(ss.getSheetByName('Cards_and_Perks')),
        gifting: readSheetAsJson(ss.getSheetByName('Gifting_and_Sizing')),
        insurance: readSheetAsJson(ss.getSheetByName('Insurance_and_Health')),
        subscriptions: readSheetAsJson(ss.getSheetByName('Subscriptions_and_SaaS')),
        checklist: readSheetAsJson(ss.getSheetByName('Pre_Flight_Checklist'))
      };
      return createJsonResponse(payload);
    }

    if (action === 'init_vault') {
      initializeVaultSheets(ss);
      return createJsonResponse({ status: 'success', message: 'Vault initialized with 5 core schemas & default presets' });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', error: err.toString() });
  }
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action || 'sync_update';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'save_record') {
      const sheetName = contents.sheet;
      const data = contents.data;
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        return createJsonResponse({ status: 'error', message: 'Sheet not found: ' + sheetName });
      }
      appendOrUpdateRow(sheet, data);
      return createJsonResponse({ status: 'success', message: 'Record saved to ' + sheetName });
    }

    if (action === 'batch_sync') {
      if (contents.cards) syncEntireSheet(ss.getSheetByName('Cards_and_Perks'), contents.cards);
      if (contents.gifting) syncEntireSheet(ss.getSheetByName('Gifting_and_Sizing'), contents.gifting);
      if (contents.insurance) syncEntireSheet(ss.getSheetByName('Insurance_and_Health'), contents.insurance);
      if (contents.subscriptions) syncEntireSheet(ss.getSheetByName('Subscriptions_and_SaaS'), contents.subscriptions);
      return createJsonResponse({ status: 'success', message: 'Batch sync complete' });
    }

    return createJsonResponse({ status: 'error', message: 'Invalid POST action' });
  } catch (err) {
    return createJsonResponse({ status: 'error', error: err.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function readSheetAsJson(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    let hasData = false;
    for (let j = 0; j < headers.length; j++) {
      const val = data[i][j];
      if (val !== '' && val !== null && val !== undefined) hasData = true;
      row[headers[j]] = val;
    }
    if (hasData) rows.push(row);
  }
  return rows;
}

function appendOrUpdateRow(sheet, record) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const idColIndex = headers.indexOf('id');
  
  if (idColIndex !== -1 && record.id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColIndex]) === String(record.id)) {
        const rowData = headers.map(h => record[h] !== undefined ? record[h] : data[i][headers.indexOf(h)]);
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        return;
      }
    }
  }
  
  const newRow = headers.map(h => record[h] !== undefined ? record[h] : '');
  sheet.appendRow(newRow);
}

function syncEntireSheet(sheet, items) {
  if (!sheet || !items || !items.length) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerKeys = headers.map(h => String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
  
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  const matrix = items.map(item => {
    return headerKeys.map(k => item[k] !== undefined ? item[k] : '');
  });
  
  sheet.getRange(2, 1, matrix.length, headerKeys.length).setValues(matrix);
}

function initializeVaultSheets(ss) {
  const schemas = [
    {
      name: 'Cards_and_Perks',
      headers: ['id', 'card_name', 'bank', 'network', 'reward_rate_pct', 'multiplier_platform', 'lounge_domestic_qtr', 'lounge_intl_yr', 'milestone_target', 'fee_waiver_spend', 'current_annual_spend', 'expiry_or_renewal'],
      samples: [
        ['c1', 'HDFC Infinia Metal', 'HDFC', 'Visa Infinite', 3.3, 'SmartBuy Gyftr 5X (16.6%)', 99, 99, 1000000, 1000000, 480000, '2027-04-01'],
        ['c2', 'SBI Cashback', 'SBI', 'Mastercard', 5.0, 'All Online E-Com (5% direct)', 0, 0, 200000, 200000, 145000, '2027-02-15'],
        ['c3', 'Axis Atlas', 'Axis', 'Visa Signature', 4.0, 'Travel EDGE (10%)', 8, 4, 750000, 750000, 310000, '2027-08-30'],
        ['c4', 'Tata Neu Infinity', 'HDFC', 'RuPay UPI', 1.5, 'Tata Neu Tata 1mg/BigBasket (10%)', 8, 0, 300000, 300000, 95000, '2026-11-20'],
        ['c5', 'Amazon Pay ICICI', 'ICICI', 'Visa Platinum', 5.0, 'Amazon Prime (5%)', 0, 0, 0, 0, 62000, 'Lifetime Free']
      ]
    },
    {
      name: 'Gifting_and_Sizing',
      headers: ['id', 'person_name', 'relationship', 'milestone_type', 'milestone_date', 'pre_sale_notice_days', 'brand_sizes_json', 'preferred_gift_categories', 'notes'],
      samples: [
        ['g1', 'Mother', 'Mother', 'Birthday', '2026-11-28', 45, '{"FabIndia": "4XL Cotton", "Biba": "42 Kurti", "Skechers": "UK 6"}', 'Ethnic wear, Orthopedic footwear, Tea gift sets', 'Prefers pure breathable cotton'],
        ['g2', 'Spouse', 'Spouse', 'Anniversary', '2026-12-14', 45, '{"Uniqlo": "M Regular", "Zara": "M", "Nike": "UK 7.5"}', 'Skincare, Travel gear, Tech accessories', 'Watch for Uniqlo Arigato sale'],
        ['g3', 'Self', 'Self', 'Milestone', '2027-01-10', 30, '{"Uniqlo": "L Fit", "Levi": "34/32", "Adidas": "UK 9"}', 'Activewear, Noise-cancelling headphones', 'Check Black Friday / Republic Day sales']
      ]
    },
    {
      name: 'Insurance_and_Health',
      headers: ['id', 'policy_holder', 'insurer', 'policy_type', 'base_sum_insured', 'super_topup_insured', 'super_topup_deductible', 'annual_premium', 'renewal_date', 'free_health_checkup_avail', 'opd_balance', 'sec_80d_eligible'],
      samples: [
        ['i1', 'Self & Family Floater', 'HDFC ERGO Optima Secure', 'Base Floater', 500000, 0, 0, 18500, '2027-06-15', true, 5000, 25000],
        ['i2', 'Family Super Top-Up', 'Care Insurance Health Supreme', 'Super Top-Up', 0, 5000000, 500000, 9200, '2027-06-15', false, 0, 9200],
        ['i3', 'Senior Parents Floater', 'Star Senior Citizens Red Carpet', 'Base Floater', 500000, 2500000, 500000, 48000, '2026-12-05', true, 0, 50000]
      ]
    },
    {
      name: 'Subscriptions_and_SaaS',
      headers: ['id', 'service_name', 'category', 'billing_cycle', 'cost_inr', 'renewal_date', 'free_open_source_alt', 'potential_annual_savings', 'utilization_status'],
      samples: [
        ['s1', 'Notion Team / Plus', 'Productivity', 'Annual', 9600, '2027-03-01', 'Obsidian (Local Markdown / Sync)', 9600, 'High - Re-evaluate for Obsidian'],
        ['s2', 'Canva Pro', 'Design', 'Annual', 4000, '2026-11-15', 'Figma (Free tier) / Penpot', 4000, 'Underutilized (Can downgrade)'],
        ['s3', 'Google One 2TB AI', 'Cloud & AI', 'Monthly', 1950, '2026-10-28', 'Local NAS / Hard drive backup', 23400, 'Active'],
        ['s4', 'Amazon Prime India', 'Shopping & OTT', 'Annual', 1499, '2027-01-20', 'Free delivery with ₹499 cart consolidation', 1499, 'Essential for Prime 5% CB'],
        ['s5', 'Spotify Duo', 'Music', 'Monthly', 149, '2026-11-05', 'YouTube Music via Family Plan consolidation', 1788, 'Active']
      ]
    },
    {
      name: 'Pre_Flight_Checklist',
      headers: ['rule_id', 'step_order', 'check_name', 'action_instruction', 'arbitrage_impact_pct', 'mandatory'],
      samples: [
        ['r1', 1, 'Voucher Multiplier Arbitrage', 'Check Gyftr / SmartBuy / Magicpin / Hubble for 3% - 16.6% instant discounted vouchers before hitting checkout', 16.6, true],
        ['r2', 2, 'Desktop Affiliate Tracking', 'Activate CashKaro / EarnKaro on desktop browser. Mobile apps often drop referral cookies due to deep-linking', 8.5, true],
        ['r3', 3, 'Secondary Family Number Hack', 'Check if secondary family phone number is eligible for first-order coupons (20%-25% off pharmacy/grocery up to ₹500 cap)', 20.0, true],
        ['r4', 4, 'Brand-Calibrated Sizing Match', 'Verify against Gifting & Sizing registry to eliminate return hassles and lost courier charges', 0.0, true],
        ['r5', 5, 'Card Milestones & Spend Routing', 'Route to card nearing fee-waiver threshold or highest reward multiplier; ensure no MCC exclusion', 5.0, true]
      ]
    }
  ];

  schemas.forEach(schema => {
    let sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
    }
    sheet.clear();
    sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
    sheet.getRange(1, 1, 1, schema.headers.length).setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
    if (schema.samples.length > 0) {
      sheet.getRange(2, 1, schema.samples.length, schema.headers.length).setValues(schema.samples);
    }
    sheet.autoResizeColumns(1, schema.headers.length);
  });
}
