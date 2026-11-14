import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

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
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence);

let currentMode = "def"; 
let currentCategory = "crucible";
let currentViewType = "icons"; 

let allCharacters = [];
let allCounters = [];
let allTeams = {}; 

// Prísne čítanie len čistých Crucible polí (ignorujeme akékoľvek war varianty)
function getOffense(item) {
    if (!item) return "";
    return item.offense || item.attacker || item.attack || item.team || "";
}

function getDefense(item) {
    if (!item) return "";
    return item.defense || item.defender || item.target || item.counter || "";
}

// Pomocná funkcia na bezpečné získanie dát tímu
function getTeamData(keyOrName) {
    if (!keyOrName) return { name: "", members: [] };
    if (allTeams[keyOrName]) return allTeams[keyOrName];
    
    const foundKey = Object.keys(allTeams).find(k => {
        const t = allTeams[k];
        return (t.name && t.name.toLowerCase() === keyOrName.toLowerCase()) || k.toLowerCase() === keyOrName.toLowerCase();
    });
    if (foundKey) return allTeams[foundKey];
    
    return { name: keyOrName, members: [] };
}

// Vytvorenie elementov pre rozhranie
const modeWrapper = document.createElement("div");
modeWrapper.className = "mode-container";
modeWrapper.innerHTML = `
    <select id="mainModeSelect" class="mode-select">
        <option value="def" selected>🛡️ PROTI OBRANE (DEF)</option>
        <option value="atk">⚔️ ÚČINNÝ ÚTOK (ATK)</option>
        <option value="char">PODĽA POSTAVY V TÍME</option>
        <option value="sim6">🎲 SIMULÁCIA 6 TÍMOV</option>
    </select>
`;

const datalistEl = document.createElement("datalist");
datalistEl.id = "search-suggestions";
if (!document.getElementById("search-suggestions")) {
    document.body.appendChild(datalistEl);
}

const viewTypeWrapper = document.createElement("div");
viewTypeWrapper.className = "view-type-container";
viewTypeWrapper.innerHTML = `
    <button class="view-btn active" data-view="icons">IKONY</button>
    <button class="view-btn" data-view="text">TEXT</button>
`;

const searchRow = document.createElement("div");
searchRow.className = "search-row";

let detailContainer = document.createElement("div");
detailContainer.id = "detail-container";
detailContainer.style.display = "none";

// Inicializácia pri načítaní / AJAX vložení
function initAw() {
    const container = document.getElementById("character-container");
    const countElement = document.getElementById("character-count");

    if (container && countElement) {
        const parent = container.parentNode;
        
        if (!document.querySelector(".search-row")) {
            parent.insertBefore(searchRow, container); 
            parent.insertBefore(countElement, container);
            parent.insertBefore(detailContainer, container);
        }
        
        let sInput = document.getElementById("searchInput");
        if (!sInput) {
            sInput = document.createElement("input");
            sInput.type = "text";
            sInput.id = "searchInput";
            sInput.className = "search-bar";
            sInput.placeholder = "Zadaj OBRANNÝ tím (nájde countery)...";
        }
        
        if (!searchRow.contains(sInput)) {
            searchRow.appendChild(modeWrapper); 
            searchRow.appendChild(sInput); 
            searchRow.appendChild(viewTypeWrapper);
        }
        
        sInput.setAttribute("list", "search-suggestions");
        sInput.setAttribute("autocomplete", "off");
        
        sInput.removeEventListener("input", handleSearchInput);
        sInput.addEventListener("input", handleSearchInput);
    }
    
    initDataSequential();
}

window.initAw = initAw;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAw);
} else {
    initAw();
}

