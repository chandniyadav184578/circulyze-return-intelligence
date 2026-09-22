/* ==========================================================================
   Circulyze — Hero Intelligence features
   Value at Risk / Recovery Simulator / Circulyze Score / Intelligence Hub.
   All figures are derived from real merchant data (data/merchants.json),
   the real Decision Engine (js/decisionEngine.js), or the same demo-labelled
   ROI baseline already used on the ROI Tracking screen (js/roi.js) — nothing
   here introduces a new invented data source.
   ========================================================================== */
window.SR = window.SR || {};

SR.intel = (function () {

  function money(n) { return SR.util.money(n); }

  /* ---------------- 1. VALUE AT RISK ---------------- */
  function renderValueAtRisk() {
    const el = document.getElementById("value-at-risk-mount");
    if (!el) return;
    const m = SR.state.currentMerchant;
    const d = SR.roi.compute();
    const history = m.returnHistory || [];
    const expectedRecovery = history.reduce((s, h) => s + h.valueRecovered, 0);
    const recoveryFraction = d.recoveryRate > 0 ? d.recoveryRate / 100 : 1;
    const valueAtRisk = Math.round(expectedRecovery / recoveryFraction);
    const potentialLoss = Math.max(0, valueAtRisk - expectedRecovery);

    el.innerHTML = `
      <div class="panel-head">
        <div><h2>Value at risk</h2><p>Recoverable value in your current return queue, and how much of it Circulyze is capturing.</p></div>
        <span class="badge">Based on recorded return history</span>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">Value at risk</span><b>${money(valueAtRisk)}</b></div>
        <div class="stat-card"><span class="label">Expected recovery</span><b class="teal-text">${money(expectedRecovery)}</b></div>
        <div class="stat-card"><span class="label">Potential loss</span><b class="warn-text">${money(potentialLoss)}</b></div>
        <div class="stat-card"><span class="label">Recovery rate</span><b>${d.recoveryRate.toFixed(1)}%</b></div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Returns in scope</h3></div>
        ${history.map(h => `
          <div class="hist-item">
            <div><div class="hist-date">${h.date}</div><div class="hist-name">${h.product} → ${h.route}</div></div>
            <div class="hist-value"><b>${money(h.valueRecovered)}</b><span>recovered</span></div>
          </div>`).join("") || "<p>No recorded returns yet.</p>"}
      </div>`;
  }

  /* ---------------- 2. RECOVERY SIMULATOR ---------------- */
  function simulate(productId) {
    const product = SR.data.products.find(p => p.id === productId) || SR.data.products[0];
    const decision = SR.decisionEngine.evaluate(product);
    return { product, decision };
  }

  function renderRecoverySimulator() {
    const el = document.getElementById("recovery-simulator-mount");
    if (!el) return;

    function paint(productId) {
      const { product, decision } = simulate(productId);
      const sorted = decision.allRoutes;
      const winner = sorted[0], runnerUp = sorted[1];
      const gap = winner.value - (runnerUp ? runnerUp.value : 0);
      const writeOff = sorted.find(r => r.id === "writeOff");
      const maxVal = Math.max(1, ...sorted.map(r => r.value));

      document.getElementById("sim-body").innerHTML = `
        <div class="reason-box"><strong>Recommended route:</strong> ${SR.data.routesMeta[winner.id].label}
          ${runnerUp ? ` — +${money(gap)} vs next-best route (${SR.data.routesMeta[runnerUp.id].label})` : ""}</div>
        <div class="alt-routes">
          ${sorted.map(r => `
            <div class="alt-row ${r.id === winner.id ? "picked" : ""}">
              <span class="alt-name">${SR.data.routesMeta[r.id].label}${r.id === winner.id ? " (Recommended)" : ""}</span>
              <div class="alt-bar"><i style="width:${(r.value / maxVal) * 100}%"></i></div>
              <span class="alt-val">${money(r.value)}</span>
            </div>`).join("")}
        </div>
        <div class="stat-grid" style="margin-top:18px;">
          <div class="stat-card"><span class="label">Expected recovery</span><b>${money(winner.value)}</b></div>
          <div class="stat-card"><span class="label">Processing cost</span><b>${money(SR.decisionEngine.ROUTE_PARAMS[winner.id].recoveryCostShare * (product.recoveryCost || 0))}</b></div>
          <div class="stat-card"><span class="label">Turnaround</span><b>${winner.hours} hrs</b></div>
          <div class="stat-card"><span class="label">Waste impact</span><b>${winner.co2Avoided} kg CO₂ avoided</b></div>
        </div>
        <div class="card" style="margin-top:18px;">
          <div class="card-title"><h3>With Circulyze vs without</h3></div>
          <div class="roi-compare-row roi-compare-head"><span></span><span>Without Circulyze</span><span>With Circulyze</span></div>
          <div class="roi-compare-row"><span>Recovered value</span><span>${money(writeOff.value)}</span><span class="good">${money(winner.value)}</span></div>
        </div>`;
    }

    el.innerHTML = `
      <div class="panel-head"><div><h2>Recovery simulator</h2><p>Compare how each disposition route performs for a given returned product, using the same decision engine that scores live returns.</p></div></div>
      <div class="card">
        <div class="field" style="max-width:360px;">
          <label>Choose a product</label>
          <select id="sim-product">
            ${SR.data.products.map(p => `<option value="${p.id}">${p.name} — ${p.condition}</option>`).join("")}
          </select>
        </div>
        <div id="sim-body"></div>
      </div>`;

    document.getElementById("sim-product").addEventListener("change", e => paint(e.target.value));
    paint(SR.data.products[0].id);
  }

  /* ---------------- 3. CIRCULYZE SCORE ---------------- */
  function computeScore() {
    const m = SR.state.currentMerchant;
    const d = SR.roi.compute();
    const history = m.returnHistory || [];
    const riskMap = { LOW: 90, MEDIUM: 65, HIGH: 35 };

    const valueRecovery = Math.round(d.recoveryRate);
    const operationalEfficiency = riskMap[m.riskLevel] ?? 65;
    const nonWriteOff = history.length ? history.filter(h => h.route !== "Write Off").length / history.length * 100 : 100;
    const circularity = Math.round(nonWriteOff);
    const environmentalImpact = m.sustainabilityScore;

    const overall = Math.round((valueRecovery + operationalEfficiency + circularity + environmentalImpact) / 4);
    return { overall, valueRecovery, operationalEfficiency, circularity, environmentalImpact };
  }

  function renderScore() {
    const el = document.getElementById("circulyze-score-mount");
    if (!el) return;
    const s = computeScore();
    const circumference = 2 * Math.PI * 52;
    const offset = circumference * (1 - s.overall / 100);

    el.innerHTML = `
      <div class="panel-head"><div><h2>Circulyze score</h2><p>A single view of your circularity and recovery performance.</p></div></div>
      <div class="card" style="display:flex;align-items:center;gap:32px;flex-wrap:wrap;">
        <div class="confidence-ring" style="width:120px;height:120px;">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" stroke="var(--line-strong)" stroke-width="8" fill="none"/>
            <circle cx="60" cy="60" r="52" stroke="var(--moss-bright)" stroke-width="8" fill="none"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
          </svg>
          <div class="cr-val" style="font-size:1.4rem;">${s.overall}</div>
        </div>
        <div>
          <b style="font-family:var(--font-display);font-size:1.1rem;">${s.overall} / 100</b>
          <p style="margin-top:6px;max-width:44ch;">Simple average of four demo dimensions below — a product metric for this prototype, not a scientifically validated score.</p>
        </div>
      </div>
      <div class="score-quad">
        <div class="score-box"><span>Value recovery</span><div class="score-bar value"><i style="width:${s.valueRecovery}%"></i></div><b>${s.valueRecovery}%</b></div>
        <div class="score-box"><span>Operational efficiency</span><div class="score-bar sustain"><i style="width:${s.operationalEfficiency}%"></i></div><b>${s.operationalEfficiency}%</b></div>
        <div class="score-box"><span>Circularity</span><div class="score-bar value"><i style="width:${s.circularity}%"></i></div><b>${s.circularity}%</b></div>
        <div class="score-box"><span>Environmental impact</span><div class="score-bar sustain"><i style="width:${s.environmentalImpact}%"></i></div><b>${s.environmentalImpact}%</b></div>
      </div>
      <p style="font-size:.8rem;">Methodology: value recovery = recorded recovery rate. Operational efficiency = mapped from merchant risk level. Circularity = share of recorded returns routed away from write-off. Environmental impact = merchant sustainability score. Overall = simple average, equally weighted.</p>`;
  }

  /* ---------------- 4. INTELLIGENCE HUB ---------------- */
  function renderHub() {
    const el = document.getElementById("intelligence-hub-mount");
    if (!el) return;
    const m = SR.state.currentMerchant;
    const d = SR.roi.compute();
    const history = m.returnHistory || [];
    const expectedRecovery = history.reduce((s, h) => s + h.valueRecovered, 0);
    const recoveryFraction = d.recoveryRate > 0 ? d.recoveryRate / 100 : 1;
    const potentialLoss = Math.max(0, Math.round(expectedRecovery / recoveryFraction) - expectedRecovery);

    const routeTotalsEntries = Object.entries(d.routeTotals).sort((a, b) => b[1] - a[1]);
    const topRoute = routeTotalsEntries[0];

    const insights = [
      { label: "Value opportunity", text: `${money(potentialLoss)} in potential recovery identified from returns not yet fully routed.` },
      topRoute ? { label: "Route insight", text: `${topRoute[0]} is your top-performing route, recovering ${money(topRoute[1])} across recorded returns.` } : null,
      { label: "Operations", text: `Average cash recovery time is ${d.currentCashHrs.toFixed(1)} hrs, ${d.cashImprovementHrs.toFixed(1)} hrs faster than the illustrative baseline.` },
      { label: "Environment", text: `${m.co2Avoided} kg CO₂ and ${m.ewasteAvoided} kg e-waste avoided to date.` }
    ].filter(Boolean);

    el.innerHTML = `
      <div class="panel-head">
        <div><h2>Intelligence hub</h2><p>Pattern-based insights generated from your recorded return data — not an AI assistant.</p></div>
        <span class="badge">Rule-based, not predictive AI</span>
      </div>
      <div class="insight-grid">
        ${insights.map(i => `
          <div class="card">
            <div class="card-title"><h3>${i.label}</h3></div>
            <p>${i.text}</p>
          </div>`).join("")}
      </div>`;
  }

  return { renderValueAtRisk, renderRecoverySimulator, renderScore, renderHub };
})();
