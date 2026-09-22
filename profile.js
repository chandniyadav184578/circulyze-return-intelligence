/* ==========================================================================
   Circulyze — Merchant profile, settings, warranty, parts & accessories
   ========================================================================== */
window.SR = window.SR || {};

/* ---------------- PROFILE VERIFICATION ----------------
   Self-contained module: state, persistence (localStorage — matches this
   prototype's existing persistence approach used for theme), and rendering.
   Exposes SR.verify.badge()/isVerified() so app.js's navbar can show the
   same trust signal without duplicating status logic. */
SR.verify = (function () {
  const STORE_PREFIX = "sr-verify-";
  const CATEGORIES = [
    { id: "business", label: "Business proof", desc: "GST certificate, shop registration or business license" },
    { id: "accreditation", label: "Achievement / accreditation", desc: "Certification, award or accreditation document" },
    { id: "supporting", label: "Supporting documents", desc: "Any other document that supports your profile" }
  ];
  const ACCEPTED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
  const MAX_FILE_MB = 8;
  const MAX_FILES = 3;

  const STATUS_LABEL = {
    unverified: "Not Verified",
    under_review: "Under Review",
    verified: "Verified",
    rejected: "Verification Needs Attention"
  };

  function key(merchantId) { return STORE_PREFIX + merchantId; }

  function getRecord(merchantId) {
    try {
      const raw = localStorage.getItem(key(merchantId));
      if (!raw) return { status: "unverified" };
      return JSON.parse(raw);
    } catch (e) { return { status: "unverified" }; }
  }

  function saveRecord(merchantId, record) {
    localStorage.setItem(key(merchantId), JSON.stringify(record));
  }

  function isVerified(merchantId) {
    return getRecord(merchantId).status === "verified";
  }

  /* Small subtle badge used on the profile header, profile menu and navbar trigger */
  function badge(extraClass) {
    return `<span class="verify-badge ${extraClass || ""}">${SR.icons.check}Verified</span>`;
  }

  function fmtSize(bytes) {
    if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function validFile(file) {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) return "Unsupported file type: " + file.name;
    if (file.size > MAX_FILE_MB * 1024 * 1024) return file.name + " is larger than " + MAX_FILE_MB + "MB";
    return null;
  }

  /* Draft state for the in-progress form (category + files), kept in memory
     only until submitted — mirrors the pattern already used for assess-form
     photo uploads in dashboard.js. */
  let draft = { category: null, files: [] };

  function renderCard(merchantId) {
    const mount = document.getElementById("verify-mount");
    if (!mount) return;
    const rec = getRecord(merchantId);

    if (rec.status === "verified") {
      mount.innerHTML = `
        <div class="card">
          <div class="card-title">
            <h3>${SR.icons.warranty.replace("<svg ", '<svg class="verify-card-icon" ')} Verified Profile</h3>
          </div>
          <p class="profile-sub" style="margin-bottom:12px">Your profile has been successfully verified.</p>
          <span class="verify-status-pill verified">${SR.icons.check} Verified</span>
        </div>`;
      return;
    }

    if (rec.status === "under_review") {
      mount.innerHTML = `
        <div class="card">
          <div class="card-title"><h3>Profile Verification</h3></div>
          <div class="verify-status-row"><span class="verify-status-pill review">Under Review</span></div>
          <p class="profile-sub">We're reviewing the evidence you submitted${rec.submittedAt ? " on " + rec.submittedAt : ""}. This card will update automatically once a decision is made.</p>
        </div>`;
      return;
    }

    // unverified or rejected → show the start/resubmit form
    const isRejected = rec.status === "rejected";
    draft = { category: (isRejected && rec.evidence && rec.evidence.category) || null, files: [] };

    mount.innerHTML = `
      <div class="card">
        <div class="card-title"><h3>Profile Verification</h3></div>
        <div class="verify-status-row"><span class="verify-status-pill ${isRejected ? "rejected" : "unverified"}">${isRejected ? "Verification Needs Attention" : "Not Verified"}</span></div>
        ${isRejected ? `<div class="verify-reason"><b>Your last submission wasn't approved.</b>${rec.reason ? " " + rec.reason : " Please review and resubmit your evidence."}</div>` : `<p class="profile-sub" style="margin-bottom:4px">Build trust by verifying your profile.</p>`}

        <div id="verify-form-area">
          <h4 style="margin:18px 0 10px;font-size:.9rem">Choose what you're verifying</h4>
          <div class="verify-cat-list" role="radiogroup" aria-label="Verification category">
            ${CATEGORIES.map(c => `
              <label class="verify-cat-opt">
                <input type="radio" name="verify-cat" value="${c.id}" ${draft.category === c.id ? "checked" : ""}>
                <span><b>${c.label}</b><span>${c.desc}</span></span>
              </label>`).join("")}
          </div>

          <h4 style="margin:18px 0 10px;font-size:.9rem">Upload evidence</h4>
          <div class="verify-dropzone" id="verify-dropzone" tabindex="0" role="button" aria-label="Upload verification evidence">
            ${SR.icons.clipboard}
            <p><b>Drag & drop files</b> or click to browse</p>
            <p>${ACCEPTED_EXT.join(", ")} · up to ${MAX_FILE_MB}MB each · max ${MAX_FILES} files</p>
          </div>
          <input type="file" id="verify-file-input" multiple accept="${ACCEPTED_EXT.join(",")}" style="display:none">
          <div class="verify-file-list" id="verify-file-list"></div>
          <div class="verify-error" id="verify-error" role="alert" style="display:none"></div>

          <div class="verify-note">Your verification request will be reviewed before your profile receives the Verified badge.</div>
          <div class="verify-actions">
            <button class="btn btn-primary" id="btn-submit-verify">Submit for Review</button>
          </div>
        </div>
      </div>`;

    bindForm(merchantId);
  }

  function showError(msg) {
    const err = document.getElementById("verify-error");
    if (!err) return;
    err.textContent = msg || "";
    err.style.display = msg ? "block" : "none";
  }

  function renderFileList() {
    const list = document.getElementById("verify-file-list");
    if (!list) return;
    list.innerHTML = draft.files.map((f, i) => `
      <div class="verify-file-row">
        <span class="fname">${f.name}</span>
        <span class="fsize">${fmtSize(f.size)}</span>
        <button type="button" data-remove="${i}" aria-label="Remove ${f.name}">Remove</button>
      </div>`).join("");
    list.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        draft.files.splice(Number(btn.dataset.remove), 1);
        renderFileList();
      });
    });
  }

  function addFiles(fileList) {
    showError(null);
    const incoming = Array.from(fileList || []);
    for (const file of incoming) {
      if (draft.files.length >= MAX_FILES) { showError("You can attach up to " + MAX_FILES + " files."); break; }
      if (draft.files.some(f => f.name === file.name && f.size === file.size)) continue; // skip accidental duplicates
      const err = validFile(file);
      if (err) { showError(err); continue; }
      draft.files.push(file);
    }
    renderFileList();
  }

  function bindForm(merchantId) {
    const area = document.getElementById("verify-form-area");
    area.querySelectorAll('input[name="verify-cat"]').forEach(r => {
      r.addEventListener("change", () => { draft.category = r.value; });
    });

    const zone = document.getElementById("verify-dropzone");
    const input = document.getElementById("verify-file-input");
    zone.addEventListener("click", () => input.click());
    zone.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    input.addEventListener("change", () => addFiles(input.files));
    ["dragenter", "dragover"].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.add("dragover"); }));
    ["dragleave", "drop"].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.remove("dragover"); }));
    zone.addEventListener("drop", e => addFiles(e.dataTransfer.files));

    renderFileList();

    document.getElementById("btn-submit-verify").addEventListener("click", () => {
      if (!draft.category) { showError("Please choose a verification category."); return; }
      if (draft.files.length === 0) { showError("Please attach at least one supporting file."); return; }
      submit(merchantId);
    });
  }

  function submit(merchantId) {
    const btn = document.getElementById("btn-submit-verify");
    if (btn) { btn.disabled = true; btn.textContent = "Submitting…"; }
    const record = {
      status: "under_review",
      submittedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      evidence: { category: draft.category, files: draft.files.map(f => ({ name: f.name, size: f.size })) }
    };
    saveRecord(merchantId, record);
    SR.util.toast("Verification submitted for review.", "success");
    renderCard(merchantId);
    // Simulated review turnaround for this prototype (no live backend/admin
    // system exists yet — see PR notes). Always resolves to verified so the
    // full flow, including the badge, is demonstrable end-to-end.
    setTimeout(() => {
      const current = getRecord(merchantId);
      if (current.status !== "under_review") return; // user may have navigated/changed state
      saveRecord(merchantId, Object.assign({}, current, { status: "verified", reviewedAt: new Date().toISOString() }));
      SR.util.toast("Your profile has been verified.", "success");
      if (document.getElementById("verify-mount")) renderCard(merchantId);
      SR.app.refreshProfileNav && SR.app.refreshProfileNav();
    }, 5000);
  }

  return { renderCard, isVerified, badge, statusLabel: s => STATUS_LABEL[s] || STATUS_LABEL.unverified };
})();

SR.profile = (function () {

  function renderProfile() {
    const m = SR.state.currentMerchant;
    const el = document.getElementById("profile-mount");
    const verified = SR.verify.isVerified(m.id);
    el.innerHTML = `
      <div class="panel-head"><h2>Merchant profile</h2></div>
      <div class="profile-head">
        <div class="avatar-wrap">
          <div class="avatar-lg" id="profile-avatar-lg">${SR.avatar.img("merchant", m.id)}</div>
          <button class="avatar-edit-badge" id="profile-avatar-edit" type="button" aria-label="Change avatar">${SR.icons.camera}</button>
        </div>
        <div>
          <div class="profile-name">${m.name}${verified ? SR.verify.badge("verify-badge-inline") : ""}</div>
          <div class="profile-sub">${m.business} · ${m.location} · ${m.email}</div>
          <div class="profile-sub">Merchant ID: ${m.id} · Joined ${m.joined}</div>
        </div>
        <button class="btn btn-ghost btn-sm" style="margin-left:auto" id="btn-edit-profile">Edit profile</button>
      </div>
      <div id="verify-mount"></div>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">Returns processed</span><b>${m.returns}</b></div>
        <div class="stat-card"><span class="label">Value recovered</span><b>${SR.util.money(m.recoveredValue)}</b></div>
        <div class="stat-card"><span class="label">CO₂ avoided</span><b>${m.co2Avoided} kg</b></div>
        <div class="stat-card"><span class="label">E-waste avoided</span><b>${m.ewasteAvoided} kg</b></div>
        <div class="stat-card"><span class="label">Sustainability score</span><b>${m.sustainabilityScore}/100</b></div>
        <div class="stat-card risk-${m.riskLevel.toLowerCase()}"><span class="label">Risk status</span><b>${m.riskLevel}</b></div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Route history breakdown</h3></div>
        ${[["Resell","Resold"],["Refurbish","Refurbished"],["Exchange","Exchanged"],["Recycle","Recycled"],["Donate","Donated"],["Write Off","Written off"]].map(([match,label]) => {
          const count = m.returnHistory.filter(h => h.route === match).length;
          return `<div class="hist-item"><span>${label}</span><b>${count}</b></div>`;
        }).join("")}
      </div>
      <div class="card">
        <div class="card-title"><h3>Account</h3></div>
        <div class="settings-list">
          <div class="settings-row"><div><b>Edit profile</b><span>Update business details and contact info</span></div><button class="btn btn-ghost btn-sm">Edit</button></div>
          <div class="settings-row"><div><b>Settings</b><span>Notifications, theme, security</span></div><button class="btn btn-ghost btn-sm" id="btn-go-settings">Open</button></div>
          <div class="settings-row"><div><b>Log out</b><span>Sign out of this Circulyze session</span></div><button class="btn btn-ghost btn-sm" id="btn-logout">Log out</button></div>
        </div>
      </div>`;
    document.getElementById("btn-edit-profile").addEventListener("click", () => SR.util.toast("Profile editing is simulated in this prototype.", "success"));
    document.getElementById("btn-go-settings").addEventListener("click", () => SR.app.showScreen("settings"));
    document.getElementById("btn-logout").addEventListener("click", () => SR.app.logout());
    document.getElementById("profile-avatar-edit").addEventListener("click", () => {
      SR.avatar.openPicker("merchant", m.id, () => {
        document.getElementById("profile-avatar-lg").innerHTML = SR.avatar.img("merchant", m.id);
        SR.app.refreshProfileNav();
      });
    });
    SR.verify.renderCard(m.id);
  }

  function renderSettings() {
    const el = document.getElementById("settings-mount");
    const s = SR.data.settings;
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const isMerchant = SR.state.role === "merchant";
    const avatarKind = isMerchant ? "merchant" : "company";
    const avatarId = isMerchant ? SR.state.currentMerchant.id : null;
    el.innerHTML = `
      <div class="panel-head"><h2>Settings</h2></div>
      <div class="card">
        <div class="card-title"><h3>${isMerchant ? "Your avatar" : "Company avatar"}</h3></div>
        <div class="avatar-picker-current">
          <div class="avatar-wrap">
            <div class="avatar-lg" id="settings-avatar-lg">${SR.avatar.img(avatarKind, avatarId)}</div>
            <button class="avatar-edit-badge" id="settings-avatar-edit" type="button" aria-label="Change avatar">${SR.icons.camera}</button>
          </div>
          <p>Shown on your dashboard, listings and profile across Circulyze.</p>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Appearance</h3></div>
        <div class="settings-row">
          <div><b>Theme</b><span>Light, dark or match system</span></div>
          <div class="theme-toggle">
            ${["light","dark","system"].map(t => `<button data-theme-choice="${t}" class="${current===t?"active":""}">${t[0].toUpperCase()+t.slice(1)}</button>`).join("")}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Notifications</h3></div>
        <div class="settings-list">
          <div class="settings-row"><div><b>Email alerts</b><span>Return and recovery updates</span></div><button class="switch ${s.notificationDefaults.emailAlerts?"on":""}" data-toggle="emailAlerts"><i></i></button></div>
          <div class="settings-row"><div><b>Risk alerts</b><span>High-risk return notifications</span></div><button class="switch ${s.notificationDefaults.riskAlerts?"on":""}" data-toggle="riskAlerts"><i></i></button></div>
          <div class="settings-row"><div><b>Weekly digest</b><span>Summary email every Monday</span></div><button class="switch ${s.notificationDefaults.weeklyDigest?"on":""}" data-toggle="weeklyDigest"><i></i></button></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Data preferences</h3></div>
        <div class="settings-row"><div><b>Share anonymized benchmark data</b><span>Helps calibrate category-wide recovery estimates</span></div>
          <button class="switch ${s.dataPreferences.shareAnonymizedBenchmark?"on":""}" data-toggle="shareAnonymizedBenchmark"><i></i></button></div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Security</h3></div>
        <div class="settings-list">
          <div class="settings-row"><div><b>Password</b><span>Last changed — simulated for prototype</span></div><button class="btn btn-ghost btn-sm">Change</button></div>
          <div class="settings-row"><div><b>Two-factor authentication</b><span>Not enabled</span></div><button class="btn btn-ghost btn-sm">Enable</button></div>
        </div>
      </div>`;

    el.querySelectorAll("[data-theme-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        SR.app.setTheme(btn.dataset.themeChoice);
        el.querySelectorAll("[data-theme-choice]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
    el.querySelectorAll("[data-toggle]").forEach(btn => {
      btn.addEventListener("click", () => btn.classList.toggle("on"));
    });
    document.getElementById("settings-avatar-edit").addEventListener("click", () => {
      SR.avatar.openPicker(avatarKind, avatarId, () => {
        document.getElementById("settings-avatar-lg").innerHTML = SR.avatar.img(avatarKind, avatarId);
        SR.app.refreshProfileNav();
      });
    });
  }

  function renderWarrantyAndParts() {
    const el = document.getElementById("parts-mount");
    const cfg = SR.data.routesConfig;
    el.innerHTML = `
      <div class="panel-head"><h2>Warranty & parts exchange</h2></div>
      <div class="card">
        <div class="card-title"><h3>Fast warranty</h3></div>
        <table class="data-table">
          <thead><tr><th>Product</th><th>Status</th><th>Duration</th><th>Start</th><th>Expiry</th><th>Claims</th></tr></thead>
          <tbody>
            ${cfg.warrantySamples.map(w => {
              const p = SR.data.products.find(p => p.id === w.productId);
              return `<tr><td>${p ? p.name : w.productId}</td><td>${w.status}</td><td>${w.durationMonths} months</td><td>${w.startDate}</td><td>${w.expiryDate}</td><td>${w.claimStatus}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="card-title"><h3>Parts & accessories exchange</h3></div>
        <table class="data-table">
          <thead><tr><th>Part</th><th>Available</th><th>Requested</th><th>Compatible products</th></tr></thead>
          <tbody>
            ${cfg.partsAccessories.map(p => `<tr><td>${p.name}</td><td>${p.available}</td><td>${p.requested}</td><td>${p.compatibleProducts.join(", ")}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  return { renderProfile, renderSettings, renderWarrantyAndParts };
})();