// Zmena módu vyhľadávania / zobrazenia
document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "mainModeSelect") {
        currentMode = e.target.value;
        const sInput = document.getElementById("searchInput");
        const plannerSec = document.getElementById("crucible-planner");
        const charContainer = document.getElementById("character-container");
        const countEl = document.getElementById("character-count");
        
        if (currentMode === "sim6") {
            if (plannerSec) plannerSec.style.display = "block";
            if (charContainer) charContainer.style.display = "none";
            if (searchRow) searchRow.style.display = "none";
            if (countEl) countEl.style.display = "none";
        } else {
            if (plannerSec) plannerSec.style.display = "none";
            if (charContainer) charContainer.style.display = "flex";
            if (searchRow) searchRow.style.display = "flex";
            if (countEl) countEl.style.display = "block";
            
            updateSearchSuggestions(); 
            if (sInput) {
                sInput.value = "";
                const place = {
                    "def": "Zadaj OBRANNÝ tím (nájde countery)...",
                    "atk": "Zadaj ÚTOČIACI tím (nájde čo porazí)...",
                    "char": "Zadaj meno hľadanej postavy v tímoch..."
                };
                sInput.placeholder = place[currentMode] || "Vyhľadávanie...";
                if (charContainer) charContainer.innerHTML = "";
                renderCounters([]);
            }
        }
    }
});

// Prepínanie medzi ikonami a textom
document.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("view-btn")) {
        const parentContainer = e.target.closest(".view-type-container");
        if (parentContainer) {
            parentContainer.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
        }
        e.target.classList.add("active");
        currentViewType = e.target.getAttribute("data-view");
        
        const sInput = document.getElementById("searchInput");
        if (sInput && sInput.value.trim() !== "") {
            sInput.dispatchEvent(new Event('input'));
        }
    }
});

