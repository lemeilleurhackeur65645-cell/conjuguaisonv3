document.addEventListener('DOMContentLoaded', () => {
    const secTemps = document.getElementById('sec-temps');
    const secPers = document.getElementById('sec-personnes');
    const secVerbes = document.getElementById('sec-verbes');
    const tempsContainer = document.getElementById('temps-container');

    // --- 1. GESTION VISUELLE DES CHIPS ---
    function initChipListener(container) {
        const target = container || document;
        target.querySelectorAll('.chip').forEach(chip => {
            if (chip.dataset.listened) return; 
            const input = chip.querySelector('input');
            
            chip.addEventListener('click', (e) => {
                // Petit délai pour laisser l'input changer d'état
                setTimeout(() => {
                    chip.classList.toggle('active', input.checked);
                    updateLocks();
                }, 10);
            });
            chip.dataset.listened = "true";
        });
    }

    // --- 2. LOGIQUE DE DÉBLOCAGE (LOCKS) ---
    function updateLocks() {
        const hasModes = document.querySelectorAll('#sec-modes input:checked').length > 0;
        const hasTemps = document.querySelectorAll('#sec-temps input:checked').length > 0;
        const hasPers = document.querySelectorAll('#sec-personnes input:checked').length > 0;

        secTemps.classList.toggle('disabled', !hasModes);
        secPers.classList.toggle('disabled', !hasModes || !hasTemps);
        secVerbes.classList.toggle('disabled', !hasModes || !hasTemps || !hasPers);
    }

    // --- 3. MISE À JOUR DYNAMIQUE DES TEMPS ---
    document.querySelectorAll('#sec-modes input').forEach(input => {
        input.addEventListener('change', () => {
            const modesChoisis = Array.from(document.querySelectorAll('#sec-modes input:checked')).map(i => i.value);
            
            // Collecter tous les temps uniques pour les modes choisis
            const tempsSet = new Set();
            modesChoisis.forEach(m => {
                if (modesTempsMap[m]) modesTempsMap[m].forEach(t => tempsSet.add(t));
            });

            // Re-générer les chips de temps
            tempsContainer.innerHTML = "";
            Array.from(tempsSet).sort().forEach(t => {
                const label = document.createElement('label');
                label.className = 'chip';
                label.innerHTML = `<input type="checkbox" name="temps" value="${t}">${t}`;
                tempsContainer.appendChild(label);
            });
            
            initChipListener(tempsContainer);
            updateLocks();
        });
    });

    // --- 4. GESTION DES LISTES DE VERBES ---
    document.querySelectorAll('.list-chip').forEach(listChip => {
        listChip.addEventListener('click', () => {
            const listeId = listChip.dataset.liste;
            const isChecked = listChip.querySelector('input').checked;
            
            let selector = `.verb-chip[data-liste="${listeId}"] input`;
            if (listeId === 'all') selector = `.verb-chip input`;

            document.querySelectorAll(selector).forEach(vInput => {
                vInput.checked = isChecked;
                vInput.parentElement.classList.toggle('active', isChecked);
            });
        });
    });

    // Initialisation
    initChipListener();
    updateLocks();
});
