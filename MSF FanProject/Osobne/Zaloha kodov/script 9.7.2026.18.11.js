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

// Injekcia responzívnych štýlov vrátane nových veľkostí portrétov
const responsiveStyle = document.createElement("style");
responsiveStyle.textContent = `
    #character-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: center;
        padding: 20px 0;
    }

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

    .counter-group {
        background: #0c1a30;
        border: 1px solid #1a3c61;
        border-radius: 8px;
        overflow: hidden;
        font-family: sans-serif;
        width: 100%;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transition: border-color 0.2s;
    }
    .counter-group:hover {
        border-color: #00509e;
    }
    .counter-header {
        background: #112544;
        padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;
        gap: 10px;
    }
    .counter-header:hover {
        background: #16305a;
    }
    .team-icons-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
    }
    
    /* Základný mobilný štýl pre mini portréty */
    .mini-char-click {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 50px;
        cursor: pointer;
    }
    .char-thumb {
        width: 42px;
        height: 42px;
        background-size: cover;
        background-position: top center;
        border: 2px solid #333;
        border-radius: 4px;
        background-color: #05264f;
    }
    .no-img-placeholder {
        font-size: 8px;
        display: block;
        text-align: center;
        padding-top: 14px;
        color: #556b85;
    }
    .char-name-label {
        font-size: 8px;
        color: #b0bec5;
        text-align: center;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        width: 100%;
        margin-top: 2px;
    }

    .counter-body {
        padding: 12px;
        background: #081226;
        display: none;
        border-top: 1px solid #1a3c61;
    }
    .counter-body.active {
        display: block;
    }
    .atk-row {
        display: flex;
        flex-direction: column;
        background: #0c1a30;
        border: 1px solid #1a3c61;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 4px;
        gap: 8px;
    }
    .match-note {
        font-size: 11px;
        color: #b0bec5;
        font-style: italic;
        background: #051329;
        padding: 6px 10px;
        border-left: 3px solid #00509e;
        margin-top: 4px;
        border-radius: 2px;
        line-height: 1.3;
    }
    .arrow-toggle {
        color: #ffcc00;
        font-size: 12px;
        font-weight: bold;
        margin-top: 5px;
    }

    @keyframes textGlow {
        0% { text-shadow: 0 0 0px rgba(255,204,0,0); }
        50% { text-shadow: 0 0 10px #ffcc00, 0 0 20px #ffcc00; color: white; }
        100% { text-shadow: 0 0 0px rgba(255,204,0,0); }
    }
    .glow-click {
        animation: textGlow 0.4s ease-out;
    }

    /* PC LAYOUT S ROZDIELNYMI VEĽKOSŤAMI PORTRÉTOV */
    @media (min-width: 769px) {
        .counter-group {
            width: calc(50% - 20px);
            max-width: 580px; 
        }

        /* OBRANNÉ TÍMY - 2x väčšie portréty */
        .def-char {
            width: 92px !important;
        }
        .def-char .char-thumb {
            width: 84px !important;
            height: 84px !important;
        }
        .def-char .char-name-label {
            font-size: 11px !important;
        }
        .def-char .no-img-placeholder {
            font-size: 16px !important;
            padding-top: 30px !important;
        }

        /* ÚTOČNÉ COUNTERY - o polovicu (1.5x) väčšie portréty */
        .atk-char {
            width: 70px !important;
        }
        .atk-char .char-thumb {
            width: 63px !important;
            height: 63px !important;
        }
        .atk-char .char-name-label {
            font-size: 10px !important;
        }
        .atk-char .no-img-placeholder {
            font-size: 12px !important;
            padding-top: 20px !important;
        }
    }

    @media (max-width: 768px) {
        .counter-group {
            max-width: 100%;
        }
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

// Vytvorenie globálneho plávajúceho tlačidla na spodku obrazovky
const globalStickyBtn = document.createElement("button");
globalStickyBtn.id = "global-sticky-close-btn";
globalStickyBtn.innerHTML = "▲ ZBALIŤ COUNTERY";
globalStickyBtn.style.cssText = `
    display: none;
    position: fixed;
    bottom: 25px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    padding: 12px 24px;
    background: #112544;
    color: #ffcc00;
    border: 2px solid #00509e;
    border-radius: 30px;
    cursor: pointer;
    font-weight: bold;
    font-size: 12px;
    text-transform: uppercase;
    box-shadow: 0 5px 25px rgba(0,0,0,0.6);
    transition: background 0.2s, transform 0.1s;
