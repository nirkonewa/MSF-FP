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

// Injekcia responzívnych štýlov vrátane nového rozloženia statov na mobile
const responsiveStyle = document.createElement("style");
responsiveStyle.textContent = `
    .detail-layout {
        display: flex;
        flex-wrap: nowrap;
        gap: 20px;
        background: #081226;
        color: white;
        padding: 20px;
        font-family: sans-serif;
        border: 1px solid #1a3c61;
        align-items: flex-start;
    }
    .detail-left {
        width: 250px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
    }
    .char-avatar-block {
        width: 100%;
    }
    .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        padding-top: 15px;
        font-size: 13px;
        text-align: center;
    }
    .detail-right-container {
        display: flex;
        flex-grow: 1;
        gap: 20px;
        align-items: flex-start;
    }
    .ability-icons-col {
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex-shrink: 0;
    }
    .ability-desc-col {
        flex-grow: 1;
        background: #0a1b35;
        border: 1px solid #1a3c61;
        padding: 20px;
        display: flex;
        flex-direction: column;
        max-height: 550px;
        box-sizing: border-box;
    }
    
    /* Štýly pre prepínače vyhľadávania */
    .mode-container {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
        flex-wrap: wrap;
    }
    .mode-tab {
        padding: 10px 15px;
        background: #0c1a30;
        color: #aaa;
        border: 1px solid #1a3c61;
        cursor: pointer;
        font-weight: bold;
        border-radius: 4px;
        font-size: 13px;
        transition: all 0.2s ease;
    }
    .mode-tab.active {
        background: #00509e;
        color: white;
        border-color: #0070f3;
    }

    @media (max-width: 768px) {
        .detail-layout {
            flex-direction: column;
            align-items: center;
            padding: 12px;
        }
        .detail-left {
            width: 100%;
            max-width: 500px;
            flex-direction: row;
            gap: 15px;
            align-items: center;
            margin-bottom: 15px;
        }
        .char-avatar-block {
            width: 140px;
            flex-shrink: 0;
        }
        .char-avatar-block div {
            height: 140px !important;
        }
        .char-avatar-block h2 {
            font-size: 14px !important;
            padding: 6px !important;
        }
        .stats-grid {
            flex-grow: 1;
            padding-top: 0;
            font-size: 11px;
            gap: 6px;
        }
        .detail-right-container {
            width: 100%;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        .ability-icons-col {
            flex-direction: row;
            justify-content: center;
            width: 100%;
            flex-wrap: wrap;
        }
        .ability-desc-col {
            width: 100%;
            max-height: none;
        }
    }
`;
document.head.appendChild(responsiveStyle);

const container = document.getElementById("character-container");
const searchInput = document.getElementById("searchInput");
const countElement = document.getElementById("character-count");

// Vytvorenie prepínačov režimov nad vyhľadávačom
let currentMode = "characters"; // Možnosti: characters, def, atk, char
const modeWrapper = document.createElement("div");
modeWrapper.className = "mode-container";
modeWrapper.innerHTML = `
    <button class="mode-tab active" data-mode="characters">POSTAVY</button>
    <button class="mode-tab" data-mode="def">PROTI OBRANE (DEF)</button>
    <button class="mode-tab" data-mode="atk">ÚČINNÝ ÚTOK (ATK)</button>
    <button class="mode-tab" data-mode="char">PODĽA POSTAVY V TÍME</button>
`;
if (searchInput) {
    searchInput.parentNode.insertBefore(modeWrapper, searchInput);
}

let detailContainer = document.createElement("div");
detailContainer.id = "detail-container";
detailContainer.style.display = "none";
if (container) {
    container.parentNode.insertBefore(detailContainer, container);
}

// Globálne premenné pre dáta
let allCharacters = [];
let allCounters = [];

// Registrácia kliknutí na prepínače režimov
document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
        document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
        e.target.classList.add("active");
        
        currentMode = e.target.getAttribute("data-mode");
        if (searchInput) {
            searchInput.value = "";
            if (currentMode === "characters") searchInput.placeholder = "Vyhľadaj postavu podľa mena...";
            if (currentMode === "def") searchInput.placeholder = "Zadaj OBRANNÝ tím (nájde countery proti nemu)...";
            if (currentMode === "atk") searchInput.placeholder = "Zadaj ÚTOČIACI tím (nájde čo všetko porazí)...";
            if (currentMode === "char") searchInput.placeholder = "Zadaj meno hľadanej postavy v tímoch...";
        }
        
        // Zresetujeme zobrazenie podľa režimu
        if (currentMode === "characters") {
            renderCharacters(allCharacters);
        } else {
            renderCounters([]);
        }
    });
});

// Renderovanie zoznamu klasických postáv
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

