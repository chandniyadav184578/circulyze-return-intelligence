/* ==========================================================================
   Circulyze — App shell, routing, data loading, utilities
   ========================================================================== */
window.SR = window.SR || {};

SR.state = { role: null, currentMerchant: null };

/* ---------------- UTIL ---------------- */
SR.util = (function () {
  function money(n) {
    n = Math.round(Number(n) || 0);
    return "₹" + n.toLocaleString("en-IN");
  }
  function toast(msg, type) {
    const root = document.getElementById("toast-root");
    const t = document.createElement("div");
    t.className = "toast " + (type || "");
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(() => t.remove(), 300); }, 3200);
  }
  function modal({ title, body, confirmText, onConfirm }) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>${title}</h3><p>${body}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-act="cancel">Cancel</button>
          <button class="btn btn-primary" data-act="confirm">${confirmText || "Confirm"}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => {
      if (e.target === overlay || e.target.dataset.act === "cancel") overlay.remove();
      if (e.target.dataset.act === "confirm") { onConfirm && onConfirm(); overlay.remove(); }
    });
  }
  return { money, toast, modal };
})();

/* ---------------- APP ---------------- */
SR.app = (function () {

  const MERCHANT_SCREENS = ["merchant-dashboard", "assess", "processing", "result", "merchant-history", "roi-tracking", "value-at-risk", "recovery-simulator", "circulyze-score", "intelligence-hub", "profile", "settings", "parts"];
  const COMPANY_SCREENS = ["company-dashboard", "company-merchants", "company-acquisition", "company-analytics", "company-impact", "company-risk", "company-merchant-detail", "marketplace", "settings"];

  async function loadJSON(key, path) {
    // Data is embedded inline (script#sr-data-*) so the site works when
    // index.html is opened directly via file:// (fetch() of local files is
    // blocked by browsers in that mode). Falls back to fetch() of data/*.json
    // when the tag isn't present (e.g. served over HTTP with updated files).
    const tag = document.getElementById("sr-data-" + key);
    if (tag) return JSON.parse(tag.textContent);
    return fetch(path).then(r => r.json());
  }

  async function loadData() {
    const [products, merchants, company, transactions, routes, settings] = await Promise.all([
      loadJSON("products", "data/products.json"),
      loadJSON("merchants", "data/merchants.json"),
      loadJSON("company", "data/company.json"),
      loadJSON("transactions", "data/transactions.json"),
      loadJSON("routes", "data/routes.json"),
      loadJSON("settings", "data/settings.json")
    ]);
    SR.data = { products, merchants, company, transactions, routesConfig: routes, routesMeta: routes.routes, settings };
  }

  function initSplash() {
    const splash = document.getElementById("splash");
    const finish = () => splash.classList.add("hide");
    setTimeout(finish, 2400);
    document.getElementById("splash-skip").addEventListener("click", finish);
  }

  function initTheme() {
    const saved = localStorage.getItem("sr-theme") || SR.data.settings.defaultTheme || "dark";
    setTheme(saved);
  }
  function setTheme(choice) {
    localStorage.setItem("sr-theme", choice);
    let actual = choice;
    if (choice === "system") {
      actual = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    if (actual === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  }

  function initNav() {
    document.querySelectorAll("[data-nav]").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.nav;
        if (target === "login") { showAuth(null); return; }
        if (target === "merchant-dashboard" || target === "company-dashboard") {
          if (SR.state.role) { enterApp(SR.state.role); showScreen(target); }
          else showAuth(target.startsWith("merchant") ? "merchant" : "company");
          return;
        }
        // nav items that map onto a carousel slide jump the carousel instead of scrolling past it
        const slideMap = { "how-it-works": 1, "decision-engine-info": 2, "sustainability-info": 3, "value-recovery": 4, "impact": 5 };
        if (target in slideMap) {
          document.getElementById("home").scrollIntoView({ behavior: "smooth" });
          SR.carousel && SR.carousel.goTo(slideMap[target]);
          return;
        }
        // scroll to marketing section
        const sec = document.getElementById(target);
        if (sec) sec.scrollIntoView({ behavior: "smooth" });
      });
    });
    document.getElementById("menu-toggle").addEventListener("click", () => {
      if (document.getElementById("app-shell").classList.contains("active")) {
        document.getElementById("sidebar").classList.toggle("open");
      } else {
        document.querySelector("nav.links").classList.toggle("mobile-open");
      }
    });
    document.getElementById("hero-assess-btn").addEventListener("click", () => {
      if (SR.state.role === "merchant") { enterApp("merchant"); showScreen("assess"); }
      else showAuth("merchant");
    });
    document.getElementById("hero-explore-btn").addEventListener("click", () => {
      document.getElementById("problem").scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("cta-assess-btn").addEventListener("click", () => {
      document.getElementById("hero-assess-btn").click();
    });
    document.getElementById("footer-assess-btn").addEventListener("click", () => {
      document.getElementById("hero-assess-btn").click();
    });
    document.getElementById("cta-dashboard-btn").addEventListener("click", () => {
      document.getElementById("hero-explore-btn").click();
    });
  }

  function showAuth(preselect) {
    document.getElementById("marketing-root").classList.add("hidden");
    document.getElementById("app-shell").classList.remove("active");
    document.getElementById("auth-view").classList.add("active");
    const role = preselect || "merchant";
    document.querySelectorAll("#role-toggle button").forEach(b => b.classList.toggle("active", b.dataset.role === role));
    document.getElementById("auth-view").dataset.role = role;
  }

  function initAuth() {
    document.querySelectorAll("#role-toggle button").forEach(b => {
      b.addEventListener("click", () => {
        document.querySelectorAll("#role-toggle button").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        document.getElementById("auth-view").dataset.role = b.dataset.role;
      });
    });
    document.getElementById("login-form").addEventListener("submit", e => {
      e.preventDefault();
      const role = document.getElementById("auth-view").dataset.role;
      login(role);
    });
    document.getElementById("back-to-landing").addEventListener("click", () => {
      document.getElementById("auth-view").classList.remove("active");
      document.getElementById("marketing-root").classList.remove("hidden");
    });
  }

  function login(role) {
    SR.state.role = role;
    SR.state.currentMerchant = SR.data.merchants[0];
    document.getElementById("auth-view").classList.remove("active");
    enterApp(role);
    SR.util.toast(`Signed in as ${role === "merchant" ? SR.data.merchants[0].business : SR.data.company.name}`, "success");
    showScreen(role === "merchant" ? "merchant-dashboard" : "company-dashboard");
  }

  function logout() {
    SR.state.role = null;
    SR.state.currentMerchant = null;
    document.getElementById("app-shell").classList.remove("active");
    document.getElementById("marketing-root").classList.remove("hidden");
    document.getElementById("sidebar").classList.remove("open");
    document.querySelector("header.topnav").classList.remove("in-app");
    document.getElementById("profile-nav").innerHTML = "";
    window.scrollTo({ top: 0 });
  }

  function enterApp(role) {
    document.getElementById("marketing-root").classList.add("hidden");
    document.getElementById("app-shell").classList.add("active");
    document.querySelector("header.topnav").classList.add("in-app");
    renderSidebar(role);
    renderProfileNav(role);
  }

  function renderSidebar(role) {
    const sb = document.getElementById("sidebar");
    const merchantGroups = [
      ["Main", [
        ["merchant-dashboard", "dashboard", "Dashboard"],
        ["assess", "clipboard", "Decision Engine"]
      ]],
      ["Intelligence", [
        ["value-at-risk", "risk", "Value at Risk"],
        ["recovery-simulator", "route", "Recovery Simulator"],
        ["circulyze-score", "condition", "Circulyze Score"],
        ["intelligence-hub", "bell", "Intelligence Hub"]
      ]],
      ["Operations", [
        ["merchant-history", "history", "Returns"],
        ["parts", "warranty", "Warranty & parts"]
      ]],
      ["Impact", [
        ["roi-tracking", "chart", "ROI tracking"]
      ]],
      ["Account", [
        ["profile", "building", "Profile"],
        ["settings", "settings", "Settings"]
      ]]
    ];
    const companyGroups = [
      ["Company", [
        ["company-dashboard", "dashboard", "Dashboard"],
        ["company-merchants", "users", "Merchants"],
        ["company-acquisition", "price", "Acquisition"],
        ["marketplace", "resell", "Merchant Marketplace"],
        ["company-analytics", "chart", "Analytics"],
        ["company-impact", "ewaste", "Impact"],
        ["company-risk", "fraud", "Risk & Fraud"]
      ]],
      ["Account", [
        ["settings", "settings", "Settings"]
      ]]
    ];
    const groups = role === "merchant" ? merchantGroups : companyGroups;
    sb.innerHTML = groups.map(([label, links]) => `
      <div class="side-group">
        <span class="side-label">${label}</span>
        ${links.map(([screen, icon, lbl]) => `<button class="side-link" data-screen="${screen}">${SR.icons[icon]}<span>${lbl}</span></button>`).join("")}
      </div>`).join("");
    sb.querySelectorAll("[data-screen]").forEach(btn => btn.addEventListener("click", () => showScreen(btn.dataset.screen)));
  }

  /* ---------------- TOP NAVBAR — PROFILE MENU ---------------- */
  function renderProfileNav(role) {
    const mount = document.getElementById("profile-nav");
    const isMerchant = role === "merchant";
    const m = SR.state.currentMerchant;
    const co = SR.data.company;
    const name = isMerchant ? m.name : (co.name || "Circulyze Company");
    const sub = isMerchant ? m.email : (co.email || "Company account");
    const avatarKind = isMerchant ? "merchant" : "company";
    const avatarId = isMerchant ? m.id : null;
    const verified = isMerchant && SR.verify && SR.verify.isVerified(m.id);

    const menuItems = [];
    if (isMerchant) menuItems.push(["profile", "building", "Profile"]);
    menuItems.push(["settings", "settings", "Settings"]);

    mount.innerHTML = `
      <button class="profile-trigger" id="profile-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
        <span class="profile-avatar">${SR.avatar.img(avatarKind, avatarId)}</span>
        <span class="profile-trigger-name">${name}</span>
        ${verified ? SR.verify.badge() : ""}
        <span class="chevron">${SR.icons.chevronDown}</span>
      </button>
      <div class="profile-menu" id="profile-menu" role="menu">
        <div class="profile-menu-head">
          <span class="profile-avatar profile-avatar-lg">${SR.avatar.img(avatarKind, avatarId)}</span>
          <div>
            <div class="profile-menu-name">${name}${verified ? SR.verify.badge("verify-badge-inline") : ""}</div>
            <div class="profile-menu-email">${sub}</div>
          </div>
        </div>
        <div class="profile-menu-list">
          ${menuItems.map(([screen, icon, label]) => `<button class="profile-menu-item" role="menuitem" data-menu-screen="${screen}">${SR.icons[icon]}<span>${label}</span></button>`).join("")}
        </div>
        <div class="profile-menu-foot">
          <button class="profile-menu-item profile-menu-logout" role="menuitem" id="profile-menu-logout">${SR.icons.logout}<span>Log out</span></button>
        </div>
      </div>`;

    const trigger = document.getElementById("profile-trigger");
    const menu = document.getElementById("profile-menu");

    const openMenu = () => { menu.classList.add("open"); trigger.setAttribute("aria-expanded", "true"); };
    const closeMenu = () => { menu.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); };

    trigger.addEventListener("click", e => {
      e.stopPropagation();
      menu.classList.contains("open") ? closeMenu() : openMenu();
    });
    menu.querySelectorAll("[data-menu-screen]").forEach(btn => {
      btn.addEventListener("click", () => { closeMenu(); showScreen(btn.dataset.menuScreen); });
    });
    document.getElementById("profile-menu-logout").addEventListener("click", () => { closeMenu(); logout(); });

    if (!profileNavGlobalListenersBound) {
      profileNavGlobalListenersBound = true;
      document.addEventListener("click", e => {
        const m = document.getElementById("profile-nav");
        const openMenuEl = document.getElementById("profile-menu");
        if (m && openMenuEl && !m.contains(e.target)) {
          openMenuEl.classList.remove("open");
          document.getElementById("profile-trigger")?.setAttribute("aria-expanded", "false");
        }
      });
      document.addEventListener("keydown", e => {
        if (e.key !== "Escape") return;
        const openMenuEl = document.getElementById("profile-menu");
        if (openMenuEl) {
          openMenuEl.classList.remove("open");
          document.getElementById("profile-trigger")?.setAttribute("aria-expanded", "false");
        }
      });
    }
  }
  let profileNavGlobalListenersBound = false;

  function showScreen(name, params) {
    document.getElementById("sidebar").classList.remove("open");
    document.querySelectorAll("#app-shell .view").forEach(v => v.classList.remove("active"));
    const target = document.getElementById("screen-" + name);
    if (target) target.classList.add("active");
    document.querySelectorAll("#sidebar [data-screen]").forEach(b => b.classList.toggle("active", b.dataset.screen === name));

    switch (name) {
      case "merchant-dashboard": SR.dashboard.renderMerchantDashboard(); break;
      case "assess": SR.dashboard.renderAssessForm(params || {}); break;
      case "processing": SR.dashboard.renderProcessing(params); break;
      case "result": SR.dashboard.renderResult(params); break;
      case "merchant-history": SR.dashboard.renderMerchantHistory(); break;
      case "roi-tracking": SR.roi.render(); break;
      case "value-at-risk": SR.intel.renderValueAtRisk(); break;
      case "recovery-simulator": SR.intel.renderRecoverySimulator(); break;
      case "circulyze-score": SR.intel.renderScore(); break;
      case "intelligence-hub": SR.intel.renderHub(); break;
      case "profile": SR.profile.renderProfile(); break;
      case "settings": SR.profile.renderSettings(); break;
      case "parts": SR.profile.renderWarrantyAndParts(); break;
      case "company-dashboard": SR.dashboard.renderCompanyDashboard(); break;
      case "company-merchants": SR.dashboard.renderCompanyMerchants(); break;
      case "company-acquisition": SR.dashboard.renderCompanyAcquisition(); break;
      case "company-analytics": SR.dashboard.renderCompanyAnalytics(); break;
      case "company-impact": SR.dashboard.renderCompanyImpact(); break;
      case "company-risk": SR.dashboard.renderCompanyRisk(); break;
      case "company-merchant-detail": SR.dashboard.renderCompanyMerchantDetail(params); break;
      case "marketplace": SR.marketplace.render(); break;
    }
    document.querySelector(".main-panel").scrollTo?.(0, 0);
    window.scrollTo({ top: 0 });
  }

  function renderMarketing() {
    const c = SR.data.company;
    document.getElementById("hero-stats").innerHTML = `
      <div><b>${SR.util.money(c.totals.valueRecovered)}</b><span>value recovered</span></div>
      <div><b>${c.totals.co2Avoided.toLocaleString("en-IN")} kg</b><span>CO₂ avoided</span></div>
      <div><b>${c.totals.activeMerchants}</b><span>retailers onboard</span></div>`;

    document.getElementById("slide-sustain-stats").innerHTML = `
      <div><b>${c.totals.co2Avoided.toLocaleString("en-IN")} kg</b><span>CO₂ avoided</span></div>
      <div><b>${c.totals.ewasteAvoided.toLocaleString("en-IN")} kg</b><span>e-waste avoided</span></div>
      <div><b>${c.totals.totalReturns.toLocaleString("en-IN")}</b><span>products processed</span></div>`;

    document.getElementById("slide-value-stats").innerHTML = `
      <div><b>${SR.util.money(c.totals.valueRecovered)}</b><span>value recovered</span></div>
      <div><b>${c.totals.avgCashRecoveryHours}h</b><span>avg. cash recovery</span></div>
      <div><b>${c.totals.avgDecisionTimeSeconds}s</b><span>avg. decision time</span></div>`;

    document.getElementById("route-grid").innerHTML = Object.entries(SR.data.routesMeta).map(([id, r], i) => `
      <div class="route-card">
        <div class="route-card-top">
          <div class="r-icon">${SR.icons[r.icon]}</div>
          <span class="r-index">0${i + 1}</span>
        </div>
        <h3>${r.label}</h3>
        <p>${r.summary}</p>
        <div class="r-meta">
          <span>Value impact <b>${r.valueImpact}</b></span>
          <span>Sustainability <b>${r.sustainabilityImpact}</b></span>
        </div>
        <span class="r-arrow" aria-hidden="true">${SR.icons.arrow}</span>
      </div>`).join("");
  }

  function initBrand() {
    const brand = document.getElementById("nav-brand");
    if (!brand) return;
    brand.addEventListener("click", () => {
      if (document.getElementById("app-shell").classList.contains("active")) {
        document.getElementById("app-shell").classList.remove("active");
        document.getElementById("sidebar").classList.remove("open");
        document.querySelector("header.topnav").classList.remove("in-app");
      }
      document.getElementById("marketing-root").classList.remove("hidden");
      const home = document.getElementById("home");
      if (home) home.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function init() {
    await loadData();
    initSplash();
    initTheme();
    initNav();
    initBrand();
    initAuth();
    renderMarketing();
    SR.carousel && SR.carousel.init();
  }

  function refreshProfileNav() {
    if (SR.state.role) renderProfileNav(SR.state.role);
  }

  return { showScreen, enterApp, login, logout, setTheme, init, refreshProfileNav };
})();

document.addEventListener("DOMContentLoaded", SR.app.init);