`;
globalStickyBtn.addEventListener("mouseover", () => globalStickyBtn.style.background = "#16305a");
globalStickyBtn.addEventListener("mouseout", () => globalStickyBtn.style.background = "#112544");
document.body.appendChild(globalStickyBtn);

const container = document.getElementById("character-container");
const searchInput = document.getElementById("searchInput");
const countElement = document.getElementById("character-count");

let currentMode = "characters"; 
const modeWrapper = document.createElement("div");
modeWrapper.className = "mode-container";
modeWrapper.innerHTML = `
    <button class="mode-tab active" data-mode="characters">POSTAVY</button>
    <button class="mode-tab" data-mode="def">🛡️ PROTI OBRANE (DEF)</button>
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

let allCharacters = [];
let allCounters = [];
let allTeams = {}; 

document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
        document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
        e.target.classList.add("active");
        
        currentMode = e.target.getAttribute("data-mode");
        if (searchInput) {
            searchInput.value = "";
            if (currentMode === "characters") searchInput.placeholder = "Vyhľadaj postavu podľa mena...";
            if (currentMode === "def") searchInput.placeholder = "Zadaj OBRANNÝ tím (nájde countery)...";
            if (currentMode === "atk") searchInput.placeholder = "Zadaj ÚTOČIACI tím (nájde čo porazí)...";
            if (currentMode === "char") searchInput.placeholder = "Zadaj meno hľadanej postavy v tímoch...";
        }
        
        if (currentMode === "characters") {
            renderCharacters(allCharacters);
        } else {
            renderCounters([]);
        }
    });
});

