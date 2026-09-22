/* ==========================================================================
   Circulyze — Decision Engine (prototype)
   ---------------------------------------------------------------------
   This is an AI-ASSISTED PROTOTYPE RECOMMENDATION, not a trained model.
   It scores each disposition route with a transparent, editable formula so
   the logic can be inspected and swapped for a real model/API later.

   TO CONNECT A REAL MODEL LATER:
   Replace the body of SR.decisionEngine.evaluate() with a call to your
   inference endpoint, e.g.:
     const res = await fetch('/api/decision-engine', {method:'POST', body: JSON.stringify(formData)});
     return await res.json();
   Keep the same return shape (see bottom of this file) so dashboard.js,
   pricing.js and sustainability.js keep working unmodified.
   ========================================================================== */
window.SR = window.SR || {};

SR.decisionEngine = (function () {

  const CONDITION_RANK = { "Like New": 4, "Good": 3, "Fair": 2, "Damaged": 1, "Non-functional": 0 };
  const CONDITION_MULTIPLIER = { "Like New": 1.0, "Good": 0.85, "Fair": 0.62, "Damaged": 0.32, "Non-functional": 0.05 };

  // Weight/embodied-carbon assumptions per category — used for sustainability estimates.
  const CATEGORY_PROFILE = {
    "Laptop":      { weightKg: 1.8, embodiedCo2: 350 },
    "Smartphone":  { weightKg: 0.2, embodiedCo2: 70 },
    "Tablet":      { weightKg: 0.5, embodiedCo2: 110 },
    "Smartwatch":  { weightKg: 0.05, embodiedCo2: 20 },
    "Headphones":  { weightKg: 0.25, embodiedCo2: 25 },
    "_default":    { weightKg: 0.5, embodiedCo2: 80 }
  };

  // Route economics — editable without touching the scoring code below.
  const ROUTE_PARAMS = {
    resell:    { baseMultiplier: 0.95, minConditionRank: 3, recoveryCostShare: 0.30, co2Factor: 0.95, ewasteFactor: 1.00, baseHours: 3.2 },
    refurbish: { baseMultiplier: 0.82, minConditionRank: 1, recoveryCostShare: 1.00, co2Factor: 0.85, ewasteFactor: 1.00, baseHours: 5.5 },
    exchange:  { baseMultiplier: 0.74, minConditionRank: 2, recoveryCostShare: 0.50, co2Factor: 0.75, ewasteFactor: 1.00, baseHours: 2.0 },
    donate:    { baseMultiplier: 0.15, minConditionRank: 1, recoveryCostShare: 0.20, co2Factor: 0.90, ewasteFactor: 1.00, baseHours: 30 },
    recycle:   { baseMultiplier: 0.05, minConditionRank: 0, recoveryCostShare: 0.20, co2Factor: 0.30, ewasteFactor: 0.90, baseHours: 60 },
    writeOff:  { baseMultiplier: 0,    minConditionRank: 0, recoveryCostShare: 0,    co2Factor: 0,    ewasteFactor: 0,    baseHours: 0 }
  };

  const RANK_PENALTY = 0.12; // multiplier applied when a route is used below its ideal condition rank
  const WEIGHTS = { value: 0.6, sustainability: 0.4 };

  function categoryProfile(category) {
    return CATEGORY_PROFILE[category] || CATEGORY_PROFILE._default;
  }

  function scoreRoute(routeId, form) {
    const p = ROUTE_PARAMS[routeId];
    const rank = CONDITION_RANK[form.condition] ?? 2;
    const condMult = CONDITION_MULTIPLIER[form.condition] ?? 0.5;
    const belowMin = rank < p.minConditionRank;
    const eligibilityFactor = belowMin ? RANK_PENALTY : 1;

    let warrantyFactor = 1;
    if (routeId === "exchange") warrantyFactor = form.warranty === "Active" ? 1.2 : 0.85;

    const baseValue = Number(form.marketPrice || form.currentValue || 0);
    const recoveryCost = Number(form.recoveryCost || 0);

    let value = baseValue * condMult * p.baseMultiplier * eligibilityFactor * warrantyFactor
              - recoveryCost * p.recoveryCostShare;
    value = Math.max(0, Math.round(value));

    const profile = categoryProfile(form.category);
    const co2Avoided = routeId === "writeOff" ? 0 : Math.round(profile.embodiedCo2 * p.co2Factor * (0.6 + condMult * 0.4) * 10) / 10;
    const ewasteAvoided = routeId === "writeOff" ? 0 : Math.round(profile.weightKg * p.ewasteFactor * 100) / 100;

    const hours = routeId === "writeOff" ? 0 : Math.round((p.baseHours + recoveryCost / 2000) * 10) / 10;

    return { id: routeId, value, co2Avoided, ewasteAvoided, hours, eligible: !belowMin };
  }

  function evaluate(form) {
    const ids = Object.keys(ROUTE_PARAMS);
    const results = ids.map(id => scoreRoute(id, form));

    const maxValue = Math.max(1, ...results.map(r => r.value));
    const maxCo2 = Math.max(1, ...results.map(r => r.co2Avoided));

    results.forEach(r => {
      r.valueScorePct = Math.round((r.value / maxValue) * 100);
      r.sustainScorePct = Math.round((r.co2Avoided / maxCo2) * 100);
      r.combinedScore = WEIGHTS.value * r.valueScorePct + WEIGHTS.sustainability * r.sustainScorePct;
      // A route that doesn't meet its minimum condition requirement shouldn't win purely
      // on a sustainability tie-break when recoverable value has collapsed to ~0 for everyone.
      if (!r.eligible) r.combinedScore *= 0.3;
    });

    results.sort((a, b) => b.combinedScore - a.combinedScore);
    const winner = results[0];
    const runnerUp = results[1];
    const confidence = Math.max(58, Math.min(97, Math.round(62 + (winner.combinedScore - runnerUp.combinedScore) * 0.9)));

    const label = SR.data.routesMeta[winner.id].label;
    const reason = buildReason(winner, form, results);

    return {
      routeId: winner.id,
      label,
      confidence,
      valueScorePct: winner.valueScorePct,
      sustainScorePct: winner.sustainScorePct,
      estimatedValue: winner.value,
      recoveryCost: Number(form.recoveryCost || 0),
      hours: winner.hours,
      co2Avoided: winner.co2Avoided,
      ewasteAvoided: winner.ewasteAvoided,
      reason,
      allRoutes: results
    };
  }

  function buildReason(winner, form, results) {
    const recycle = results.find(r => r.id === "recycle");
    const writeOff = results.find(r => r.id === "writeOff");
    const condition = form.condition || "the reported condition";
    const cost = Number(form.recoveryCost || 0);

    const templates = {
      resell: `${condition} condition and a low recovery cost of ₹${cost.toLocaleString("en-IN")} mean the unit can go straight to resale without extra spend.`,
      refurbish: `${condition} condition and a manageable recovery cost make refurbishment recover more value than recycling (₹${recycle.value.toLocaleString("en-IN")}) or writing off (₹${writeOff.value.toLocaleString("en-IN")}).`,
      exchange: `An active exchange path and moderate condition let this unit resolve fastest as a swap rather than a full resale or repair cycle.`,
      donate: `Functional but low resale demand makes donation the better outcome — the unit stays in use instead of being discarded.`,
      recycle: `Condition and recovery cost rule out profitable resale or refurbishment, so material recovery captures the most remaining value.`,
      writeOff: `No route recovers meaningful value or safe material — this unit is best removed from inventory.`
    };
    return templates[winner.id] || "This route balances recovered value and environmental impact best for this return.";
  }

  return { evaluate, CONDITION_RANK, CONDITION_MULTIPLIER, ROUTE_PARAMS, categoryProfile };
})();
