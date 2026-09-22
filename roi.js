/* ==========================================================================
   Circulyze — ROI Tracking (merchant dashboard)
   Reuses SR.data (merchants/company/routes), SR.util.money, existing card /
   stat-grid / bar-chart styles. No new dependencies.

   DATA INTEGRITY NOTE:
   Value recovered, CO₂ avoided, e-waste avoided, returns and route history
   are the app's real merchant/company figures (data/merchants.json,
   data/company.json). The app has no stored "before Circulyze" baseline and
   no real platform-cost figure, so the before/after comparison and the ROI
   multiple below are illustrative demo assumptions — clearly labelled as
   such in the UI rather than presented as measured history.
   ========================================================================== */
window.SR = window.SR || {};

SR.roi = (function () {

  // Demo assumptions — used ONLY where the app has no real baseline/cost data.
  const DEMO = {
    baselineValueFactor: 0.62,        // pre-Circulyze recovered value as a share of current
    baselineRecoveryRateFactor: 0.82, // pre-Circulyze recovery rate as a share of current
    baselineExtraCashHrs: 11.5,       // extra hours baseline cash recovery took
    turnaroundImprovementPct: 31,     // illustrative inventory-turnaround improvement
    writeOffAvoidedShare: 0.35,       // share of the value gap attributed to avoided write-offs
    costFactor: 0.16                  // illustrative Circulyze cost as a share of value generated
  };

  function routeIdForLabel(label) {
    const hit = Object.entries(SR.data.routesMeta).find(([, meta]) => meta.label === label);
    return hit ? hit[0] : null;
  }

  function compute() {
    const m = SR.state.currentMerchant;
    const c = SR.data.company;
    const history = m.returnHistory || [];

    const valueRecovered = m.recoveredValue;
    const recordedReturns = history.length;
    const recoveredCount = history.filter(h => h.valueRecovered > 0).length;
    const recoveryRate = recordedReturns ? (recoveredCount / recordedReturns) * 100 : 0;
    const currentCashHrs = c.totals.avgCashRecoveryHours;
    const unitsDiverted = history.filter(h => h.route !== "Write Off").length;
    const co2Tonnes = m.co2Avoided / 1000;

    const routeTotals = {};
    history.forEach(h => { routeTotals[h.route] = (routeTotals[h.route] || 0) + h.valueRecovered; });

    // ---- demo baseline (before Circulyze) ----
    const baselineValue = valueRecovered * DEMO.baselineValueFactor;
    const additionalValue = valueRecovered - baselineValue;
    const additionalValuePct = baselineValue > 0 ? (additionalValue / baselineValue) * 100 : 0;

    const baselineRecoveryRate = recoveryRate * DEMO.baselineRecoveryRateFactor;
    const recoveryRateDelta = recoveryRate - baselineRecoveryRate;

    const writeOffAvoided = additionalValue * DEMO.writeOffAvoidedShare;

    const baselineCashHrs = currentCashHrs + DEMO.baselineExtraCashHrs;
    const cashImprovementHrs = baselineCashHrs - currentCashHrs;

    const valueGenerated = additionalValue + writeOffAvoided;
    const circulyzeCost = valueGenerated * DEMO.costFactor;
    const roiMultiple = circulyzeCost > 0 ? valueGenerated / circulyzeCost : 0;

    return {
      m, valueRecovered, recoveryRate, unitsDiverted, co2Tonnes, ewasteAvoidedKg: m.ewasteAvoided,
      routeTotals, baselineValue, additionalValue, additionalValuePct,
      baselineRecoveryRate, recoveryRateDelta, writeOffAvoided,
      currentCashHrs, baselineCashHrs, cashImprovementHrs,
      turnaroundPct: -DEMO.turnaroundImprovementPct,
      valueGenerated, roiMultiple
    };
  }

  function pct(n) { return (n >= 0 ? "+" : "") + n.toFixed(1) + "%"; }
  function money(n) { return SR.util.money(n); }

  function kpiCard(label, value, sub, subClass, cardClass) {
    return `<div class="stat-card roi-kpi ${cardClass || ""}">
      <span class="label">${label}</span><b>${value}</b>
      ${sub ? `<span class="roi-sub ${subClass || ""}">${sub}</span>` : ""}
    </div>`;
  }

  function render() {
    const el = document.getElementById("roi-tracking-mount");
    if (!el) return;
    const d = compute();
    const months = SR.data.company.monthlyTrend;
    const maxMonthlyReturns = Math.max(...months.map(mo => mo.returns));
    const maxRouteVal = Math.max(1, ...Object.values(d.routeTotals));

    el.innerHTML = `
      <div class="panel-head">
        <div><h2>Circulyze ROI</h2><p>Your returns. Measured impact.</p></div>
        <span class="badge">Illustrative baseline — demo data</span>
      </div>

      <div class="stat-grid roi-kpi-grid">
        ${kpiCard("Value recovered", "+" + money(d.additionalValue), pct(d.additionalValuePct) + " vs baseline", "good")}
        ${kpiCard("Recovery rate", d.recoveryRate.toFixed(1) + "%", pct(d.recoveryRateDelta) + " vs baseline", "good")}
        ${kpiCard("Write-off value avoided", money(d.writeOffAvoided), "vs baseline")}
        ${kpiCard("Cash recovery time", d.currentCashHrs.toFixed(1) + " hrs", "↓ " + d.cashImprovementHrs.toFixed(1) + " hrs vs baseline", "good")}
        ${kpiCard("Inventory turnaround", d.turnaroundPct + "%", "faster vs baseline", "good")}
        ${kpiCard("Waste avoided", d.unitsDiverted + " units", d.ewasteAvoidedKg + " kg e-waste avoided", "", "eco")}
        ${kpiCard("CO₂ avoided", d.co2Tonnes.toFixed(2) + " t", "estimated", "", "eco")}
        ${kpiCard("Circulyze ROI", d.roiMultiple.toFixed(1) + "×", "demo estimate")}
      </div>

      <div class="card">
        <div class="card-title"><h3>Before vs with Circulyze</h3></div>
        <div class="roi-compare">
          <div class="roi-compare-row roi-compare-head"><span></span><span>Before Circulyze</span><span>With Circulyze</span></div>
          <div class="roi-compare-row"><span>Value recovered</span><span>${money(d.baselineValue)}</span><span class="good">${money(d.valueRecovered)}</span></div>
          <div class="roi-compare-row"><span>Recovery rate</span><span>${d.baselineRecoveryRate.toFixed(1)}%</span><span class="good">${d.recoveryRate.toFixed(1)}%</span></div>
          <div class="roi-compare-row"><span>Write-off value avoided</span><span>${money(0)}</span><span class="good">${money(d.writeOffAvoided)}</span></div>
          <div class="roi-compare-row"><span>Cash recovery time</span><span>${d.baselineCashHrs.toFixed(1)} hrs</span><span class="good">${d.currentCashHrs.toFixed(1)} hrs</span></div>
          <div class="roi-compare-row"><span>CO₂ avoided</span><span>0 t</span><span class="eco-text">${d.co2Tonnes.toFixed(2)} t (est.)</span></div>
        </div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="card-title"><h3>Recovered value over time</h3><span class="badge">Company-wide trend, demo baseline</span></div>
          <div class="bar-chart roi-dual-chart">
            ${months.map(mo => {
              const withH = (mo.returns / maxMonthlyReturns) * 100;
              const beforeH = withH * DEMO.baselineValueFactor;
              return `<div class="roi-dual-bar">
                <div class="roi-dual-bar-track">
                  <div class="bar before" style="height:${beforeH}%"></div>
                  <div class="bar after" style="height:${withH}%"></div>
                </div>
                <span>${mo.month}</span>
              </div>`;
            }).join("")}
          </div>
          <div class="roi-legend"><span class="dot before"></span> Before Circulyze <span class="dot after"></span> With Circulyze</div>
        </div>

        <div class="card">
          <div class="card-title"><h3>Value recovery by route</h3></div>
          <div class="roi-route-list">
            ${Object.entries(SR.data.routesMeta).map(([id, meta]) => {
              const val = d.routeTotals[meta.label] || 0;
              return `<div class="roi-route-row">
                <span class="roi-route-name">${SR.icons[meta.icon]}${meta.label}</span>
                <div class="roi-route-bar"><i style="width:${(val / maxRouteVal) * 100}%"></i></div>
                <span class="roi-route-val">${money(val)}</span>
              </div>`;
            }).join("")}
          </div>
        </div>
      </div>

      <div class="card roi-impact-strip">
        <div class="card-title"><h3>What Circulyze changed</h3></div>
        <div class="roi-impact-grid">
          <div><b>${money(d.additionalValue)}</b><span>additional value recovered</span></div>
          <div><b>${d.cashImprovementHrs.toFixed(1)} hrs</b><span>faster cash recovery</span></div>
          <div class="eco"><b>${d.unitsDiverted}</b><span>units diverted from waste</span></div>
          <div class="eco"><b>${d.co2Tonnes.toFixed(2)} t</b><span>estimated CO₂ avoided</span></div>
        </div>
      </div>

      <button class="btn btn-ghost btn-sm" id="roi-how-btn">${SR.icons.condition} How ROI is calculated</button>
    `;

    document.getElementById("roi-how-btn").addEventListener("click", () => {
      SR.util.modal({
        title: "How Circulyze ROI is calculated",
        body: `Additional value recovered + write-off value avoided + supported cost savings = value generated.
               Value generated ÷ Circulyze cost = ROI.
               Circulyze cost is illustrative demo data here — connect real platform cost to make this figure exact.`,
        confirmText: "Got it"
      });
    });
  }

  return { render, compute };
})();
