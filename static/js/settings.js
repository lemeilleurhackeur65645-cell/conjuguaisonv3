document.addEventListener("DOMContentLoaded", () => {
    const interfaceToggle = document.getElementById("interface-toggle");

    function applyInterfaceMode() {
        if (interfaceToggle.checked) {
            document.body.classList.remove("mobile-mode");
            document.body.classList.add("pc-mode");
        } else {
            document.body.classList.remove("pc-mode");
            document.body.classList.add("mobile-mode");
        }
    }

    interfaceToggle.addEventListener("change", applyInterfaceMode);

    // Mode par défaut : PC
    applyInterfaceMode();
});
