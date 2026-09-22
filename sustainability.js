/* ==========================================================================
   Circulyze — Sustainability panel
   ========================================================================== */
window.SR = window.SR || {};

SR.sustainability = (function () {

  function renderPanel(decision) {
    const recycle = decision.allRoutes.find(r => r.id === "recycle");
    const winnerIsRecycle = decision.routeId === "recycle";
    return `
      <div class="card">
        <div class="card-title"><h3>Sustainability impact</h3></div>
        <div class="result-metrics" style="margin-bottom:20px;">
          <div class="metric-card"><span>CO₂ avoided</span><b>${decision.co2Avoided} kg</b></div>
          <div class="metric-card"><span>E-waste avoided</span><b>${decision.ewasteAvoided} kg</b></div>
          <div class="metric-card"><span>Value recovered</span><b>${SR.util.money(decision.estimatedValue)}</b></div>
          <div class="metric-card"><span>Route selected</span><b>${decision.label}</b></div>
        </div>
        <p style="margin-bottom:14px;font-size:.9rem;">What happens if we recycle instead?</p>
        <div class="sustain-compare">
          <div class="sustain-box ${!winnerIsRecycle ? "win" : ""}">
            <b>${decision.label}</b>
            <ul>
              <li>${winnerIsRecycle ? "Material recovery" : "Higher recovered value"}</li>
              <li>${winnerIsRecycle ? "" : "Higher material reuse"}</li>
              <li>Value recovered: ${SR.util.money(decision.estimatedValue)}</li>
              <li>CO₂ avoided: ${decision.co2Avoided} kg</li>
            </ul>
          </div>
          <div class="sustain-box ${winnerIsRecycle ? "win" : ""}">
            <b>Recycle</b>
            <ul>
              <li>Lower recovered value</li>
              <li>Material recovery</li>
              <li>Value recovered: ${SR.util.money(recycle.value)}</li>
              <li>CO₂ avoided: ${recycle.co2Avoided} kg</li>
            </ul>
          </div>
        </div>
      </div>`;
  }

  return { renderPanel };
})();
