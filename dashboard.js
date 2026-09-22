/* ==========================================================================
   Circulyze — Dashboard rendering (merchant + company)
   ========================================================================== */
window.SR = window.SR || {};

SR.dashboard = (function () {

  const uploadKinds = ["Front", "Back", "Serial / label", "Damage", "Accessories"];
  let uploadedImages = {};

  /* ---------------- MERCHANT DASHBOARD ---------------- */
  function renderMerchantDashboard() {
    const m = SR.state.currentMerchant;
    const el = document.getElementById("merchant-dashboard-mount");
    el.innerHTML = `
      <div class="panel-head">
        <div><h2>Welcome back, ${m.name.split(" ")[0]}</h2><p>${m.business} · ${m.location}</p></div>
        <button class="btn btn-primary" id="btn-assess-cta">${SR.icons.clipboard} Assess a return</button>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">Returns processed</span><b>${m.returns}</b></div>
        <div class="stat-card"><span class="label">Value recovered</span><b>${SR.util.money(m.recoveredValue)}</b></div>
        <div class="stat-card"><span class="label">Avg recovery time</span><b>6.1 hrs</b></div>
        <div class="stat-card"><span class="label">CO₂ avoided</span><b>${m.co2Avoided} kg</b></div>
        <div class="stat-card"><span class="label">E-waste avoided</span><b>${m.ewasteAvoided} kg</b></div>
        <div class="stat-card risk-${m.riskLevel.toLowerCase()}"><span class="label">Risk level</span><b>${m.riskLevel}</b></div>
      </div>
      <div class="card">
        <div class="card-title"><h3>What would you like to do with this returned product?</h3></div>
        <p style="margin-bottom:16px;">Choose the outcome you have in mind — Circulyze's decision engine will still assess the product and confirm the route that protects the most value and the planet.</p>
        <div class="action-grid">
          ${["resell","refurbish","exchange","donate","recycle","writeOff"].map(id => {
            const meta = SR.data.routesMeta[id];
            return `<button class="action-tile" data-intent="${id}">${SR.icons[meta.icon]}<b>${meta.label}</b><span>${meta.valueImpact}</span></button>`;
          }).join("")}
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Recent returns</h3><button class="btn btn-ghost btn-sm" id="btn-view-history">View full history</button></div>
        ${m.returnHistory.slice(0, 3).map(h => `
          <div class="hist-item">
            <div><div class="hist-date">${h.date}</div><div class="hist-name">${h.product} → ${h.route}</div></div>
            <div class="hist-value"><b>${SR.util.money(h.valueRecovered)}</b><span>${h.co2Avoided} kg CO₂ avoided</span></div>
          </div>`).join("")}
      </div>`;

    el.querySelectorAll("[data-intent], #btn-assess-cta").forEach(btn => {
      btn.addEventListener("click", () => SR.app.showScreen("assess", { intent: btn.dataset.intent || null }));
    });
    document.getElementById("btn-view-history").addEventListener("click", () => SR.app.showScreen("merchant-history"));
  }

  /* ---------------- ASSESSMENT FORM ---------------- */
  function renderAssessForm(params) {
    uploadedImages = {};
    const el = document.getElementById("assess-mount");
    el.innerHTML = `
      <div class="breadcrumb"><button id="back-to-dash">Merchant dashboard</button> / Assess a return</div>
      <div class="panel-head"><div><h2>Return assessment</h2><p>Tell us about the returned product — the decision engine will assess it and recommend the best next route.</p></div></div>
      <form class="card" id="assess-form">
        <div class="form-grid">
          <div class="field"><label>Product name</label><input required name="name" placeholder="e.g. Aria Ultrabook 14"></div>
          <div class="field"><label>Category</label>
            <select name="category">
              <option>Laptop</option><option>Smartphone</option><option>Tablet</option><option>Smartwatch</option><option>Headphones</option>
            </select>
          </div>
          <div class="field"><label>Brand</label><input name="brand" placeholder="Brand"></div>
          <div class="field"><label>Model</label><input name="model" placeholder="Model"></div>
          <div class="field"><label>Purchase price (₹)</label><input required type="number" name="purchasePrice" placeholder="62000"></div>
          <div class="field"><label>Current estimated market price (₹)</label><input required type="number" name="marketPrice" placeholder="41000"></div>
          <div class="field"><label>Product age (months)</label><input type="number" name="age" placeholder="8"></div>
          <div class="field"><label>Location</label><input name="location" placeholder="City"></div>
          <div class="field"><label>Season</label>
            <select name="season"><option>Regular</option><option>Festive</option><option>Clearance</option></select>
          </div>
          <div class="field"><label>Estimated recovery cost (₹)</label><input required type="number" name="recoveryCost" placeholder="900"></div>
          <div class="field"><label>Warranty status</label>
            <select name="warranty"><option>Active</option><option>Expired</option></select>
          </div>
          <div class="field"><label>Reason for return</label><input name="reason" placeholder="e.g. changed mind, defect"></div>
          <div class="field full"><label>Condition</label>
            <div class="chip-select" id="condition-chips">
              ${["Like New","Good","Fair","Damaged","Non-functional"].map((c,i) => `<button type="button" class="chip-opt ${i===0?"selected":""}" data-val="${c}">${c}</button>`).join("")}
            </div>
            <input type="hidden" name="condition" value="Like New">
          </div>
          <div class="field-row full">
            <div class="field"><label>Accessories included</label><input name="accessories" placeholder="e.g. charger, box"></div>
            <div class="field"><label>Previous repair history</label><input name="repairHistory" placeholder="None"></div>
          </div>
          <div class="field full">
            <label>Original packaging available</label>
            <div class="chip-select">
              <button type="button" class="chip-opt selected" data-pack="yes">Yes</button>
              <button type="button" class="chip-opt" data-pack="no">No</button>
            </div>
            <input type="hidden" name="packaging" value="yes">
          </div>
          <div class="field full">
            <label>Upload product photos</label>
            <div class="upload-row" id="upload-row">
              ${uploadKinds.map(k => `
                <label class="upload-slot" data-kind="${k}">
                  ${SR.icons.camera}<span>${k}</span>
                  <input type="file" accept="image/*" style="display:none" data-kind="${k}">
                </label>`).join("")}
            </div>
          </div>
        </div>
        <div style="margin-top:24px;display:flex;justify-content:flex-end;">
          <button type="submit" class="btn btn-primary">Run decision engine</button>
        </div>
      </form>`;

    document.getElementById("back-to-dash").addEventListener("click", () => SR.app.showScreen("merchant-dashboard"));

    el.querySelectorAll("#condition-chips .chip-opt").forEach(chip => {
      chip.addEventListener("click", () => {
        el.querySelectorAll("#condition-chips .chip-opt").forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
        el.querySelector('input[name="condition"]').value = chip.dataset.val;
      });
    });
    el.querySelectorAll('[data-pack]').forEach(chip => {
      chip.addEventListener("click", () => {
        el.querySelectorAll('[data-pack]').forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
        el.querySelector('input[name="packaging"]').value = chip.dataset.pack;
      });
    });
    el.querySelectorAll('#upload-row input[type=file]').forEach(input => {
      input.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          uploadedImages[input.dataset.kind] = reader.result;
          const slot = input.closest(".upload-slot");
          slot.classList.add("filled");
          slot.querySelector("span").textContent = input.dataset.kind;
          let img = slot.querySelector("img");
          if (!img) { img = document.createElement("img"); slot.prepend(img); }
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    });

    document.getElementById("assess-form").addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const form = Object.fromEntries(fd.entries());
      form.images = uploadedImages;
      SR.app.showScreen("processing", { form });
    });
  }

  /* ---------------- PROCESSING ANIMATION ---------------- */
  function renderProcessing(params) {
    const el = document.getElementById("processing-mount");
    const steps = ["Analysing condition...", "Estimating recovery value...", "Comparing available routes...", "Calculating sustainability impact...", "Checking risk signals..."];
    el.innerHTML = `
      <div class="processing">
        <div class="spin"></div>
        <div class="step-line" id="proc-step">${steps[0]}</div>
        <p style="margin-top:6px;font-size:.78rem;">AI-assisted prototype recommendation</p>
      </div>`;
    let i = 0;
    const stepEl = document.getElementById("proc-step");
    const iv = setInterval(() => {
      i++;
      if (i < steps.length) { stepEl.style.opacity = 0; setTimeout(() => { stepEl.textContent = steps[i]; stepEl.style.opacity = 1; }, 150); }
    }, 480);
    setTimeout(() => {
      clearInterval(iv);
      const decision = SR.decisionEngine.evaluate(params.form);
      SR.app.showScreen("result", { form: params.form, decision });
    }, 2600);
  }

  /* ---------------- DECISION RESULT ---------------- */
  function renderResult(params) {
    const { form, decision } = params;
    const el = document.getElementById("result-mount");
    const meta = SR.data.routesMeta[decision.routeId];
    const circumference = 2 * Math.PI * 42;
    const offset = circumference * (1 - decision.confidence / 100);

    el.innerHTML = `
      <div class="breadcrumb"><button id="back-to-dash2">Merchant dashboard</button> / Decision result</div>
      <div class="result-hero">
        <div>
          <span class="rlabel">RECOMMENDED NEXT DESTINATION</span>
          <h2>${meta.label.toUpperCase()}${decision.routeId === "refurbish" ? " & RESELL" : ""}</h2>
          <p style="margin-top:8px;max-width:48ch;">${meta.summary}</p>
        </div>
        <div class="confidence-ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="var(--line-strong)" stroke-width="7" fill="none"/>
            <circle cx="50" cy="50" r="42" stroke="var(--moss-bright)" stroke-width="7" fill="none"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
          </svg>
          <div class="cr-val">${decision.confidence}%</div>
        </div>
      </div>
      <div class="result-metrics">
        <div class="metric-card"><span>Estimated recovered value</span><b>${SR.util.money(decision.estimatedValue)}</b></div>
        <div class="metric-card"><span>Estimated recovery cost</span><b>${SR.util.money(decision.recoveryCost)}</b></div>
        <div class="metric-card"><span>Expected time to cash</span><b>${decision.hours} hrs</b></div>
        <div class="metric-card"><span>CO₂ avoided</span><b>${decision.co2Avoided} kg</b></div>
      </div>
      <div class="reason-box"><strong>Why this route:</strong> ${decision.reason}</div>
      <div class="score-pair">
        <div class="score-box"><span>Value score</span><div class="score-bar value"><i style="width:${decision.valueScorePct}%"></i></div><b>${decision.valueScorePct}%</b></div>
        <div class="score-box"><span>Sustainability score</span><div class="score-bar sustain"><i style="width:${decision.sustainScorePct}%"></i></div><b>${decision.sustainScorePct}%</b></div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Alternative routes</h3></div>
        <div class="alt-routes">
          ${decision.allRoutes.map(r => `
            <div class="alt-row ${r.id === decision.routeId ? "picked" : ""}">
              <span class="alt-name">${SR.data.routesMeta[r.id].label}${r.id === decision.routeId ? " (Recommended)" : ""}</span>
              <div class="alt-bar"><i style="width:${r.valueScorePct}%"></i></div>
              <span class="alt-val">${SR.util.money(r.value)}</span>
            </div>`).join("")}
        </div>
      </div>
      <div class="two-col">
        <div>${SR.pricing.renderPricingCard(form, decision)}${SR.pricing.renderDepreciation(form)}</div>
        <div>${SR.sustainability.renderPanel(decision)}${SR.fraud.renderPhotoMatch((form.name||"") + form.condition)}</div>
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px;">
        <button class="btn btn-ghost" id="btn-new-assess">Assess another return</button>
        <button class="btn btn-primary" id="btn-confirm-route">Confirm route</button>
      </div>`;

    document.getElementById("back-to-dash2").addEventListener("click", () => SR.app.showScreen("merchant-dashboard"));
    document.getElementById("btn-new-assess").addEventListener("click", () => SR.app.showScreen("assess"));
    document.getElementById("btn-confirm-route").addEventListener("click", () => {
      SR.util.toast(`${meta.label} confirmed for ${form.name || "this product"}.`, "success");
      SR.app.showScreen("merchant-dashboard");
    });
  }

  /* ---------------- MERCHANT HISTORY ---------------- */
  function renderMerchantHistory() {
    const m = SR.state.currentMerchant;
    const el = document.getElementById("merchant-history-mount");
    el.innerHTML = `
      <div class="breadcrumb"><button id="back-hist">Merchant dashboard</button> / History</div>
      <div class="panel-head"><h2>Return history</h2></div>
      <div class="card">
        ${m.returnHistory.map(h => `
          <div class="hist-item">
            <div><div class="hist-date">${h.date}</div><div class="hist-name">${h.product} → ${h.route}</div></div>
            <div class="hist-value"><b>${SR.util.money(h.valueRecovered)}</b><span>${h.co2Avoided} kg CO₂ avoided</span></div>
          </div>`).join("")}
      </div>`;
    document.getElementById("back-hist").addEventListener("click", () => SR.app.showScreen("merchant-dashboard"));
  }

  /* ---------------- COMPANY DASHBOARD (overview) ---------------- */
  function renderCompanyDashboard() {
    const c = SR.data.company;
    const el = document.getElementById("company-dashboard-mount");

    el.innerHTML = `
      <div class="panel-head"><div><h2>Company dashboard</h2><p>${c.name} · Fleet-wide view across all merchants</p></div></div>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">Total returns</span><b>${c.totals.totalReturns}</b></div>
        <div class="stat-card"><span class="label">Active merchants</span><b>${c.totals.activeMerchants}</b></div>
        <div class="stat-card"><span class="label">Value recovered</span><b>${SR.util.money(c.totals.valueRecovered)}</b></div>
        <div class="stat-card"><span class="label">CO₂ avoided</span><b>${c.totals.co2Avoided} kg</b></div>
        <div class="stat-card"><span class="label">E-waste avoided</span><b>${c.totals.ewasteAvoided} kg</b></div>
        <div class="stat-card"><span class="label">Avg decision time</span><b>${c.totals.avgDecisionTimeSeconds}s</b></div>
        <div class="stat-card"><span class="label">Avg cash recovery</span><b>${c.totals.avgCashRecoveryHours} hrs</b></div>
        <div class="stat-card"><span class="label">Products processed</span><b>${c.totals.productsProcessed}</b></div>
      </div>
    `;
  }

  /* ---------------- COMPANY MERCHANTS ---------------- */
  function renderCompanyMerchants() {
    const merchants = SR.data.merchants;
    const el = document.getElementById("company-merchants-mount");

    el.innerHTML = `
      <div class="panel-head"><div><h2>Merchants</h2><p>All onboarded merchants and their return activity</p></div></div>
      <div class="card">
        <div class="card-title"><h3>Merchant management</h3></div>
        <table class="data-table">
          <thead><tr><th>Merchant</th><th>Returns</th><th>Value recovered</th><th>CO₂ impact</th><th>Risk</th><th>Last activity</th></tr></thead>
          <tbody>
            ${merchants.map(m => `
              <tr class="clickable" data-mid="${m.id}">
                <td><div style="display:flex;align-items:center;gap:10px;">
                  <span class="table-avatar">${SR.avatar.img("merchant", m.id)}</span>
                  <div>${m.name}<div style="color:var(--paper-dim);font-size:.78rem">${m.business}</div></div>
                </div></td>
                <td>${m.returns}</td>
                <td>${SR.util.money(m.recoveredValue)}</td>
                <td>${m.co2Avoided} kg</td>
                <td>${SR.fraud.riskBadge(m.riskLevel)}</td>
                <td>${m.returnHistory[0] ? m.returnHistory[0].date : "—"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;

    el.querySelectorAll("tr[data-mid]").forEach(row => {
      row.addEventListener("click", () => SR.app.showScreen("company-merchant-detail", { merchantId: row.dataset.mid }));
    });
  }

  /* ---------------- COMPANY ACQUISITION ---------------- */
  function renderCompanyAcquisition() {
    const c = SR.data.company;
    const el = document.getElementById("company-acquisition-mount");

    el.innerHTML = `
      <div class="panel-head"><div><h2>Acquisition</h2><p>Merchant products under consideration for company purchase</p></div></div>
      <div class="card">
        <div class="card-title"><h3>Want to buy / acquisition</h3></div>
        <table class="data-table">
          <thead><tr><th>Product</th><th>Condition</th><th>Purchase price</th><th>Repair cost</th><th>Resale price</th><th>Margin</th><th>Action</th></tr></thead>
          <tbody>
            ${c.acquisitionListings.map(a => `
              <tr><td>${a.product}</td><td>${a.condition}</td><td>${SR.util.money(a.estPurchasePrice)}</td>
              <td>${SR.util.money(a.repairCost)}</td><td>${SR.util.money(a.expectedResalePrice)}</td>
              <td style="color:var(--moss-bright)">${SR.util.money(a.expectedMargin)}</td><td>${a.recommendedAction}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ---------------- COMPANY ANALYTICS ---------------- */
  function renderCompanyAnalytics() {
    const c = SR.data.company;
    const el = document.getElementById("company-analytics-mount");
    const maxChannel = Math.max(...Object.values(c.channelRouting));

    el.innerHTML = `
      <div class="panel-head"><div><h2>Analytics</h2><p>How returns route across disposition channels</p></div></div>
      <div class="card">
        <div class="card-title"><h3>Channel routing</h3></div>
        <div class="bar-chart" style="margin-bottom:30px;">
          ${Object.entries(c.channelRouting).map(([id, v]) => `
            <div class="bar" style="height:${(v/maxChannel)*100}%"><span>${SR.data.routesMeta[id].label}</span></div>`).join("")}
        </div>
      </div>
    `;
  }

  /* ---------------- COMPANY IMPACT ---------------- */
  function renderCompanyImpact() {
    const merchants = SR.data.merchants;
    const el = document.getElementById("company-impact-mount");

    el.innerHTML = `
      <div class="panel-head"><div><h2>Impact</h2><p>Sustainability contribution by merchant</p></div></div>
      <div class="card">
        <div class="card-title"><h3>Merchant impact</h3></div>
        <table class="data-table">
          <thead><tr><th>Merchant</th><th>Sustainability score</th><th>CO₂ avoided</th><th>E-waste avoided</th><th>Return behaviour</th></tr></thead>
          <tbody>
            ${merchants.map(m => `
              <tr><td>${m.name}</td><td>${m.sustainabilityScore}/100</td><td>${m.co2Avoided} kg</td>
              <td>${m.ewasteAvoided} kg</td><td>${m.riskSignals.returnFrequency}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ---------------- COMPANY RISK / FRAUD ---------------- */
  function renderCompanyRisk() {
    const merchants = SR.data.merchants;
    const el = document.getElementById("company-risk-mount");

    el.innerHTML = `
      <div class="panel-head"><div><h2>Risk &amp; fraud</h2><p>Risk signals across the merchant base</p></div></div>
      ${SR.fraud.companyFraudOverview(merchants)}
    `;
  }

  /* ---------------- COMPANY MERCHANT DETAIL ---------------- */
  function renderCompanyMerchantDetail(params) {
    const m = SR.data.merchants.find(x => x.id === params.merchantId);
    const el = document.getElementById("company-merchant-detail-mount");
    const routeCounts = {};
    m.returnHistory.forEach(h => routeCounts[h.route] = (routeCounts[h.route] || 0) + 1);
    const maxRoute = Math.max(1, ...Object.values(routeCounts));
    const maxVal = Math.max(1, ...m.returnHistory.map(h => h.valueRecovered));

    el.innerHTML = `
      <div class="breadcrumb"><button id="back-company">Merchants</button> / ${m.name}</div>
      <div class="profile-head">
        <div class="avatar-lg">${SR.avatar.img("merchant", m.id)}</div>
        <div><div class="profile-name">${m.name}</div><div class="profile-sub">${m.business} · ${m.location} · Joined ${m.joined}</div></div>
        <div style="margin-left:auto">${SR.fraud.riskBadge(m.riskLevel)}</div>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">Returns</span><b>${m.returns}</b></div>
        <div class="stat-card"><span class="label">Value recovered</span><b>${SR.util.money(m.recoveredValue)}</b></div>
        <div class="stat-card"><span class="label">CO₂ avoided</span><b>${m.co2Avoided} kg</b></div>
        <div class="stat-card"><span class="label">Sustainability score</span><b>${m.sustainabilityScore}/100</b></div>
      </div>
      <div class="two-col">
        <div class="card">
          <div class="card-title"><h3>Route distribution</h3></div>
          <div class="bar-chart">${Object.entries(routeCounts).map(([r,v]) => `<div class="bar" style="height:${(v/maxRoute)*100}%"><span>${r}</span></div>`).join("")}</div>
        </div>
        <div class="card">
          <div class="card-title"><h3>Recovered value per return</h3></div>
          <div class="bar-chart">${m.returnHistory.map(h => `<div class="bar" style="height:${(h.valueRecovered/maxVal)*100 || 4}%"><span>${h.date.slice(5)}</span></div>`).join("")}</div>
        </div>
      </div>
      ${SR.fraud.renderMerchantRisk(m)}
      <div class="card">
        <div class="card-title"><h3>Return / repair / resale history</h3></div>
        ${m.returnHistory.map(h => `
          <div class="hist-item"><div><div class="hist-date">${h.date}</div><div class="hist-name">${h.product} → ${h.route}</div></div>
          <div class="hist-value"><b>${SR.util.money(h.valueRecovered)}</b><span>${h.co2Avoided} kg CO₂ avoided</span></div></div>`).join("")}
      </div>`;

    document.getElementById("back-company").addEventListener("click", () => SR.app.showScreen("company-merchants"));
  }

  return {
    renderMerchantDashboard, renderAssessForm, renderProcessing, renderResult,
    renderMerchantHistory, renderCompanyDashboard, renderCompanyMerchants,
    renderCompanyAcquisition, renderCompanyAnalytics, renderCompanyImpact,
    renderCompanyRisk, renderCompanyMerchantDetail
  };
})();
