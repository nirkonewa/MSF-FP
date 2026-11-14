const responsiveStyle = document.createElement("style");
responsiveStyle.textContent = `
.nav-menu-select { padding: 4px 8px; background: #0c1a30; color: white; border: 1px solid #1a3c61; border-radius: 2px; font-weight: bold; font-size: 13px; cursor: pointer; outline: none; text-transform: uppercase; }
`;
document.head.appendChild(responsiveStyle);

const navMenu2 = document.getElementById("navMenu2");
const contentContainer = document.getElementById("app-content");

navMenu2.addEventListener("change", async (e) => {
    const val = e.target.value;

    try {
        const response = await fetch(`../HTML/${val}.html`);
        if (!response.ok) throw new Error("Stránku sa nepodarilo načítať");

        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        
        const mainContent = doc.querySelector("main") || doc.body;

        // 1. Vložíme obsah do kontajnera
        contentContainer.innerHTML = mainContent.innerHTML;

 // 2. AUTOMATICKÉ NÁJDENIE A SPUSTENIE SKRIPTOV V NAČÍTANOM OBSAHU
        const scripts = contentContainer.querySelectorAll("script");
        scripts.forEach(oldScript => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach(attr => {
                if (attr.name === "src") {
                    // Pridáme cache-buster, aby prehliadač modul zakaždým znova stiahol a spustil
                    newScript.setAttribute("src", attr.value + "?t=" + Date.now());
                } else {
                    newScript.setAttribute(attr.name, attr.value);
                }
            });
            if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

    } catch (error) {
        contentContainer.innerHTML = `<p style="color: red;">Chyba: Nepodarilo sa načítat sekciu ${val}.</p>`;
    }
});