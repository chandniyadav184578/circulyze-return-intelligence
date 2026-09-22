/* ==========================================================================
   Circulyze — Pricing & Depreciation
   Sample multipliers below are PROTOTYPE VALUES, not universal market facts.
   TO CONNECT A REAL PRICING FEED: replace computePricing()'s internals with
   a call to your pricing/market-data API and keep the same return shape.
   ========================================================================== */
window.SR = window.SR || {};

SR.pricing = (function () {

  function computePricing(form, decision) {
    const original = Number(form.purchasePrice || 0);
    const current = Number(form.marketPrice || 0);
    const afterRefurb = Math.round(current * 0.9 - Number(form.recoveryCost || 0) * 0.15);
    const recommendedResale = decision.routeId === "refurbish"
      ? Math.max(0, afterRefurb - Math.round(afterRefurb * 0.05))
      : decision.estimatedValue;
    const margin = recommendedResale - Number(form.recoveryCost || 0);
    return {
      original,
      current,
      afterRefurb: Math.max(0, afterRefurb),
      recommendedResale: Math.max(0, recommendedResale),
      margin
    };
  }

  function renderPricingCard(form, decision) {
    const p = computePricing(form, decision);
    const fmt = SR.util.money;
    return `
      <div class="card">
        <div class="card-title"><h3>Dynamic pricing</h3><span class="badge">Sample market data</span></div>
        <div class="price-compare">
          <div class="price-box"><span>Original price</span><b>${fmt(p.original)}</b></div>
          <div class="price-box"><span>Estimated current value</span><b>${fmt(p.current)}</b></div>
          <div class="price-box"><span>After refurbishment</span><b>${fmt(p.afterRefurb)}</b></div>
          <div class="price-box"><span>Recommended resale price</span><b>${fmt(p.recommendedResale)}</b></div>
        </div>
        <p style="margin-top:16px;font-size:.88rem;">Expected margin: <b style="color:var(--moss-bright);font-family:var(--font-display)">${fmt(p.margin)}</b></p>
      </div>`;
  }

  function renderDepreciation(form) {
    const curve = SR.data.routesConfig.depreciationCurve;
    const base = Number(form.purchasePrice || form.marketPrice || 0);
    const points = curve.map(c => ({ label: c.label, value: Math.round(base * c.factor) }));

    const id = "dep-" + Math.random().toString(36).slice(2, 8);
    setTimeout(() => initDepreciation(id, points), 0);

    return `
      <div class="card" id="${id}">
        <div class="card-title"><h3>Depreciation timeline</h3><span class="badge">Prototype estimate</span></div>
        <p style="font-size:.85rem;">Sample projection, not a guaranteed market value. Select a point to preview.</p>
        <div class="timeline-track">
          <div class="t-fill" style="width:0%"></div>
          ${points.map((pt, i) => `<div class="t-dot ${i === 0 ? "active" : ""}" data-i="${i}" style="left:${(i / (points.length - 1)) * 100}%"></div>`).join("")}
        </div>
        <div class="timeline-labels">${points.map(pt => `<span>${pt.label}</span>`).join("")}</div>
        <div class="timeline-readout">
          <b class="dep-value">${SR.util.money(points[0].value)}</b>
          <span class="dep-label">Today</span>
        </div>
      </div>`;
  }

  function initDepreciation(containerId, points) {
    const root = document.getElementById(containerId);
    if (!root) return;
    const dots = root.querySelectorAll(".t-dot");
    const fill = root.querySelector(".t-fill");
    const valEl = root.querySelector(".dep-value");
    const labEl = root.querySelector(".dep-label");
    dots.forEach(dot => {
      dot.addEventListener("click", () => {
        dots.forEach(d => d.classList.remove("active"));
        dot.classList.add("active");
        const i = Number(dot.dataset.i);
        fill.style.width = ((i / (dots.length - 1)) * 100) + "%";
        valEl.textContent = SR.util.money(points[i].value);
        labEl.textContent = points[i].label;
      });
    });
  }

  return { computePricing, renderPricingCard, renderDepreciation };
})();
