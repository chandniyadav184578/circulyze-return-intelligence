/* ==========================================================================
   Circulyze — Avatar system (merchant + company profile avatars)
   Selection is stored in localStorage and falls back to a clean default
   avatar when nothing has been chosen yet. Individual avatars are pre-cropped
   circular PNGs in assets/avatars/ (sourced from the provided avatar sheet).
   ========================================================================== */
window.SR = window.SR || {};

SR.avatar = (function () {
  const STORAGE_KEY = "circulyze-avatars";
  const COUNT = 12;
  const PATHS = Array.from({ length: COUNT }, (_, i) => `assets/avatars/avatar-${String(i + 1).padStart(2, "0")}.png`);
  const DEFAULT_PATH = "assets/avatars/default.png";

  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function writeStore(store) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
    catch (e) { /* storage unavailable — selection just won't persist */ }
  }

  // "kind" is "merchant" or "company". Merchants are keyed by id; the
  // prototype has a single company account, so company avatars share one key.
  function keyFor(kind, id) {
    return kind === "company" ? "company" : `merchant:${id}`;
  }

  function get(kind, id) {
    const store = readStore();
    return store[keyFor(kind, id)] || DEFAULT_PATH;
  }

  function set(kind, id, path) {
    const store = readStore();
    store[keyFor(kind, id)] = path;
    writeStore(store);
  }

  function img(kind, id, className) {
    return `<img class="avatar-img${className ? " " + className : ""}" src="${get(kind, id)}" alt="" />`;
  }

  /* Opens the "Choose your avatar" picker modal. onPick() fires after a
     selection is saved so callers can refresh whatever they rendered. */
  function openPicker(kind, id, onPick) {
    const current = get(kind, id);
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box modal-box-lg">
        <h3>Choose your avatar</h3>
        <p>Pick an avatar to represent ${kind === "company" ? "your company" : "your profile"} across Circulyze.</p>
        <div class="avatar-picker-grid">
          ${PATHS.map(p => `<button type="button" class="avatar-option${p === current ? " selected" : ""}" data-path="${p}" aria-label="Select avatar"><img src="${p}" alt="" /></button>`).join("")}
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-act="cancel" type="button">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => {
      if (e.target === overlay || e.target.dataset.act === "cancel") { overlay.remove(); return; }
      const btn = e.target.closest(".avatar-option");
      if (btn) {
        set(kind, id, btn.dataset.path);
        overlay.remove();
        onPick && onPick(btn.dataset.path);
      }
    });
  }

  return { PATHS, DEFAULT_PATH, get, set, img, openPicker };
})();
