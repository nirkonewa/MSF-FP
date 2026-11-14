import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYnPOgWFVABldjw1jcoBsZXg9mUFQ71fU",
    authDomain: "msf-fanproject.firebaseapp.com",
    databaseURL: "https://msf-fanproject-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "msf-fanproject",
    storageBucket: "msf-fanproject.firebasestorage.app",
    messagingSenderId: "872567757703",
    appId: "1:872567757703:web:3a2f4c7aa082e52d531122"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const container = document.getElementById("character-container");
const searchInput = document.getElementById("searchInput");
const countElement = document.getElementById("character-count");

let detailContainer = document.createElement("div");
detailContainer.id = "detail-container";
detailContainer.style.display = "none";
if (container) {
    container.parentNode.insertBefore(detailContainer, container);
}

let allCharacters = [];

function renderCharacters(characters) {
    if (!container) return;
    container.innerHTML = "";
    
    if (!characters || characters.length === 0) {
        container.innerHTML = "<p>Nenašli sa žiadne postavy.</p>";
        if (countElement) countElement.innerText = "Počet zobrazených postáv: 0";
        return;
    }

    if (countElement) {
        countElement.innerText = "Počet zobrazených postáv: " + characters.length;
    }

    characters.forEach(char => {
        const card = document.createElement("div");
        card.className = "char-card";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <div class="char-img" style="background-image: url('${char.image}');"></div>
            <div class="char-info">
                <h3>${char.name}</h3>
                <span class="role">Klikni pre zobrazenie detailov</span>
            </div>
        `;
        card.addEventListener("click", () => showCharacterDetail(char));
        container.appendChild(card);
    });
}

function showCharacterDetail(char) {
    container.style.display = "none";
    if (searchInput) searchInput.style.display = "none";
    if (countElement) countElement.style.display = "none";
    
    detailContainer.style.display = "block";
    
    const stats = char.stats || {};
    const abils = char.abilities || {};
    
    let activeAbility = "basic";
    let activeLevel = abils.basic && abils.basic.levels ? Math.max(...Object.keys(abils.basic.levels)) : 1;

    function renderDetailContent() {
        const currentAbil = abils[activeAbility] || {};
        const levelsObj = currentAbil.levels || {};
        const levelKeys = Object.keys(levelsObj).sort((a,b) => a - b);
        
        const currentDesc = levelsObj[activeLevel] || currentAbil.desc || "Žiadny popis schopnosti.";

        const levelsOptions = levelKeys.map(lvl => 
            `<option value="${lvl}" ${lvl == activeLevel ? 'selected' : ''}>LEVEL ${lvl}</option>`
        ).join("");

        // Výpočet pre Crit Damage
        const critDmg = 100 + (stats.critDamageBonus || 0);

        detailContainer.innerHTML = `
            <button id="backToList" style="margin-bottom: 20px; padding: 10px 20px; background: #00509e; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 4px;">⬅ SPÄŤ NA ZOZNAM</button>
            
            <div style="display: flex; flex-wrap: nowrap; gap: 20px; background: #081226; color: white; padding: 20px; font-family: sans-serif; border: 1px solid #1a3c61; align-items: flex-start;">
                
                <div style="width: 250px; flex-shrink: 0;">
                    <div style="background-image: url('${char.image}'); height: 250px; background-size: cover; background-position: top center; border: 3px solid #1a3c61;"></div>
                    <h2 style="text-align: center; margin: 0; padding: 10px; background: #05264f; font-size: 18px; border-bottom: 3px solid #1a3c61;">${char.name}</h2>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 15px; font-size: 13px; text-align: center;">
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Health</span><br><b>${(stats.health || 0).toLocaleString()}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Speed</span><br><b>${stats.speed || 0}</b></div>
                        
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Damage</span><br><b>${(stats.damage || 0).toLocaleString()}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Crit Chance</span><br><b>${stats.critChance || 0}%</b></div>
                        
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Armor</span><br><b>${(stats.armor || 0).toLocaleString()}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Crit Damage</span><br><b>${critDmg}%</b></div>
                        
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Focus</span><br><b>${(stats.focus || 0).toLocaleString()}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Resistance</span><br><b>${(stats.resist || 0).toLocaleString()}</b></div>

                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Accuracy</span><br><b>${stats.accuracy || 0}%</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Block Amount</span><br><b>${stats.blockAmount || 0}%</b></div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;">
                    ${['basic', 'special', 'ultimate', 'passive'].map(type => {
                        if (!abils[type] || !abils[type].icon) return '';
                        const isSelected = activeAbility === type;
                        return `<img src="${abils[type].icon}" 
                                     class="ability-btn" 
                                     data-type="${type}"
                                     style="width: 70px; height: 70px; cursor: pointer; border: ${isSelected ? '3px solid #f2a900' : '2px solid #333'}; border-radius: 4px;">`;
                    }).join("")}
                </div>

                <div style="flex-grow: 1; background: #0a1b35; border: 1px solid #1a3c61; padding: 20px; display: flex; flex-direction: column; max-height: 550px;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #1a3c61; padding-bottom: 10px; flex-shrink: 0;">
                        
                        <div style="display: flex; align-items: center; gap: 15px;">
                            ${currentAbil.icon ? `<img src="${currentAbil.icon}" style="width: 50px; height: 50px; border: 2px solid #f2a900; border-radius: 4px; box-shadow: 0 0 5px #f2a900;">` : ''}
                            <h3 style="margin: 0; color: white; font-size: 22px;">${currentAbil.name || "Neznáma schopnosť"}</h3>
                        </div>
                        
                        ${levelKeys.length > 0 ? `
                            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                <span style="color: #d18000; font-size: 12px; font-weight: bold; margin-bottom: 4px;">ZMENIŤ LEVEL</span>
                                <select id="abilityLevelSelect" style="background: transparent; color: #d18000; border: 1px solid #d18000; padding: 5px; font-weight: bold; cursor: pointer;">
                                    ${levelsOptions}
                                </select>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="overflow-y: auto; padding-right: 10px; flex-grow: 1;">
                        <p style="white-space: pre-line; line-height: 1.6; color: #ccc; text-align: center; font-weight: bold;">${currentDesc}</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("backToList").addEventListener("click", () => {
            detailContainer.style.display = "none";
            container.style.display = ""; 
            if (searchInput) searchInput.style.display = "block";
            if (countElement) countElement.style.display = "block";
        });

        document.querySelectorAll(".ability-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                activeAbility = e.target.getAttribute("data-type");
                const newLevels = Object.keys(abils[activeAbility]?.levels || {});
                activeLevel = newLevels.length > 0 ? Math.max(...newLevels) : 1;
                renderDetailContent();
            });
        });

        const selectEl = document.getElementById("abilityLevelSelect");
        if (selectEl) {
            selectEl.addEventListener("change", (e) => {
                activeLevel = e.target.value;
                renderDetailContent();
            });
        }
    }

    renderDetailContent();
}

const charactersRef = ref(db, 'characters/');
onValue(charactersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        allCharacters = Object.values(data);
        renderCharacters(allCharacters);
    } else {
        if(container) container.innerHTML = "<p>Databáza vo Firebase je prázdna.</p>";
    }
});

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCharacters = allCharacters.filter(char => 
            char.name.toLowerCase().includes(searchTerm)
        );
        renderCharacters(filteredCharacters);
    });
}

const backToTopBtn = document.getElementById("backToTop");

window.onscroll = function() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
};

if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}