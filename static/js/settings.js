// settings.js (remplacer le fichier existant)
document.addEventListener("DOMContentLoaded", () => {
  if (window.__settingsInit) return;
  window.__settingsInit = true;

  const STORAGE_KEY = "site_interface_mode"; // "pc" ou "mobile"

  // utilitaires de debug (supprime les console.log en prod si tu veux)
  const log = (...args) => { try { console.debug("[settings]", ...args); } catch(e){} };

  function setMode(mode, persist = false) {
    if (mode === "mobile") {
      document.body.classList.add("mobile-mode");
      document.body.classList.remove("pc-mode");
    } else {
      document.body.classList.add("pc-mode");
      document.body.classList.remove("mobile-mode");
    }
    if (persist) localStorage.setItem(STORAGE_KEY, mode);
    log("mode set to", mode);
  }

  // restore mode immediately (even if elements missing)
  const saved = localStorage.getItem(STORAGE_KEY);
  setMode(saved === "mobile" ? "mobile" : "pc", false);

  // attach handlers when elements exist
  function attachIfReady() {
    const gear = document.getElementById("settings-gear");
    const popup = document.getElementById("settings-popup");
    const toggle = document.getElementById("interface-toggle");

    // attach gear/popup handlers if both present
    if (gear && popup && !gear.__settingsAttached) {
      gear.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = popup.classList.toggle("open");
        popup.setAttribute("aria-hidden", String(!isOpen));
        gear.setAttribute("aria-expanded", String(isOpen));
        log("gear clicked, popup open:", isOpen);
      });
      // close on outside click
      document.addEventListener("click", (ev) => {
        if (!popup.classList.contains("open")) return;
        const t = ev.target;
        if (gear.contains(t) || popup.contains(t)) return;
        popup.classList.remove("open");
        popup.setAttribute("aria-hidden", "true");
        gear.setAttribute("aria-expanded", "false");
        log("popup closed by outside click");
      });
      // close on Escape
      document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && popup.classList.contains("open")) {
          popup.classList.remove("open");
          popup.setAttribute("aria-hidden", "true");
          gear.setAttribute("aria-expanded", "false");
          log("popup closed by Escape");
        }
      });
      gear.__settingsAttached = true;
      log("gear/popup handlers attached");
    }

    // attach toggle handler if present
    if (toggle && !toggle.__settingsAttached) {
      // set initial checked state from saved mode
      toggle.checked = (localStorage.getItem(STORAGE_KEY) || "pc") === "pc";
      toggle.addEventListener("change", () => {
        const mode = toggle.checked ? "pc" : "mobile";
        setMode(mode, true);
      });
      toggle.__settingsAttached = true;
      log("toggle handler attached, checked:", toggle.checked);
    }

    // return true if at least gear exists (we consider success)
    return !!document.getElementById("settings-gear");
  }

  // try immediate attach
  if (!attachIfReady()) {
    // observe DOM for additions (useful if templates are injected)
    const mo = new MutationObserver((mutations, obs) => {
      if (attachIfReady()) {
        obs.disconnect();
        log("MutationObserver: attached and disconnected");
      }
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
    // safety timeout: stop observing after 10s
    setTimeout(() => { try { mo.disconnect(); log("MutationObserver timeout disconnected"); } catch(e){} }, 10000);
  }
});
