/* ==========================================================================
   Circulyze — Merchant Marketplace (company workspace only)
   Renders acquisition listings from data/company.json (acquisitionListings),
   joined with data/merchants.json. Prototype only: offers and chat messages
   live in memory and are not persisted.
   ========================================================================== */
window.SR = window.SR || {};

SR.marketplace = (function () {
  const PRICE_BANDS = [
    { id: "all", label: "Any price" },
    { id: "u5k", label: "Under ₹5,000", max: 5000 },
    { id: "5-15k", label: "₹5,000 – ₹15,000", min: 5000, max: 15000 },
    { id: "15-30k", label: "₹15,000 – ₹30,000", min: 15000, max: 30000 },
    { id: "o30k", label: "Above ₹30,000", min: 30000 }
  ];

  let filters = { category: "all", condition: "all", price: "all", location: "all" };
  const chatThreads = {}; // listingId -> [{from,text}] in-memory only

  function merchantFor(a) {
    return SR.data.merchants.find(m => m.id === a.merchantId) || { name: "Unknown", business: "Unknown merchant", location: a.location };
  }

  function recommendation(a) {
    if (a.expectedMargin <= 0) {
      return { label: "PASS", note: "Estimated profit is flat or negative once repair cost is factored in — not worth acquiring at this asking price." };
    }
    const repairRatio = a.repairCost / a.expectedResalePrice;
    if (repairRatio <= 0.12) {
      return { label: "BUY & RESELL", note: "Condition is strong and repair cost is minimal relative to resale value — resell as-is." };
    }
    return { label: "BUY & REFURBISH", note: "Needs refurbishment before resale, but the expected margin justifies the repair investment." };
  }

  function passesFilters(a) {
    if (filters.category !== "all" && a.category !== filters.category) return false;
    if (filters.condition !== "all" && a.condition !== filters.condition) return false;
    if (filters.location !== "all" && a.location !== filters.location) return false;
    if (filters.price !== "all") {
      const band = PRICE_BANDS.find(b => b.id === filters.price);
      if (band.min != null && a.estPurchasePrice < band.min) return false;
      if (band.max != null && a.estPurchasePrice >= band.max) return false;
    }
    return true;
  }

  function uniq(arr) { return [...new Set(arr)]; }

  /* ---------------- generic modal helper ---------------- */
  function openModal(bodyHTML, extraClass) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal-box modal-box-lg mk-modal ${extraClass || ""}">
        <button class="mk-modal-close" type="button" aria-label="Close">${SR.icons.close}</button>
        ${bodyHTML}
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    overlay.querySelector(".mk-modal-close").addEventListener("click", close);
    return { overlay, close, box: overlay.querySelector(".modal-box") };
  }

  /* ---------------- View Details modal ---------------- */
  function openDetails(a) {
    const m = merchantFor(a);
    const rec = recommendation(a);
    const recClass = rec.label === "PASS" ? "pass" : rec.label === "BUY & RESELL" ? "resell" : "refurbish";
    const { box } = openModal(`
      <h3>${a.product}</h3>
      <p style="color:var(--paper-dim);margin-bottom:18px;">${a.category} · ${a.condition} · ${a.location}</p>
      <div class="mk-detail-grid">
        <div><span>Merchant</span><b>${m.business}</b></div>
        <div><span>Condition</span><b>${a.condition}</b></div>
        <div><span>Asking price</span><b>${SR.util.money(a.estPurchasePrice)}</b></div>
        <div><span>Repair cost</span><b>${SR.util.money(a.repairCost)}</b></div>
        <div><span>Expected resale</span><b>${SR.util.money(a.expectedResalePrice)}</b></div>
        <div><span>Estimated profit</span><b style="color:${a.expectedMargin > 0 ? "var(--moss-bright)" : "var(--brick)"}">${SR.util.money(a.expectedMargin)}</b></div>
      </div>
      <div class="mk-reco mk-reco-${recClass}">
        <span class="mk-reco-label">${rec.label}</span>
        <p>${rec.note}</p>
      </div>
      <div class="modal-actions" style="margin-top:22px;">
        <button class="btn btn-ghost" data-act="close">Close</button>
        <button class="btn btn-primary" data-act="offer">Make Offer</button>
      </div>`);
    box.querySelector('[data-act="close"]').addEventListener("click", () => box.closest(".modal-overlay").remove());
    box.querySelector('[data-act="offer"]').addEventListener("click", () => {
      box.closest(".modal-overlay").remove();
      openOfferModal(a);
    });
  }

  /* ---------------- Make Offer modal ---------------- */
  function openOfferModal(a) {
    const m = merchantFor(a);
    const { box } = openModal(`
      <h3>Make an offer</h3>
      <p style="color:var(--paper-dim);margin-bottom:18px;">${a.product} · ${m.business}</p>
      <div class="field">
        <label for="mk-offer-amount">Offer amount (₹)</label>
        <input type="number" id="mk-offer-amount" min="0" step="100" value="${a.estPurchasePrice}">
      </div>
      <div class="mk-offer-calc">
        <div><span>Expected resale</span><b>${SR.util.money(a.expectedResalePrice)}</b></div>
        <div><span>− Offer amount</span><b id="mk-offer-shown">${SR.util.money(a.estPurchasePrice)}</b></div>
        <div><span>− Repair cost</span><b>${SR.util.money(a.repairCost)}</b></div>
        <div class="mk-offer-total"><span>Estimated profit</span><b id="mk-offer-profit"></b></div>
      </div>
      <div class="modal-actions" style="margin-top:22px;">
        <button class="btn btn-ghost" data-act="cancel">Cancel</button>
        <button class="btn btn-primary" data-act="send">Send Offer</button>
      </div>`, "mk-offer-modal");

    const input = box.querySelector("#mk-offer-amount");
    const shown = box.querySelector("#mk-offer-shown");
    const profitEl = box.querySelector("#mk-offer-profit");
    const recalc = () => {
      const offer = Number(input.value) || 0;
      const profit = a.expectedResalePrice - offer - a.repairCost;
      shown.textContent = SR.util.money(offer);
      profitEl.textContent = SR.util.money(profit);
      profitEl.style.color = profit > 0 ? "var(--moss-bright)" : "var(--brick)";
    };
    input.addEventListener("input", recalc);
    recalc();

    box.querySelector('[data-act="cancel"]').addEventListener("click", () => box.closest(".modal-overlay").remove());
    box.querySelector('[data-act="send"]').addEventListener("click", () => {
      box.closest(".modal-overlay").remove();
      SR.util.toast("Offer sent to merchant.", "success");
    });
  }

  /* ---------------- Contact Merchant modal ---------------- */
  function openContactModal(a) {
    const m = merchantFor(a);
    if (!chatThreads[a.id]) {
      chatThreads[a.id] = [{ from: "merchant", text: `Hi, thanks for your interest in the ${a.product}. Happy to answer any questions.` }];
    }
    const { box } = openModal(`
      <h3>Contact merchant</h3>
      <p style="color:var(--paper-dim);margin-bottom:14px;">${m.business} · ${a.product}</p>
      <div class="mk-chat-thread" id="mk-chat-thread"></div>
      <div class="mk-chat-input-row">
        <input type="text" id="mk-chat-input" placeholder="Write a message…">
        <button class="btn btn-primary btn-sm" id="mk-chat-send">Send</button>
      </div>`, "mk-chat-modal");

    const threadEl = box.querySelector("#mk-chat-thread");
    const renderThread = () => {
      threadEl.innerHTML = chatThreads[a.id].map(msg =>
        `<div class="mk-chat-bubble ${msg.from === "you" ? "you" : "merchant"}">${msg.text}</div>`).join("");
      threadEl.scrollTop = threadEl.scrollHeight;
    };
    renderThread();

    const input = box.querySelector("#mk-chat-input");
    const send = () => {
      const text = input.value.trim();
      if (!text) return;
      chatThreads[a.id].push({ from: "you", text });
      input.value = "";
      renderThread();
    };
    box.querySelector("#mk-chat-send").addEventListener("click", send);
    input.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
  }

  /* ---------------- main render ---------------- */
  function render() {
    const el = document.getElementById("marketplace-mount");
    const listings = SR.data.company.acquisitionListings || [];
    const categories = uniq(listings.map(a => a.category));
    const conditions = uniq(listings.map(a => a.condition));
    const locations = uniq(listings.map(a => a.location));

    const opt = (val, label, current) => `<option value="${val}" ${val === current ? "selected" : ""}>${label}</option>`;

    el.innerHTML = `
      <div class="panel-head"><div><h2>Merchant marketplace</h2><p>Products listed by merchants, available for acquisition</p></div></div>

      <div class="card">
        <div class="card-title"><h3>Filters</h3></div>
        <div class="form-grid mk-filter-grid">
          <div class="field">
            <label>Category</label>
            <select id="mk-f-category">
              ${opt("all", "All categories", filters.category)}
              ${categories.map(c => opt(c, c, filters.category)).join("")}
            </select>
          </div>
          <div class="field">
            <label>Condition</label>
            <select id="mk-f-condition">
              ${opt("all", "All conditions", filters.condition)}
              ${conditions.map(c => opt(c, c, filters.condition)).join("")}
            </select>
          </div>
          <div class="field">
            <label>Price</label>
            <select id="mk-f-price">
              ${PRICE_BANDS.map(b => opt(b.id, b.label, filters.price)).join("")}
            </select>
          </div>
          <div class="field">
            <label>Location</label>
            <select id="mk-f-location">
              ${opt("all", "All locations", filters.location)}
              ${locations.map(c => opt(c, c, filters.location)).join("")}
            </select>
          </div>
        </div>
      </div>

      <div id="mk-grid-mount"></div>
    `;

    ["category", "condition", "price", "location"].forEach(key => {
      document.getElementById("mk-f-" + key).addEventListener("change", e => {
        filters[key] = e.target.value;
        renderGrid();
      });
    });

    function renderGrid() {
      const gridMount = document.getElementById("mk-grid-mount");
      const visible = listings.filter(passesFilters);
      if (!visible.length) {
        gridMount.innerHTML = `<div class="card"><p style="color:var(--paper-dim);text-align:center;margin:0;">No listings match your filters.</p></div>`;
        return;
      }
      gridMount.innerHTML = `<div class="mk-grid">
        ${visible.map(a => {
          const m = merchantFor(a);
          return `
          <div class="product-card">
            <div class="product-card-top">
              <h3>${a.product}</h3>
              <span class="badge">${a.category}</span>
            </div>
            <div class="product-meta">
              <div><span>Merchant</span><b>${m.business}</b></div>
              <div><span>Condition</span><b>${a.condition}</b></div>
              <div><span>Location</span><b>${a.location}</b></div>
            </div>
            <div class="product-figures">
              <div><span>Asking price</span><b>${SR.util.money(a.estPurchasePrice)}</b></div>
              <div><span>Repair cost</span><b>${SR.util.money(a.repairCost)}</b></div>
              <div><span>Expected resale</span><b>${SR.util.money(a.expectedResalePrice)}</b></div>
              <div class="profit"><span>Est. profit</span><b style="color:${a.expectedMargin > 0 ? "var(--moss-bright)" : "var(--brick)"}">${SR.util.money(a.expectedMargin)}</b></div>
            </div>
            <div class="product-actions">
              <button class="btn btn-ghost btn-sm" data-act="view" data-id="${a.id}">View Details</button>
              <button class="btn btn-primary btn-sm" data-act="offer" data-id="${a.id}">Make Offer</button>
              <button class="btn btn-ghost btn-sm" data-act="contact" data-id="${a.id}">Contact Merchant</button>
            </div>
          </div>`;
        }).join("")}
      </div>`;

      gridMount.querySelectorAll("[data-act]").forEach(btn => {
        btn.addEventListener("click", () => {
          const listing = listings.find(x => x.id === btn.dataset.id);
          if (btn.dataset.act === "view") openDetails(listing);
          else if (btn.dataset.act === "offer") openOfferModal(listing);
          else if (btn.dataset.act === "contact") openContactModal(listing);
        });
      });
    }

    renderGrid();
  }

  return { render };
})();
