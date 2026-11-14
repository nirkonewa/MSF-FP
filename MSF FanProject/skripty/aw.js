import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, onValue, get, runTransaction } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

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

const container = document.getElementById("character-container");
const searchInput = document.getElementById("searchInput");
const countElement = document.getElementById("character-count");

let currentMode = "def"; // Predvolený mód pre vojnu (Defense)
let currentCategory = "war";
let countersListener = null;

// Vytvorenie výberu módov (DEF / ATK / PODĽA POSTAVY)
const modeWrapper = document.createElement("div");
modeWrapper.className = "mode-container";
modeWrapper.innerHTML = `
    <select id="mainModeSelect" class="mode-select">
        <option value="def" selected>🛡️ PROTI OBRANE (DEF)</option>
        <option value="atk">⚔️ ÚČINNÝ ÚTOK (ATK)</option>
        <option value="char">PODĽA POSTAVY V TÍME</option>
    </select>
`;

const datalistEl = document.createElement("datalist");
datalistEl.id = "search-suggestions";
document.body.appendChild(datalistEl);

let currentViewType = "icons"; 
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

// Inicializácia pri načítaní DOM
// Definujeme si inicializačnú funkciu
function initAw() {
    const container = document.getElementById("character-container");
    const countElement = document.getElementById("character-count");

    if (container && countElement) {
        const parent = container.parentNode;
        
        // Skontrolujeme, či datalist už existuje, ak nie, vytvoríme ho
        let datalistEl = document.getElementById("search-suggestions");
        if (!datalistEl) {
            datalistEl = document.createElement("datalist");
            datalistEl.id = "search-suggestions";
            document.body.appendChild(datalistEl);
        }

        // Ak searchRow ešte nie je v DOM, vložte ho pred container
        if (!document.querySelector(".search-row")) {
            parent.insertBefore(searchRow, container); 
            parent.insertBefore(countElement, container);
            parent.insertBefore(detailContainer, container);
        }
        
        // Vyhľadávacie políčko
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
        
        // Odstránime starý listener (ak existoval) a pridáme nový, aby sa nevojdili duplicitne
        sInput.removeEventListener("input", handleSearchInput);
        sInput.addEventListener("input", handleSearchInput);
    }
    
    initDataSequential();
}

// Zverejnimo funkciu globálne, aby ju Menu.js mohlo spustiť kedykoľvek
window.initAw = initAw;

// Spustenie pri prvom načítaní
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAw);
} else {
    initAw();
}

let allCharacters = [];
let allCounters = [];
let allTeams = {}; 

// Zmena módu vyhľadávania
document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "mainModeSelect") {
        currentMode = e.target.value;
        const sInput = document.getElementById("searchInput");
        
        updateSearchSuggestions(); 
        if (sInput) {
            sInput.value = "";
            const place = {
                "def": "Zadaj OBRANNÝ tím (nájde countery)...",
                "atk": "Zadaj ÚTOČIACI tím (nájde čo porazí)...",
                "char": "Zadaj meno hľadanej postavy v tímoch..."
            };
            sInput.placeholder = place[currentMode] || "Vyhľadávanie...";
            if (container) container.innerHTML = "";
            renderCounters([]);
        }
    }
});

// Prepínanie medzi ikonami a textom
document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        viewTypeWrapper.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        currentViewType = e.target.getAttribute("data-view");
        
        const sInput = document.getElementById("searchInput");
        if (sInput && sInput.value.trim() !== "") {
            sInput.dispatchEvent(new Event('input'));
        }
    });
});

// Vykresľovanie counterov pre vojnu
function renderCounters(counters) {
    if (!container) return;
    
    container.style.display = "flex";
    container.innerHTML = "";

    const sInput = document.getElementById("searchInput");
    if (sInput && sInput.value.trim() === "") {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 10px; width: 100%;'>Začni písať pre vyhľadanie tímových counterov vo vojne.</p>";
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
        const primaryKey = isAtkMode ? item.offense : item.defense;
        if (!primaryKey) return;
        
        const teamData = allTeams[primaryKey] || {};
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
            const secondaryKey = isAtkMode ? item.defense : item.offense;
            const secondaryTeamData = allTeams[secondaryKey] || {};
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
        const defTeamData = allTeams[item.defense] || {};
        const offTeamData = allTeams[item.offense] || {};
        const defChars = (defTeamData.members || []).map(n => n.toLowerCase());
        const atkChars = (offTeamData.members || []).map(n => n.toLowerCase());

        if (currentMode === "def") return (defTeamData.name || "").toLowerCase().includes(searchTerm) || (item.defense || "").toLowerCase().includes(searchTerm);
        if (currentMode === "atk") return (offTeamData.name || "").toLowerCase().includes(searchTerm) || (item.offense || "").toLowerCase().includes(searchTerm);
        if (currentMode === "char") return defChars.some(n => n.includes(searchTerm)) || atkChars.some(n => n.includes(searchTerm));
        
        return false;
    }));
}

// Načítanie dát z Firebase
async function initDataSequential() {
    try {
        const charsSnap = await get(ref(db, 'characters/'));
        if (charsSnap.exists()) allCharacters = Object.values(charsSnap.val());
        
        const teamsSnap = await get(ref(db, 'teams/'));
        if (teamsSnap.exists()) allTeams = teamsSnap.val();
        
        // Sledovanie counterov špecificky pre vojnu (war)
        onValue(ref(db, 'counters/war/'), (snapshot) => {
            const data = snapshot.val();
            allCounters = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
            updateSearchSuggestions();
        });
    } catch (error) { 
        console.error("Chyba pri načítatí dát:", error); 
    }
}

// Aktualizácia nápovedy (datalist)
function updateSearchSuggestions() {
    const list = document.getElementById("search-suggestions");
    if (!list) return;
    
    let options = [];
    if (currentMode === "def") {
        options = [...new Set(allCounters.map(item => allTeams[item.defense]?.name || item.defense).filter(Boolean))];
    } else if (currentMode === "atk") {
        options = [...new Set(allCounters.map(item => allTeams[item.offense]?.name || item.offense).filter(Boolean))];
    } else if (currentMode === "char") {
        options = allCharacters.map(c => c.name);
    }

    list.innerHTML = options.sort().map(opt => `<option value="${opt}">`).join("");
}