
// --- Sélection des éléments ---
const listChips = document.querySelectorAll(".list-chip");
const verbChips = document.querySelectorAll(".verb-chip");

// --- Met à jour l’état d’une liste (cochée / décochée) ---
function updateListState(listeId) {

    // Cas spécial : "Tous les verbes"
    if (listeId === "all") {
        const allChecked = Array.from(verbChips).every(chip => chip.querySelector("input").checked);
        const chipAll = document.querySelector('.list-chip[data-liste="all"]');
        chipAll.querySelector("input").checked = allChecked;
        chipAll.classList.toggle("active", allChecked);
        return;
    }

    // Verbes appartenant à cette liste
    const verbes = document.querySelectorAll(`.verb-chip[data-liste="${listeId}"] input`);
    const listeChip = document.querySelector(`.list-chip[data-liste="${listeId}"]`);

    // Vérifie si tous les verbes sont cochés
    const allChecked = Array.from(verbes).every(v => v.checked);

    listeChip.querySelector("input").checked = allChecked;
    listeChip.classList.toggle("active", allChecked);
}

// --- Quand on clique sur une liste ---
listChips.forEach(chip => {
    chip.addEventListener("click", () => {
        const listeId = chip.dataset.liste;
        const checked = chip.querySelector("input").checked;

        // Cas spécial : "Tous les verbes"
        if (listeId === "all") {
            verbChips.forEach(v => {
                v.querySelector("input").checked = checked;
                v.classList.toggle("active", checked);
            });

            // Toutes les listes suivent
            listChips.forEach(c => {
                if (c.dataset.liste !== "all") {
                    c.querySelector("input").checked = checked;
                    c.classList.toggle("active", checked);
                }
            });

            return;
        }

        // Coche/décoche tous les verbes de la liste
        const verbes = document.querySelectorAll(`.verb-chip[data-liste="${listeId}"]`);
        verbes.forEach(v => {
            v.querySelector("input").checked = checked;
            v.classList.toggle("active", checked);
        });

        // Met à jour "Tous les verbes"
        updateListState("all");
    });
});

// --- Quand on clique sur un verbe individuel ---
verbChips.forEach(chip => {
    chip.addEventListener("click", () => {
        const listeId = chip.dataset.liste;

        // Met à jour la liste correspondante
        updateListState(listeId);

        // Met à jour "Tous les verbes"
        updateListState("all");
    });
});
