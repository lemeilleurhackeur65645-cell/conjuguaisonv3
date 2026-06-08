document.addEventListener("DOMContentLoaded", () => {
  if (window.__settingsInit) return;
  window.__settingsInit = true;

  const STORAGE_KEY = "site_interface_mode"; // "pc" ou "mobile"

  const popup = document.getElementById("settings-popup");
  const gear = document.getElementById("settings-gear");
  const interfaceToggle = document.getElementById("interface-toggle");

  /* -----------------------------
     1. Toujours restaurer le mode
     ----------------------------- */
  const saved = localStorage.getItem(STORAGE_KEY);

  function setMode(mode, persist = false) {
    if (mode === "mobile") {
      document.body.classList.add("mobile-mode");
      document.body.classList.remove("pc-mode");
      if (interfaceToggle) {
        interfaceToggle.checked = false;
        interfaceToggle.setAttribute("aria-checked", "false");
      }
    } else {
      document.body.classList.add("pc-mode");
      document.body.classList.remove("mobile-mode");
      if (interfaceToggle) {
        interfaceToggle.checked = true;
        interfaceToggle.setAttribute("aria-checked", "true");
      }
    }
    if (persist) localStorage.setItem(STORAGE_KEY, mode);
  }

  // Init selon localStorage (default = pc)
  setMode(saved === "mobile" ? "mobile" : "pc", false);

  /* -----------------------------
     2. Gestion du switch PC/Mobile
     ----------------------------- */
  if (interfaceToggle) {
    interfaceToggle.addEventListener("change", () => {
      setMode(interfaceToggle.checked ? "pc" : "mobile", true);
    });
  }

  /* -----------------------------
     3. Gestion du bouton engrenage
     ----------------------------- */
  if (gear && popup) {
    gear.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = popup.classList.toggle("open");
      popup.setAttribute("aria-hidden", String(!isOpen));
      gear.setAttribute("aria-expanded", String(isOpen));
    });

    // Fermer si clic en dehors
    document.addEventListener("click", (ev) => {
      if (!popup.classList.contains("open")) return;
      const t = ev.target;
      if (gear.contains(t) || popup.contains(t)) return;
      popup.classList.remove("open");
      popup.setAttribute("aria-hidden", "true");
      gear.setAttribute("aria-expanded", "false");
    });

    // Fermer à Échap
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && popup.classList.contains("open")) {
        popup.classList.remove("open");
        popup.setAttribute("aria-hidden", "true");
        gear.setAttribute("aria-expanded", "false");
      }
    });
  }
});
// Robust attach: si le bouton est ajouté plus tard, on l'attache via mutation observer
(function attachSettingsWhenReady() {
  const tryAttach = () => {
    const gear = document.getElementById("settings-gear");
    const popup = document.getElementById("settings-popup");
    const toggle = document.getElementById("interface-toggle");
    if (!gear) return false;

    // ensure aria attributes exist
    gear.setAttribute("aria-expanded", gear.getAttribute("aria-expanded") || "false");
    if (popup) popup.setAttribute("aria-hidden", popup.getAttribute("aria-hidden") || "true");

    // re-attach click handler if none
    if (!gear.__settingsAttached) {
      gear.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!popup) return;
        const isOpen = popup.classList.toggle("open");
        popup.setAttribute("aria-hidden", String(!isOpen));
        gear.setAttribute("aria-expanded", String(isOpen));
      });
      gear.__settingsAttached = true;
    }

    // ensure toggle handler exists
    if (toggle && !toggle.__settingsAttached) {
      toggle.addEventListener("change", () => {
        const mode = toggle.checked ? "pc" : "mobile";
        document.body.classList.toggle("pc-mode", toggle.checked);
        document.body.classList.toggle("mobile-mode", !toggle.checked);
        localStorage.setItem("site_interface_mode", mode);
      });
      toggle.__settingsAttached = true;
    }

    return true;
  };

  if (!tryAttach()) {
    // observe DOM additions for the gear/popup
    const mo = new MutationObserver((mutations, obs) => {
      if (tryAttach()) obs.disconnect();
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
  }
})();

