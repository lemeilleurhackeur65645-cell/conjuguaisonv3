document.addEventListener("DOMContentLoaded", () => {
  // Eviter double initialisation si le script est chargé plusieurs fois
  if (window.__settingsInit) return;
  window.__settingsInit = true;

  const interfaceToggle = document.getElementById("interface-toggle");
  const popup = document.getElementById("settings-popup");
  const gear = document.getElementById("settings-gear");

  // Défauts et clé localStorage
  const STORAGE_KEY = "site_interface_mode"; // "pc" ou "mobile"
  const saved = localStorage.getItem(STORAGE_KEY);

  // Si l'élément n'existe pas, on sort proprement
  if (!interfaceToggle) return;

  // Initialise l'état du toggle selon localStorage ou valeur par défaut (PC)
  function initToggle() {
    const mode = saved === "mobile" ? "mobile" : "pc";
    interfaceToggle.checked = (mode === "pc"); // checked = PC
    applyInterfaceMode(false);
  }

  // Applique classes sur body et met à jour aria
  function applyInterfaceMode(shouldPersist = true) {
    const isPC = interfaceToggle.checked;
    if (isPC) {
      document.body.classList.remove("mobile-mode");
      document.body.classList.add("pc-mode");
      interfaceToggle.setAttribute("aria-checked", "true");
      if (shouldPersist) localStorage.setItem(STORAGE_KEY, "pc");
    } else {
      document.body.classList.remove("pc-mode");
      document.body.classList.add("mobile-mode");
      interfaceToggle.setAttribute("aria-checked", "false");
      if (shouldPersist) localStorage.setItem(STORAGE_KEY, "mobile");
    }
  }

  // Événement change
  interfaceToggle.addEventListener("change", () => applyInterfaceMode(true));

  // Initialisation
  initToggle();

  // Optionnel : si tu veux que la popup se ferme en cliquant sur l'engrenage, garde ton code existant.
  // Exemple de gestion simple d'ouverture/fermeture si nécessaire
  if (gear && popup) {
    gear.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = popup.classList.toggle("open");
      popup.setAttribute("aria-hidden", String(!isOpen));
      gear.setAttribute("aria-expanded", String(isOpen));
    });

    // fermer au clic en dehors
    document.addEventListener("click", (ev) => {
      if (!popup.classList.contains("open")) return;
      const t = ev.target;
      if (gear.contains(t) || popup.contains(t)) return;
      popup.classList.remove("open");
      popup.setAttribute("aria-hidden", "true");
      gear.setAttribute("aria-expanded", "false");
    });

    // fermer à Échap
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && popup.classList.contains("open")) {
        popup.classList.remove("open");
        popup.setAttribute("aria-hidden", "true");
        gear.setAttribute("aria-expanded", "false");
      }
    });
  }
});