function renderCharacters(characters) {
    if (!container) return;
    container.style.display = "flex"; 
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

function renderCounters(counters) {
    if (!container) return;
    container.style.display = "flex";
    container.innerHTML = "";

    if (searchInput && searchInput.value.trim() === "") {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 20px; width: 100%;'>Začni písať pre vyhľadanie tímových counterov.</p>";
        if (countElement) countElement.innerText = "Počet nájdených skupín: 0";
        return;
    }

    if (!counters || counters.length === 0) {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 20px; width: 100%;'>Nenašli sa žiadne zodpovedajúce countery.</p>";
        if (countElement) countElement.innerText = "Počet nájdených skupín: 0";
        return;
    }

    const grouped = {};
    counters.forEach(item => {
        const defKey = item.defense;
        if (!defKey) return;
        
        const teamData = allTeams[defKey] || {};
        const defTeamName = teamData.name || defKey.toUpperCase();
        const defMembers = teamData.members || [];

        if (!grouped[defKey]) {
            grouped[defKey] = {
                defTeamName: defTeamName,
                defChars: defMembers,
                list: []
            };
        }
        grouped[defKey].list.push(item);
    });

    if (countElement) {
        countElement.innerText = "Počet nájdených obranných tímov: " + Object.keys(grouped).length;
    }

    const makeIconsHtml = (charNames, isAtk) => {
        return charNames.map(name => {
            const found = allCharacters.find(c => c.name && c.name.toLowerCase().trim() === name.toLowerCase().trim());
            const img = found ? found.image : '';
            const borderColor = isAtk ? '#00509e' : '#d18000';
            return `
                <div class="mini-char-click ${isAtk ? 'atk-char' : 'def-char'}" data-name="${name}" title="${name}">
                    <div class="char-thumb" style="background-image: url('${img}'); border-color: ${borderColor};">
                        ${!img ? `<span class="no-img-placeholder">?</span>` : ''}
                    </div>
                    <span class="char-name-label">${name}</span>
                </div>
            `;
        }).join("");
    };

    Object.values(grouped).forEach(group => {
        const groupWrapper = document.createElement("div");
        groupWrapper.className = "counter-group";
        
        const defIconsHtml = makeIconsHtml(group.defChars, false);

        let rowsHtml = group.list.map(item => {
            const offKey = item.offense;
            const offTeamData = allTeams[offKey] || {};
            const offTeamName = offTeamData.name || offKey.toUpperCase();
            const atkChars = offTeamData.members || [];
            
            const atkIconsHtml = makeIconsHtml(atkChars, true);
            
            const winVal = parseInt(item.winChance || item.sanceNaWin) || 0;
            const badgeColor = winVal >= 75 ? "#28a745" : (winVal >= 50 ? "#e67e22" : "#dc3545");
            const displayWin = item.winChance || item.sanceNaWin ? `${winVal}% WIN` : 'COUNTERS';
            
            const noteText = item.note || item.poznamka || "";
            const noteHtml = noteText ? `<div class="match-note"><b>Poznámka:</b> ${noteText}</div>` : '';

            return `
                <div class="atk-row">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1a3c61; padding-bottom: 5px;">
                        <span style="font-size: 11px; color: #4fc3f7; font-weight: bold; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;">⚔️ ${offTeamName}</span>
                        <div style="background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 10px;">
                            ${displayWin}
                        </div>
                    </div>
                    <div class="team-icons-row">
                        ${atkIconsHtml}
                    </div>
                    ${noteHtml}
                </div>
            `;
        }).join("");

        groupWrapper.innerHTML = `
            <div class="counter-header">
                <span style="color: #ffcc00; font-weight: bold; font-size: 15px; text-transform: uppercase;">${group.defTeamName}</span>
                <div class="team-icons-row" style="margin-top: 5px;">
                    ${defIconsHtml}
                </div>
                <div class="arrow-toggle">ROZBALIŤ COUNTERY ▼</div>
            </div>
            <div class="counter-body">
                <h4 style="margin: 0 0 10px 0; font-size: 10px; color: #8a9ba8; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Odporúčané útoky:</h4>
                ${rowsHtml}
                <button class="close-bottom-btn" style="width: 100%; margin-top: 15px; padding: 12px; background: #112544; color: #ffcc00; border: 1px solid #1a3c61; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px; text-transform: uppercase; transition: background 0.2s;">
                    ▲ ZBALIŤ COUNTERY
                </button>
            </div>
        `;

        const header = groupWrapper.querySelector(".counter-header");
        const body = groupWrapper.querySelector(".counter-body");
        const arrowToggle = header.querySelector(".arrow-toggle");
        const bottomCloseBtn = groupWrapper.querySelector(".close-bottom-btn");

        header.addEventListener("click", (e) => {
            if (e.target.closest(".mini-char-click")) return;
            
            arrowToggle.classList.add("glow-click");
            arrowToggle.addEventListener("animationend", () => {
                arrowToggle.classList.remove("glow-click");
            }, { once: true });
            
            const isOpen = body.classList.toggle("active");
            if (isOpen) {
                groupWrapper.classList.add("open");
                arrowToggle.innerText = "▲ ZBALIŤ COUNTERY";
            } else {
                groupWrapper.classList.remove("open");
                arrowToggle.innerText = "ROZBALIŤ COUNTERY ▼";
            }
            window.dispatchEvent(new Event('scroll')); 
        });

        if (bottomCloseBtn) {
            bottomCloseBtn.addEventListener("click", () => {
                body.classList.remove("active");
                groupWrapper.classList.remove("open");
                arrowToggle.innerText = "ROZBALIŤ COUNTERY ▼";
                globalStickyBtn.style.display = "none";
                groupWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        container.appendChild(groupWrapper);
    });

    document.querySelectorAll(".mini-char-click").forEach(el => {
        el.addEventListener("click", (e) => {
            const charName = e.currentTarget.getAttribute("data-name");
            const found = allCharacters.find(c => c.name && c.name.toLowerCase().trim() === charName.toLowerCase().trim());
            if (found) {
                showCharacterDetail(found);
            }
        });
    });
}

function showCharacterDetail(char) {
    // Vytvorenie fiktívneho bodu v histórii pre natívne tlačidlo späť
    history.pushState({ view: "detail" }, "");

    container.style.display = "none";
    if (searchInput) searchInput.style.display = "none";
    if (countElement) countElement.style.display = "none";
    if (modeWrapper) modeWrapper.style.display = "none";
    globalStickyBtn.style.display = "none";
    
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

        // Tlačidlo vyvolá natívny návrat v histórii prehliadača
        document.getElementById("backToList").addEventListener("click", () => {
            history.back();
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
        if (currentMode === "characters") renderCharacters(allCharacters);
    }
});

const teamsRef = ref(db, 'teams/');
onValue(teamsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        allTeams = data; 
    }
});

const countersRef = ref(db, 'counters/war/');
onValue(countersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        allCounters = Object.values(data);
    } else {
        allCounters = [];
    }
});