// Renderovanie Counterov (Tím hore -> Countery pod ním)
function renderCounters(counters) {
    if (!container) return;
    container.innerHTML = "";

    if (searchInput && searchInput.value.trim() === "") {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 20px;'>Začni písať pre vyhľadanie tímových counterov.</p>";
        if (countElement) countElement.innerText = "Počet nájdených counterov: 0";
        return;
    }

    if (!counters || counters.length === 0) {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 20px;'>Nenašli sa žiadne zodpovedajúce countery.</p>";
        if (countElement) countElement.innerText = "Počet nájdených counterov: 0";
        return;
    }

    if (countElement) {
        countElement.innerText = "Počet nájdených counterov: " + counters.length;
    }

    // Zoskupenie counterov podľa OBRANNÉHO tímu (aby bol hľadaný tím hore fixne)
    const grouped = {};
    counters.forEach(item => {
        const key = item.defTeam;
        if (!grouped[key]) {
            grouped[key] = {
                defTeam: item.defTeam,
                defChars: item.defChars || [],
                list: []
            };
        }
        grouped[key].list.push(item);
    });

    // Vykreslenie zoskupených dát
    Object.values(grouped).forEach(group => {
        const groupEl = document.createElement("div");
        groupEl.style.cssText = "background: #0c1a30; border: 2px solid #1a3c61; margin-bottom: 25px; border-radius: 6px; overflow: hidden; font-family: sans-serif;";
        
        // Pomocná funkcia na vytvorenie ikoniek postáv s preklikom do detailu
        const makeIconsHtml = (charNames, isAtk) => {
            return charNames.map(name => {
                const found = allCharacters.find(c => c.name.toLowerCase() === name.toLowerCase().trim());
                const img = found ? found.image : '';
                const borderColor = isAtk ? '#00509e' : '#d18000';
                return `
                    <div class="mini-char-click" data-name="${name}" style="display: flex; flex-direction: column; align-items: center; width: 65px; cursor: pointer;">
                        <div style="width: 50px; height: 50px; background-image: url('${img}'); background-size: cover; background-position: top center; border: 2px solid ${borderColor}; border-radius: 4px; background-color: #05264f;"></div>
                        <span style="font-size: 9px; color: #ccc; text-align: center; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; margin-top: 3px;">${name}</span>
                    </div>
                `;
            }).join("");
        };

        const defIcons = makeIconsHtml(group.defChars, false);

        let rowsHtml = group.list.map(item => {
            const atkIcons = makeIconsHtml(item.atkChars || [], true);
            const winVal = parseInt(item.winChance) || 0;
            const badgeColor = winVal >= 75 ? "#28a745" : (winVal >= 50 ? "#e67e22" : "#dc3545");

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #081226; border: 1px solid #1a3c61; padding: 12px; margin-bottom: 10px; border-radius: 4px; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <span style="font-size: 13px; color: #4fc3f7; font-weight: bold;">⚔️ ÚTOČNÝ TÍM: ${item.atkTeam}</span>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 5px;">
                            ${atkIcons}
                        </div>
                    </div>
                    <div style="background: ${badgeColor}; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; text-align: center; min-width: 65px; box-sizing: border-box;">
                        ${item.winChance}<br><span style="font-size: 9px; font-weight: normal;">ŠANCA</span>
                    </div>
                </div>
            `;
        }).join("");

        groupEl.innerHTML = `
            <div style="background: #112544; padding: 15px; border-bottom: 2px solid #1a3c61;">
                <h3 style="margin: 0 0 10px 0; color: #ffcc00; font-size: 16px; text-transform: uppercase;">🛡️ OBRANNÝ TÍM: ${group.defTeam}</h3>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${defIcons}
                </div>
            </div>
            <div style="padding: 15px; background: #0c1a30;">
                <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">Odporúčané Countery:</h4>
                ${rowsHtml}
            </div>
        `;
        container.appendChild(groupEl);
    });

    // Pridanie event listenerov pre kliknutie na mini ikonky postáv v tme/counteroch
    document.querySelectorAll(".mini-char-click").forEach(el => {
        el.addEventListener("click", (e) => {
            const charName = e.currentTarget.getAttribute("data-name");
            const found = allCharacters.find(c => c.name.toLowerCase() === charName.toLowerCase().trim());
            if (found) {
                showCharacterDetail(found);
            } else {
                alert("Postava '" + charName + "' nebola nájdená v zozname štatistík.");
            }
        });
    });
}

// Zobrazenie detailu postavy (pôvodná funkcia zostala zachovaná)
function showCharacterDetail(char) {
    container.style.display = "none";
    if (searchInput) searchInput.style.display = "none";
    if (countElement) countElement.style.display = "none";
    if (modeWrapper) modeWrapper.style.display = "none";
    
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
        const levelsOptions = levelKeys.map(lvl => `<option value="${lvl}" ${lvl == activeLevel ? 'selected' : ''}>LEVEL ${lvl}</option>`).join("");
        const critDmg = 100 + (stats.critDamageBonus || 0);

        detailContainer.innerHTML = `
            <button id="backToList" style="margin-bottom: 20px; padding: 10px 20px; background: #00509e; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 4px;">⬅ SPÄŤ NA ZOZNAM</button>
            
            <div class="detail-layout">
                <div class="detail-left">
                    <div class="char-avatar-block">
                        <div style="background-image: url('${char.image}'); height: 250px; background-size: cover; background-position: top center; border: 3px solid #1a3c61;"></div>
                        <h2 style="text-align: center; margin: 0; padding: 10px; background: #05264f; font-size: 18px; border-bottom: 3px solid #1a3c61;">${char.name}</h2>
                    </div>
                    
                    <div class="stats-grid">
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Health</span><br><b>${(stats.health || 0).toLocaleString()}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Speed</span><br><b>${stats.speed || 0}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Damage</span><br><b>${(stats.damage || 0).toLocaleString()}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Crit Chance</span><br><b>${stats.critChance || 0}%</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Armor</span><br><b>${(stats.armor || 0).toLocaleString()}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Crit Damage</span><br><b>${critDmg}%</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Focus</span><br><b>${(stats.focus || 0).toLocaleString()}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Accuracy</span><br><b>${stats.accuracy || 0}%</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Resistance</span><br><b>${(stats.resist || 0).toLocaleString()}</b></div>
                        <div><span style="color: #d18000; font-style: italic; font-weight: bold;">Block Amount</span><br><b>${stats.blockAmount || 0}%</b></div>
                    </div>
                </div>

                <div class="detail-right-container">
                    <div class="ability-icons-col">
                        ${['basic', 'special', 'ultimate', 'passive'].map(type => {
                            if (!abils[type] || !abils[type].icon) return '';
                            const isSelected = activeAbility === type;
                            return `<img src="${abils[type].icon}" class="ability-btn" data-type="${type}" style="width: 70px; height: 70px; cursor: pointer; border: ${isSelected ? '3px solid #f2a900' : '2px solid #333'}; border-radius: 4px; flex-shrink: 0;">`;
                        }).join("")}
                    </div>

                    <div class="ability-desc-col">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #1a3c61; padding-bottom: 10px; flex-shrink: 0; flex-wrap: wrap; gap: 10px;">
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
            </div>
        `;

        document.getElementById("backToList").addEventListener("click", () => {
            detailContainer.style.display = "none";
            container.style.display = ""; 
            if (searchInput) searchInput.style.display = "block";
            if (countElement) countElement.style.display = "block";
            if (modeWrapper) modeWrapper.style.display = "flex";
            
            // Po návrate zachováme korektný render podľa navoleného módu
            if (currentMode === "characters") renderCharacters(allCharacters);
            else searchInput.dispatchEvent(new Event('input'));
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

// Samostatné nezávislé odposluchy z Firebase na rovnakej úrovni
const charactersRef = ref(db, 'characters/');
onValue(charactersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        allCharacters = Object.values(data);
        if (currentMode === "characters") renderCharacters(allCharacters);
    } else {
        if (container && currentMode === "characters") container.innerHTML = "<p>Databáza postáv je prázdna.</p>";
    }
});

const countersRef = ref(db, 'counters/');
onValue(countersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        allCounters = Object.values(data);
    }
});

// Zjednotená logika pre vyhľadávacie pole na základe zvoleného módu
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (currentMode === "characters") {
            const filteredCharacters = allCharacters.filter(char => 
                char.name.toLowerCase().includes(searchTerm)
            );
            renderCharacters(filteredCharacters);
        } else {
            if (!searchTerm) {
                renderCounters([]);
                return;
            }
            
            const filteredCounters = allCounters.filter(item => {
                if (currentMode === "def") {
                    return item.defTeam && item.defTeam.toLowerCase().includes(searchTerm);
                } else if (currentMode === "atk") {
                    return item.atkTeam && item.atkTeam.toLowerCase().includes(searchTerm);
                } else if (currentMode === "char") {
                    const inDef = item.defChars && item.defChars.some(c => c.toLowerCase().includes(searchTerm));
                    const inAtk = item.atkChars && item.atkChars.some(c => c.toLowerCase().includes(searchTerm));
                    return inDef || inAtk;
                }
                return false;
            });
            renderCounters(filteredCounters);
        }
    });
}

const backToTopBtn = document.getElementById("backToTop");
window.onscroll = function() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        if(backToTopBtn) backToTopBtn.style.display = "block";
    } else {
        if(backToTopBtn) backToTopBtn.style.display = "none";
    }
};

if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}