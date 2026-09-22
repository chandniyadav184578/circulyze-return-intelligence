/* ==========================================================================
   Circulyze — Fraud/abuse signals & photo matching (prototype)
   These are PROTOTYPE RISK SIGNALS, not a definitive fraud determination.
   TO CONNECT REAL SIGNALS: swap simulatePhotoMatch()/riskBadge() internals
   for calls to your CV/risk-scoring service; keep the return shapes intact.
   ========================================================================== */
window.SR = window.SR || {};

SR.fraud = (function () {

  function riskBadge(level) {
    const cls = String(level).toLowerCase();
    return `<span class="risk-badge ${cls}">${SR.icons.risk}${level}</span>`;
  }

  function renderMerchantRisk(merchant) {
    const s = merchant.riskSignals;
    return `
      <div class="card">
        <div class="card-title"><h3>Risk signals</h3>${riskBadge(merchant.riskLevel)}</div>
        <div class="signal-list">
          <div class="signal-row"><span>Return frequency</span><b>${s.returnFrequency}</b></div>
          <div class="signal-row"><span>Photo match</span><b>${s.photoMatch}</b></div>
          <div class="signal-row"><span>Product history</span><b>${s.productHistory}</b></div>
        </div>
        <p class="disclaimer-note">Prototype risk signal — this reflects return-pattern heuristics, not a confirmed fraud finding. Company reviewers should verify before acting on it.</p>
      </div>`;
  }

  // Deterministic pseudo-match so the same product+condition always previews the same score in this prototype.
  function simulatePhotoMatch(seedStr) {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
    const pct = 78 + (h % 22); // 78–99%
    return { pct, status: pct >= 90 ? "Verified" : pct >= 75 ? "Needs review" : "Mismatch flagged" };
  }

  function renderPhotoMatch(seedStr) {
    const m = simulatePhotoMatch(seedStr || "sample");
    const color = m.pct >= 90 ? "var(--moss-bright)" : m.pct >= 75 ? "var(--brass)" : "var(--brick)";
    return `
      <div class="card">
        <div class="card-title"><h3>Photo verification</h3></div>
        <div class="match-flow">
          <div class="match-slot">${SR.icons.photo} Uploaded photo</div>
          <span>&rarr;</span>
          <div class="match-slot">${SR.icons.photo} Reference image</div>
          <span>&rarr;</span>
          <div class="match-result"><b style="color:${color}">${m.pct}%</b><span>${m.status}</span></div>
        </div>
        <p class="disclaimer-note">Simulated for this prototype — ready to be wired to a computer-vision matching API.</p>
      </div>`;
  }

  function companyFraudOverview(merchants) {
    return `
      <div class="card">
        <div class="card-title"><h3>Fraud & abuse signals</h3></div>
        <table class="data-table">
          <thead><tr><th>Merchant</th><th>Risk</th><th>Return frequency</th><th>Photo match</th><th>Product history</th></tr></thead>
          <tbody>
            ${merchants.map(m => `
              <tr>
                <td>${m.name}<div style="color:var(--paper-dim);font-size:.78rem">${m.business}</div></td>
                <td>${riskBadge(m.riskLevel)}</td>
                <td>${m.riskSignals.returnFrequency}</td>
                <td>${m.riskSignals.photoMatch}</td>
                <td>${m.riskSignals.productHistory}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <p class="disclaimer-note">These are prototype risk signals derived from return-pattern heuristics — treat as a starting point for review, not proof of fraud.</p>
      </div>`;
  }

  return { riskBadge, renderMerchantRisk, simulatePhotoMatch, renderPhotoMatch, companyFraudOverview };
})();