if (searchInput) {
    // Oprava klávesnice: Stlačením klávesu Enter stratí pole focus a schová sa virtuálna klávesnica
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            searchInput.blur();
        }
    });

    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (currentMode === "characters") {
            const filteredCharacters = allCharacters.filter(char => 
                char.name && char.name.toLowerCase().includes(searchTerm)
            );
            renderCharacters(filteredCharacters);
        } else {
            if (!searchTerm) {
                renderCounters([]);
                return;
            }
            
            const filteredCounters = allCounters.filter(item => {
                const defKey = item.defense || "";
                const offKey = item.offense || "";
                
                const defTeamData = allTeams[defKey] || {};
                const offTeamData = allTeams[offKey] || {};
                
                const defTeamName = (defTeamData.name || "").toLowerCase();
                const offTeamName = (offTeamData.name || "").toLowerCase();
                
                const defChars = (defTeamData.members || []).map(n => n.toLowerCase());
                const atkChars = (offTeamData.members || []).map(n => n.toLowerCase());

                if (currentMode === "def") {
                    return defTeamName.includes(searchTerm) || defKey.toLowerCase().includes(searchTerm);
                } else if (currentMode === "atk") {
                    return offTeamName.includes(searchTerm) || offKey.toLowerCase().includes(searchTerm);
                } else if (currentMode === "char") {
                    return defChars.some(name => name.includes(searchTerm)) || 
                           atkChars.some(name => name.includes(searchTerm));
                }
                return false;
            });
            renderCounters(filteredCounters);
        }
    });
}

// Spoločný scroll handler
const backToTopBtn = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        if(backToTopBtn) backToTopBtn.style.display = "block";
    } else {
        if(backToTopBtn) backToTopBtn.style.display = "none";
    }

    const openGroups = document.querySelectorAll(".counter-group.open");
    if (!globalStickyBtn) return;

    if (openGroups.length === 0 || detailContainer.style.display === "block") {
        globalStickyBtn.style.display = "none";
        return;
    }

    let currentlyActiveGroup = null;

    for (const group of openGroups) {
        const header = group.querySelector(".counter-header");
        const bottomBtn = group.querySelector(".close-bottom-btn");
        
        if (!header || !bottomBtn) continue;

        const headerRect = header.getBoundingClientRect();
        const bottomRect = bottomBtn.getBoundingClientRect();

        if (headerRect.bottom < 0 && bottomRect.top > window.innerHeight) {
            currentlyActiveGroup = group;
            break; 
        }
    }

    if (currentlyActiveGroup) {
        const header = currentlyActiveGroup.querySelector(".counter-header");
        const body = currentlyActiveGroup.querySelector(".counter-body");
        
        globalStickyBtn.style.display = "block";
        globalStickyBtn.onclick = () => {
            body.classList.remove("active");
            currentlyActiveGroup.classList.remove("open");
            const arrowToggle = header.querySelector(".arrow-toggle");
            if (arrowToggle) arrowToggle.innerText = "ROZBALIŤ COUNTERY ▼";
            globalStickyBtn.style.display = "none";
            currentlyActiveGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
    } else {
        globalStickyBtn.style.display = "none";
    }
});

// Listener pre hardvérové/prehliadačové tlačidlo SPÄŤ
window.addEventListener("popstate", () => {
    // Ak sa používateľ vracia späť a máme zobrazený detail, zavrieme ho a ukážeme pôvodné prostredie
    if (detailContainer && detailContainer.style.display === "block") {
        detailContainer.style.display = "none";
        container.style.display = "flex"; 
        if (searchInput) searchInput.style.display = "block";
        if (countElement) countElement.style.display = "block";
        if (modeWrapper) modeWrapper.style.display = "flex";
        
        if (currentMode === "characters") renderCharacters(allCharacters);
        else searchInput.dispatchEvent(new Event('input'));
    }
});

if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}