// Vykresľovanie counterov
function renderCounters(counters) {
    const container = document.getElementById("character-container");
    const countElement = document.getElementById("character-count");
    if (!container) return;
    
    container.style.display = "flex";
    container.innerHTML = "";

    const sInput = document.getElementById("searchInput");
    if (sInput && sInput.value.trim() === "") {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 10px; width: 100%;'>Začni písať pre vyhľadanie tímových counterov.</p>";
        if (countElement) countElement.innerText = "Počet nájdených skupín: 0";
        return;
    }

    if (!counters || counters.length === 0) {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 10px; width: 100%;'>Nenašli sa žiadne zodpovedajúce countery.</p>";
        if (countElement) countElement.innerText = "Počet nájdených skupín: 0";
        return;
    }

    const isAtkMode = (currentMode === "atk");
    const grouped = {};

    counters.forEach(item => {
        const primaryKey = isAtkMode ? getOffense(item) : getDefense(item);
        if (!primaryKey) return;
        
        const teamData = getTeamData(primaryKey);
        const primaryTeamName = teamData.name || primaryKey.toUpperCase();
        const primaryMembers = teamData.members || [];

        if (!grouped[primaryKey]) {
            grouped[primaryKey] = {
                key: primaryKey,
                teamName: primaryTeamName,
                members: primaryMembers,
                list: []
            };
        }
        grouped[primaryKey].list.push(item);
    });

    if (countElement) {
        countElement.innerText = isAtkMode 
            ? "Počet nájdených útočných tímov: " + Object.keys(grouped).length
            : "Počet nájdených obranných tímov: " + Object.keys(grouped).length;
    }

    const makeIconsHtml = (charNames, isAtk, sizeClass) => {
        return charNames.map(name => {
            const found = allCharacters.find(c => c.name && c.name.toLowerCase().trim() === name.toLowerCase().trim());
            const img = found ? found.image : '';
            const borderColor = isAtk ? '#00509e' : '#d18000';
            return `
                <div class="mini-char-click ${sizeClass}" title="${name}">
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
        groupWrapper.className = "counter-group" + (currentViewType === "text" ? " text-view-mode" : "");
        
        let headerHtml = `
            <span style="color: ${isAtkMode ? '#4fc3f7' : '#ffcc00'}; font-weight: bold; font-size: 15px; text-transform: uppercase;">
                ${isAtkMode ? '⚔️ ' : '🛡️ '}${group.teamName}
            </span>
            <div class="team-icons-row" style="margin-top: 5px; width: 100%;">
                ${makeIconsHtml(group.members, isAtkMode, "char-size-76")}
            </div>
            <div class="arrow-toggle">ROZBALIŤ COUNTERY ▼</div>
        `;

        let rowsHtml = group.list.map(item => {
            const secondaryKey = isAtkMode ? getDefense(item) : getOffense(item);
            const secondaryTeamData = getTeamData(secondaryKey);
            const secondaryTeamName = secondaryTeamData.name || secondaryKey.toUpperCase();
            const secondaryMembers = secondaryTeamData.members || [];
            const rowIconsHtml = makeIconsHtml(secondaryMembers, !isAtkMode, "char-size-52");
            
            const noteText = item.note || item.poznamka || "";
            const noteHtml = noteText ? `<div class="match-note"><b>Poznámka:</b> ${noteText}</div>` : '';

            return `
                <div class="atk-row">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1a3c61; padding-bottom: 5px;">
                        <span style="font-size: 11px; color: ${isAtkMode ? '#ffcc00' : '#4fc3f7'}; font-weight: bold; text-transform: uppercase;">
                            ${isAtkMode ? '🛡️ ' : '⚔️ '}${secondaryTeamName}
                        </span>
                    </div>
                    <div class="team-icons-row">${rowIconsHtml}</div>
                    ${noteHtml}
                </div>
            `;
        }).join("");

        groupWrapper.innerHTML = `
            <div class="counter-header">${headerHtml}</div>
            <div class="counter-body">
                <h4 style="margin: 0 0 10px 0; font-size: 10px; color: #8a9ba8; text-transform: uppercase; text-align: center;">
                    ${isAtkMode ? 'Porazí tieto obrany:' : 'Odporúčané útoky:'}
                </h4>
                ${rowsHtml}
            </div>
        `;

        const header = groupWrapper.querySelector(".counter-header");
        const body = groupWrapper.querySelector(".counter-body");

        header.addEventListener("click", () => {
            const isOpenNow = body.classList.toggle("active");
            groupWrapper.classList.toggle("open");
            const arrowToggle = header.querySelector(".arrow-toggle");
            if (arrowToggle) arrowToggle.innerText = isOpenNow ? "▲ ZBALIŤ COUNTERY" : "ROZBALIŤ COUNTERY ▼";
        });

        container.appendChild(groupWrapper);
    });
}

// Logika vyhľadávania
function handleSearchInput(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    if (!searchTerm) { 
        renderCounters([]); 
        return; 
    }
    
    renderCounters(allCounters.filter(item => {
        const defKey = getDefense(item);
        const offKey = getOffense(item);
        const defTeamData = getTeamData(defKey);
        const offTeamData = getTeamData(offKey);
        const defName = (defTeamData.name || defKey || "").toLowerCase();
        const offName = (offTeamData.name || offKey || "").toLowerCase();
        
        const defChars = (defTeamData.members || []).map(n => n.toLowerCase());
        const atkChars = (offTeamData.members || []).map(n => n.toLowerCase());

        if (currentMode === "def") return defName.includes(searchTerm) || defKey.toLowerCase().includes(searchTerm);
        if (currentMode === "atk") return offName.includes(searchTerm) || offKey.toLowerCase().includes(searchTerm);
        if (currentMode === "char") return defChars.some(n => n.includes(searchTerm)) || atkChars.some(n => n.includes(searchTerm));
        
        return false;
    }));
}

// Načítanie dát z Firebase s prísnym filtrom proti War dátam
async function initDataSequential() {
    try {
        const charsSnap = await get(ref(db, 'characters/'));
        if (charsSnap.exists()) allCharacters = Object.values(charsSnap.val());
        
        const teamsSnap = await get(ref(db, 'teams/'));
        if (teamsSnap.exists()) allTeams = teamsSnap.val();
        
        onValue(ref(db, 'counters/crucible/'), (snapshot) => {
            const data = snapshot.val();
            allCounters = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })).filter(item => {
                const mode = (item.mode || item.category || item.gameMode || item.type || item.game || "").toLowerCase();
                // Ak je záznam označený ako war, okamžite ho vyhodíme
                if (mode.includes('war')) return false;
                return true;
            }) : [];
            updateSearchSuggestions();
        });
    } catch (error) { 
        console.error("Chyba pri načítatí dát:", error); 
    }
}

// Aktualizácia nápovedy (datalist)
function updateSearchSuggestions(modeOverride) {
    const list = document.getElementById("search-suggestions");
    if (!list) return;
    
    const mode = modeOverride || currentMode;
    let options = [];
    if (mode === "def" || mode === "sim6") {
        options = [...new Set(allCounters.map(item => getTeamData(getDefense(item)).name || getDefense(item)).filter(Boolean))];
    } else if (mode === "atk") {
        options = [...new Set(allCounters.map(item => getTeamData(getOffense(item)).name || getOffense(item)).filter(Boolean))];
    } else if (mode === "char") {
        options = allCharacters.map(c => c.name);
    }

    list.innerHTML = options.sort().map(opt => `<option value="${opt}">`).join("");
}

// ==========================================
// --- COSMIC CRUCIBLE PLANNER MODUL + MODÁL ---
// ==========================================

function sim6(a, b) {
    const ezA = a.ezCount || 0;
    const ezB = b.ezCount || 0;
    if (ezB !== ezA) return ezB - ezA; 

    const okA = a.okCount || 0;
    const okB = b.okCount || 0;
    if (okB !== okA) return okB - okA;

    return 0;
}

const ccStyle = document.createElement("style");
ccStyle.textContent = `
    #crucible-planner { display: none; padding: 20px; max-width: 1200px; margin: 0 auto; }
    .cc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
    .cc-node { background: #081226; border: 1px solid #1a3c61; padding: 15px; border-radius: 8px; }
    .cc-node h3 { color: #00d2ff; margin-top: 0; margin-bottom: 10px; font-size: 14px; text-align: center; }
    .cc-input { width: 100%; padding: 8px; margin-bottom: 10px; background: #051329; border: 1px solid #00509e; color: white; border-radius: 4px; box-sizing: border-box;}
    .cc-counter-list { max-height: 150px; overflow-y: auto; font-size: 12px; background: #0c1a30; padding: 5px; border-radius: 4px;}
    .cc-counter-item { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; padding: 5px; border-bottom: 1px solid #1a3c61; }
    .cc-counter-item:last-child { border-bottom: none; }
    .cc-counter-item input[type="checkbox"] { cursor: pointer; }
    #cc-results { margin-top: 20px; padding: 15px; background: #051329; border: 2px solid #ffcc00; border-radius: 8px; display: none; }
    .cc-result-row { padding: 10px; border-bottom: 1px dashed #1a3c61; display: flex; justify-content: space-between; align-items: center;}
    .cc-result-row:last-child { border-bottom: none; }

    #char-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; justify-content: center; align-items: center; }
    .char-modal-content { background: #081226; border: 2px solid #00509e; padding: 20px; width: 90%; max-width: 900px; max-height: 85vh; overflow-y: auto; border-radius: 8px; display: flex; flex-direction: column; box-sizing: border-box; }
    .char-grid-modal { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; margin-top: 15px; }
    .modal-char-item { cursor: pointer; text-align: center; position: relative; display: flex; flex-direction: column; align-items: center; }
    .modal-char-item .char-thumb { width: 60px; height: 60px; border: 2px solid #333; border-radius: 4px; background-size: cover; background-position: top center; background-color: #05264f; transition: all 0.2s; }
    .modal-char-item.unavailable .char-thumb { filter: grayscale(100%) brightness(0.3); border-color: #e74c3c !important; }
    .modal-char-item.unavailable::after { content: '❌'; position: absolute; top: 15px; font-size: 20px; }
    .modal-char-name { font-size: 9px; color: #b0bec5; margin-top: 2px; word-break: break-word; width: 100%; }
`;
document.head.appendChild(ccStyle);

const ccHTML = `
    <section id="crucible-planner">
        <h2 style="text-align: center; color: #ffcc00; margin-bottom: 10px;">CRUCIBLE PLANNER (BETA)</h2>
        <div style="text-align: center; margin-bottom: 20px;">
            <button id="open-char-modal-btn" class="view-btn active" style="padding: 6px 14px; font-size: 12px; background: #112544;">🚫 Spravovať nedostupné postavy</button>
        </div>
        <div class="cc-grid" id="cc-nodes-container"></div>
        <div style="text-align: center; margin-top: 20px;">
            <button id="cc-calc-btn" class="cta-btn">VYPOČÍTAŤ UNIKÁTNE COUNTERY</button>
        </div>
        <div id="cc-results"></div>
    </section>

    <div id="char-modal">
        <div class="char-modal-content">
            <h3 style="color: #ffcc00; text-align: center; margin-top: 0;">KLIKNUTÍM OZNAČ POSTAVY, KTORÉ NEMÁŠ ALEBO SÚ SLABÉ</h3>
            <p style="color: #8a9ba8; text-align: center; font-size: 12px; margin-bottom: 15px;">Vybrané postavy budú automaticky vylúčené zo všetkých tímov v simulačnom planneri.</p>
            <input type="text" id="modal-char-search" placeholder="Filtrovať postavy..." style="width: 100%; padding: 8px; background: #051329; border: 1px solid #1a3c61; color: white; border-radius: 4px; box-sizing: border-box;">
            <div class="char-grid-modal" id="modal-char-grid"></div>
            <div style="text-align: right; margin-top: 20px;">
                <button id="close-char-modal-btn" class="view-btn active" style="padding: 8px 20px;">Uložiť a zavrieť</button>
            </div>
        </div>
    </div>
`;

const rosterSection = document.querySelector(".roster-section");
if (rosterSection) {
    rosterSection.insertAdjacentHTML("afterend", ccHTML);
} else {
    document.body.insertAdjacentHTML("beforeend", ccHTML);
}

const ccNodesContainer = document.getElementById("cc-nodes-container");
const ccCalcBtn = document.getElementById("cc-calc-btn");
const ccResults = document.getElementById("cc-results");

const charModal = document.getElementById("char-modal");
const openModalBtn = document.getElementById("open-char-modal-btn");
const closeModalBtn = document.getElementById("close-char-modal-btn");
const modalCharGrid = document.getElementById("modal-char-grid");
const modalCharSearch = document.getElementById("modal-char-search");

function getUnavailableChars() {
    try {
        return JSON.parse(localStorage.getItem("sim6_unavailable_chars") || "[]");
    } catch(e) { return []; }
}

function saveUnavailableChars(arr) {
    localStorage.setItem("sim6_unavailable_chars", JSON.stringify(arr));
}

if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
        charModal.style.display = "flex";
        renderModalCharacters(allCharacters);
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        charModal.style.display = "none";
    });
}

if (modalCharSearch) {
    modalCharSearch.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = allCharacters.filter(c => c.name.toLowerCase().includes(term));
        renderModalCharacters(filtered);
    });
}

function renderModalCharacters(chars) {
    if (!modalCharGrid) return;
    modalCharGrid.innerHTML = "";
    const unavailable = getUnavailableChars();

    chars.forEach(char => {
        const isUnavail = unavailable.includes(char.name);
        const item = document.createElement("div");
        item.className = `modal-char-item ${isUnavail ? 'unavailable' : ''}`;
        item.innerHTML = `
            <div class="char-thumb" style="background-image: url('${char.image}');"></div>
            <span class="modal-char-name">${char.name}</span>
        `;
        item.addEventListener("click", () => {
            let current = getUnavailableChars();
            if (current.includes(char.name)) {
                current = current.filter(n => n !== char.name);
                item.classList.remove("unavailable");
            } else {
                current.push(char.name);
                item.classList.add("unavailable");
            }
            saveUnavailableChars(current);
        });
        modalCharGrid.appendChild(item);
    });
}

if (ccNodesContainer) {
    for (let i = 1; i <= 6; i++) {
        const nodeDiv = document.createElement("div");
        nodeDiv.className = "cc-node";
        nodeDiv.innerHTML = `
            <h3>Miestnosť ${i}</h3>
            <input type="text" class="cc-input" id="cc-def-${i}" placeholder="Zadaj obranu (napr. x-men)..." list="search-suggestions" autocomplete="off">
            <div class="cc-counter-list" id="cc-list-${i}">
                <p style="color:#556b85; text-align:center; font-style:italic;">Zadaj tím pre zobrazenie možností</p>
            </div>
        `;
        ccNodesContainer.appendChild(nodeDiv);

        const inputEl = document.getElementById(`cc-def-${i}`);
        const listEl = document.getElementById(`cc-list-${i}`);
        
        inputEl.addEventListener("focus", () => {
            const list = document.getElementById("search-suggestions");
            if (list && list.children.length === 0) {
                updateSearchSuggestions("sim6");
            }
        });

        inputEl.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase().trim();
            listEl.innerHTML = "";
            
            if (term.length < 2) {
                listEl.innerHTML = `<p style="color:#556b85; text-align:center;">Zadaj tím...</p>`;
                return;
            }

            const unavailable = getUnavailableChars();
            const foundCounters = allCounters.filter(c => {
                const defKey = getDefense(c);
                const teamData = getTeamData(defKey);
                const defTeam = (teamData.name || defKey || "").toLowerCase();
                return defTeam === term || defTeam.includes(term);
            });

            if (foundCounters.length === 0) {
                listEl.innerHTML = `<p style="color:#e74c3c; text-align:center;">Žiadny counter nenájdený.</p>`;
                return;
            }

            let validCount = 0;
            foundCounters.forEach(counter => {
                const atkKey = getOffense(counter);
                const atkTeamData = getTeamData(atkKey);
                const atkTeamName = atkTeamData.name || atkKey;
                const atkMembers = atkTeamData.members || [];

                const hasUnavailableChar = atkMembers.some(m => unavailable.includes(m));
                const disabledAttr = hasUnavailableChar ? 'disabled' : 'checked';
                const styleExtra = hasUnavailableChar ? 'opacity: 0.5; color: #e74c3c;' : '';

                const div = document.createElement("div");
                div.className = "cc-counter-item";
                div.style.cssText = styleExtra;
                div.innerHTML = `
                    <input type="checkbox" ${disabledAttr} data-offense="${atkKey}">
                    <span><b>${atkTeamName}</b> ${hasUnavailableChar ? '(obsahuje chýbajúcu postavu)' : ''}</span>
                `;
                listEl.appendChild(div);
                validCount++;
            });

            if (validCount === 0) {
                listEl.innerHTML = `<p style="color:#e74c3c; text-align:center;">Všetky countery obsahujú chýbajúce postavy.</p>`;
            }
        });
    }
}

if (ccCalcBtn) {
    ccCalcBtn.addEventListener("click", () => {
        const rooms = [];
        const unavailable = getUnavailableChars();

        function roomsDefKey(roomNum) {
            const defVal = document.getElementById(`cc-def-${roomNum}`).value.toLowerCase().trim();
            if (!defVal) return null;
            const found = allCounters.find(c => {
                const defKey = getDefense(c);
                const teamData = getTeamData(defKey);
                const name = (teamData.name || defKey || "").toLowerCase();
                return name === defVal || name.includes(defVal) || defKey.toLowerCase() === defVal;
            });
            return found ? getDefense(found) : null;
        }

        for (let i = 1; i <= 6; i++) {
            const defName = document.getElementById(`cc-def-${i}`).value;
            const checkedBoxes = document.querySelectorAll(`#cc-list-${i} input[type="checkbox"]:checked`);
            const defKey = roomsDefKey(i);
            
            const allowedOffenses = Array.from(checkedBoxes).map(cb => {
                const atkKey = cb.getAttribute("data-offense");
                const counterObj = allCounters.find(c => (!defKey || getDefense(c) === defKey) && getOffense(c) === atkKey) || 
                                   allCounters.find(c => getOffense(c) === atkKey);
                return { 
                    offense: atkKey, 
                    ezCount: counterObj?.votes?.ez || 0,
                    okCount: counterObj?.votes?.ok || 0
                };
            }).filter(opt => {
                const members = getTeamData(opt.offense).members || [];
                return !members.some(m => unavailable.includes(m));
            });

            allowedOffenses.sort(sim6);
            
            rooms.push({
                roomNum: i,
                defense: defName || "Nezadané",
                options: allowedOffenses
            });
        }

        ccResults.style.display = "block";
        ccResults.innerHTML = "<h3 style='color:#00d2ff; text-align:center;'>VÝSLEDKY (UNIKÁTNE KOMBINÁCIE):</h3>";

        let uniqueSolutions = [];

        function findUniqueSolutions(roomIndex, usedCharacters, currentAssignment) {
            if (uniqueSolutions.length >= 3) return;

            if (roomIndex === 6) {
                uniqueSolutions.push([...currentAssignment]);
                return;
            }

            const room = rooms[roomIndex];
            if (room.options.length === 0) {
                currentAssignment.push({ roomNum: room.roomNum, atk: null, conflicts: ["Žiadna dostupná možnosť"] });
                findUniqueSolutions(roomIndex + 1, usedCharacters, currentAssignment);
                currentAssignment.pop();
                return;
            }

            for (let opt of room.options) {
                const atkKey = opt.offense;
                const atkMembers = getTeamData(atkKey).members || [];
                const hasConflict = atkMembers.some(char => usedCharacters.has(char));
                
                if (!hasConflict) {
                    atkMembers.forEach(char => usedCharacters.add(char));
                    currentAssignment.push({ roomNum: room.roomNum, atk: atkKey, conflicts: [] });
                    
                    findUniqueSolutions(roomIndex + 1, usedCharacters, currentAssignment);
                    
                    currentAssignment.pop();
                    atkMembers.forEach(char => usedCharacters.delete(char));
                }
            }
        }

        findUniqueSolutions(0, new Set(), []);

        if (uniqueSolutions.length === 0) {
            let fallbackAssignment = [];
            let usedCharsFallback = new Set();

            rooms.forEach(room => {
                if (room.options.length === 0) {
                    fallbackAssignment.push({ roomNum: room.roomNum, atk: null, conflicts: ["Žiadna dostupná možnosť"] });
                    return;
                }

                const bestOpt = room.options[0];
                const atkKey = bestOpt.offense;
                const atkMembers = getTeamData(atkKey).members || [];
                
                let currentConflicts = [];
                atkMembers.forEach(char => {
                    if (usedCharsFallback.has(char)) {
                        currentConflicts.push(char);
                    } else {
                        usedCharsFallback.add(char);
                    }
                });

                fallbackAssignment.push({ roomNum: room.roomNum, atk: atkKey, conflicts: currentConflicts });
            });

            uniqueSolutions.push(fallbackAssignment);
            ccResults.innerHTML += `<p style="color:#f39c12; text-align:center; font-size:13px; margin-bottom:15px;">⚠️ Nenašla sa 100% čistá unikátna kombinácia. Tu je najlepšia dostupná voľba:</p>`;
        }

        uniqueSolutions.forEach((solution, sIndex) => {
            if (uniqueSolutions.length > 1) {
                ccResults.innerHTML += `<div style="margin-top: 15px; border-top: 1px solid #00509e; padding-top: 10px;"><strong style="color: #ffcc00;">Možnosť ${sIndex + 1}:</strong></div>`;
            }

            solution.forEach(sol => {
                if (!sol.atk) {
                    ccResults.innerHTML += `
                        <div class="cc-result-row">
                            <span style="color:#a0aec0;">Miestnosť ${sol.roomNum} (Def: ${rooms[sol.roomNum-1].defense}):</span>
                            <span style="color:#e74c3c; font-weight:bold;">ŽIADNA MOŽNOSŤ</span>
                        </div>
                    `;
                    return;
                }

                const atkTeamName = getTeamData(sol.atk).name || sol.atk;
                let conflictText = "";
                if (sol.conflicts && sol.conflicts.length > 0) {
                    conflictText = `<br><span style="color:#e74c3c; font-size:11px;">⚠️ Kryje sa postava/y: ${sol.conflicts.join(", ")}</span>`;
                }

                ccResults.innerHTML += `
                    <div class="cc-result-row">
                        <span style="color:#a0aec0;">Miestnosť ${sol.roomNum} (Def: ${rooms[sol.roomNum-1].defense}):</span>
                        <div style="text-align: right;">
                            <span style="color:#2ecc71; font-weight:bold;">${atkTeamName}</span>
                            ${conflictText}
                        </div>
                    </div>
                `;
            });
        });
    });
}