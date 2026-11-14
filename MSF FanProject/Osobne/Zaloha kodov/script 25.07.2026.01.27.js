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

// Nastavenie perzistencie
setPersistence(auth, browserLocalPersistence);

// --- SLEDOVANIE STAVU PRIHLÁSENIA ---
onAuthStateChanged(auth, (user) => {
    const loginForm = document.getElementById("login-form");
    const adminPanel = document.getElementById("admin-panel");

    if (user) {
        console.log("✅ Prihlásený ako:", user.email);
        if (loginForm) loginForm.style.display = "none";
        if (adminPanel) adminPanel.style.display = "block";
    } else {
        console.log("❌ Odhlásený");
        if (loginForm) loginForm.style.display = "block";
        if (adminPanel) adminPanel.style.display = "none";
    }
});

// --- OŠETRENIE FORMULÁRA ---
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("⚙️ Kliknuté na prihlásenie, spracovávam...");
        
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("🚀 Prihlásenie úspešné!");
            })
            .catch((error) => {
                console.error("🚨 Chyba prihlásenia:", error.code, error.message);
                alert("Nepodarilo sa prihlásiť: " + error.message);
            });
    });
}

// Funkcia na uloženie módu
document.getElementById("pinModeBtn")?.addEventListener("click", () => {
    // Zistíme, čo je práve zobrazené
    let modeToPin = document.querySelector(".roster-section").style.display === "block" ? "war" : "home";
    // Ak je war, zistíme či je war alebo crucible
    if (modeToPin === "war") modeToPin = currentCategory; 
    
    localStorage.setItem("pinnedMode", modeToPin);
    alert("Mód " + modeToPin.toUpperCase() + " bol pripnutý!");
});

// Logika pri načítaní stránky
document.addEventListener('DOMContentLoaded', () => {
    const pinned = localStorage.getItem("pinnedMode") || "home"; // Predvolene home
    const dashboard = document.getElementById("home-dashboard");
    const mainSection = document.querySelector(".roster-section");
    const subLoc = document.querySelector('.sub-location');

    if (pinned === "home") {
        dashboard.style.display = "block";
        mainSection.style.display = "none";
        subLoc.textContent = "HOME";
    } else {
        dashboard.style.display = "none";
        mainSection.style.display = "block";
        loadCountersForCategory(pinned);
        subLoc.textContent = pinned === "war" ? "ALLIANCE WAR" : "COSMIC CRUCIBLE";
    }
});

const pinIcon = document.getElementById("pinIcon");

// Funkcia na aktualizáciu vzhľadu pinu
function updatePinUI() {
    const pinned = localStorage.getItem("pinnedMode");
    const currentMode = document.getElementById("home-dashboard").style.display === "none" ? currentCategory : "home";
    
    // Zmeníme vzhľad
    if (pinned === currentMode) {
        pinIcon.classList.add("pinned");
        pinIcon.title = "Zrušiť pripnutie módu"; // Zmení bublinku
    } else {
        pinIcon.classList.remove("pinned");
        pinIcon.title = "Pripnúť tento mód"; // Zmení bublinku
    }
}

// Kliknutie na pin
pinIcon.addEventListener("click", () => {
    const currentMode = document.getElementById("home-dashboard").style.display === "none" ? currentCategory : "home";
    
    if (localStorage.getItem("pinnedMode") === currentMode) {
        localStorage.removeItem("pinnedMode"); // Odopnúť
    } else {
        localStorage.setItem("pinnedMode", currentMode); // Pripnúť
    }
    updatePinUI();
});

// A v tej našej funkcii DOMContentLoaded to nakoniec zavoláme:
document.addEventListener('DOMContentLoaded', () => {
    const pinned = localStorage.getItem("pinnedMode") || "home";
    // ... (tvoj kód na prepnutie sekcií) ...
    
    updatePinUI(); // Nastaví správny vzhľad pinu po načítaní
});

// Odhlásenie
document.getElementById("logout-btn")?.addEventListener("click", () => {
    signOut(auth).then(() => {
        console.log("Odhlásené");
        location.reload();
    });
});

// --- INJEKCIA RESPONSÍVNYCH ŠTÝLOV ---
const responsiveStyle = document.createElement("style");
responsiveStyle.textContent = `
    /* ZELENÁ ČASŤ: Hlavná lišta s menu vpravo a nápisom vľavo */
    header, .header, nav, .nav-bar, .top-nav { 
        position: sticky !important; 
        top: 0; 
        left: 0; 
        width: 100%; 
        z-index: 2000; 
        display: flex !important; 
        align-items: center !important; 
        justify-content: space-between !important; 
        box-sizing: border-box;
        padding: 10px 20px !important;
        background: #051329 !important;
        border-bottom: 1px solid #1a3c61;
    }
    body { padding-top: 0 !important; }

    .logo-title { font-weight: bold; font-size: 18px; white-space: nowrap; color: white; text-transform: uppercase; margin: 0; display: flex; align-items: center; }
    .sub-location { font-size: 11px; color: #8a9ba8; margin-left: 8px; padding-left: 8px; border-left: 1px solid #1a3c61; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .nav-menu-select { padding: 4px 8px; background: #0c1a30; color: white; border: 1px solid #1a3c61; border-radius: 2px; font-weight: bold; font-size: 13px; cursor: pointer; outline: none; text-transform: uppercase; }

    /* FIALOVÁ ČASŤ: Jednotný riadok filtrov umiestnený pod menu */
    .search-row { display: flex; gap: 12px; align-items: center; width: 100%; margin-top: 15px; margin-bottom: 5px; flex-wrap: wrap; box-sizing: border-box; justify-content: center; }
    .search-row input { flex-grow: 1; margin: 0 !important; height: 32px; box-sizing: border-box; }

    /* Úprava sekcie dropdownu do riadka */
    .mode-container { display: flex; flex-direction: row; align-items: center; gap: 8px; font-family: sans-serif; white-space: nowrap; }
    .mode-select { padding: 4px 8px; background: #0c1a30; color: white; border: 1px solid #1a3c61; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px; outline: none; height: 32px; box-sizing: border-box; }

    /* Prepínanie zobrazenia (IKONY / TEXT) */
    .view-type-container { display: flex; gap: 4px; flex-shrink: 0; margin: 0 !important; font-family: sans-serif; }
    .view-btn { padding: 4px 8px; background: #0c1a30; color: #aaa; border: 1px solid #1a3c61; cursor: pointer; font-weight: bold; border-radius: 4px; font-size: 12px; transition: all 0.2s ease; text-transform: uppercase; box-sizing: border-box; height: 32px; }
    .view-btn.active { background: #00509e; color: white; border-color: #0070f3; }

    #character-container { display: grid; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px 0; }
    .detail-layout { display: flex; flex-wrap: nowrap; gap: 20px; background: #081226; color: white; padding: 20px; font-family: sans-serif; border: 1px solid #1a3c61; align-items: flex-start; }
    .detail-left { width: 250px; flex-shrink: 0; display: flex; flex-direction: column; }
    .char-avatar-block { width: 100%; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 15px; font-size: 13px; text-align: center; }
    .detail-right-container { display: flex; flex-grow: 1; gap: 20px; align-items: flex-start; }
    .ability-icons-col { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
    .ability-desc-col { flex-grow: 1; background: #0a1b35; border: 1px solid #1a3c61; padding: 20px; display: flex; flex-direction: column; max-height: 550px; box-sizing: border-box; }
    .compact-team-text { display: flex; flex-direction: column; gap: 4px !important; line-height: 1.2 !important; margin: 0 !important; padding: 0 !important; }
    .compact-team-name { font-weight: bold; text-transform: uppercase; margin: 0 !important; padding: 0 !important; }
    .compact-team-members { font-weight: normal; margin: 0 !important; padding: 0 !important; word-break: break-word; }
    .counter-group { background: #0c1a30; border: 1px solid #1a3c61; border-radius: 8px; font-family: sans-serif; width: 100%; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: border-color 0.2s; }
    .counter-group:hover { border-color: #00509e; }
    .counter-header { background: #112544; padding: 15px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; user-select: none; transition: background 0.2s; gap: 10px; border-top-left-radius: 7px; border-top-right-radius: 7px; }
    .counter-header:hover { background: #16305a; }
    .counter-group.text-view-mode .counter-header { padding: 6px 12px !important; align-items: flex-start !important; text-align: left !important; gap: 2px !important; }
    .counter-group.text-view-mode .counter-body { padding: 6px 10px !important; }
    .counter-group.text-view-mode .atk-row { padding: 4px 8px !important; margin-bottom: 4px !important; gap: 2px !important; }
    .team-icons-row { display: flex; gap: 2px; flex-wrap: wrap; align-items: flex-start; justify-content: center; }
    .mini-char-click { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
    .char-thumb { background-size: cover; background-position: top center; border: 2px solid #333; border-radius: 4px; background-color: #05264f; }
    .no-img-placeholder { display: block; text-align: center; color: #556b85; }
    .char-size-76 { width: 76px; } .char-size-76 .char-thumb { width: 76px; height: 76px; } .char-size-76 .char-name-label { font-size: 10px; }
    .char-size-52 { width: 58px; } .char-size-52 .char-thumb { width: 52px; height: 52px; } .char-size-52 .char-name-label { font-size: 9px; }
    .char-name-label { color: #b0bec5; text-align: center; text-overflow: ellipsis; overflow: visible; white-space: normal; word-break: break-word; width: 100%; margin-top: 2px; }
    .vote-container { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
    .vote-btn { padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; text-transform: uppercase; }
    .vote-btn.ez { color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.4); background: rgba(255, 255, 255, 0.05); }
    .vote-btn.ez.active, .vote-btn.ez:hover { color: #ffffff; background: rgba(255, 255, 255, 0.25); border-color: #ffffff; text-shadow: 0 0 8px #fff; box-shadow: 0 0 10px rgba(255, 255, 255, 0.6); }
    .vote-btn.ok { color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.4); background: rgba(46, 204, 113, 0.05); }
    .vote-btn.ok.active, .vote-btn.ok:hover { color: #ffffff; background: #2ecc71; border-color: #2ecc71; box-shadow: 0 0 10px rgba(46, 204, 113, 0.6); }
    .vote-btn.half { color: #e67e22; border: 1px solid rgba(230, 126, 34, 0.4); background: rgba(230, 126, 34, 0.05); }
    .vote-btn.half.active, .vote-btn.half:hover { color: #ffffff; background: #e67e22; border-color: #e67e22; box-shadow: 0 0 10px rgba(230, 126, 34, 0.6); }
    .vote-btn.no { color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.4); background: rgba(231, 76, 60, 0.05); }
    .vote-btn.no.active, .vote-btn.no:hover { color: #ffffff; background: #e74c3c; border-color: #e74c3c; box-shadow: 0 0 10px rgba(231, 76, 60, 0.6); }
    .counter-body { padding: 12px; background: #081226; display: none; border-top: 1px solid #1a3c61; border-bottom-left-radius: 7px; border-bottom-right-radius: 7px; }
    .counter-body.active { display: block; }
    .atk-row { display: flex; flex-direction: column; background: #0c1a30; border: 1px solid #1a3c61; padding: 10px; margin-bottom: 10px; border-radius: 4px; gap: 8px; }
    .match-note { font-size: 11px; color: #b0bec5; font-style: italic; background: #051329; padding: 6px 10px; border-left: 3px solid #00509e; margin-top: 4px; border-radius: 2px; line-height: 1.3; }
    .arrow-toggle { color: #ffcc00; font-size: 12px; font-weight: bold; margin-top: 5px; }
    @media (min-width: 769px) { .counter-group { width: calc(50% - 20px); max-width: 580px; } }
    @media (max-width: 768px) { .counter-group { max-width: 100%; } .detail-layout { flex-direction: column; align-items: center; padding: 12px; } .detail-left { width: 100%; max-width: 500px; flex-direction: row; gap: 15px; align-items: center; margin-bottom: 15px; } .char-avatar-block { width: 140px; flex-shrink: 0; } .char-avatar-block div { height: 140px !important; } .stats-grid { flex-grow: 1; padding-top: 0; font-size: 11px; gap: 6px; } .detail-right-container { width: 100%; flex-direction: column; align-items: center; gap: 15px; } .ability-icons-col { flex-direction: row; justify-content: center; width: 100%; flex-wrap: wrap; } .ability-desc-col { width: 100%; max-height: none; } }
`;
document.head.appendChild(responsiveStyle);

// Inicializácia UI prvkov
const container = document.getElementById("character-container");
const searchInput = document.getElementById("searchInput");
const countElement = document.getElementById("character-count");

// Výber sekcie pomocou dropdownu
let currentMode = "characters"; 
let currentCategory = "war";
let countersListener = null; // Toto bude držať náš "vypínač"
const modeWrapper = document.createElement("div");
modeWrapper.className = "mode-container";
modeWrapper.innerHTML = `
    <label style="font-size: 10px; color: #8a9ba8; font-weight: bold; text-transform: uppercase;"></label>
    <select id="mainModeSelect" class="mode-select">
        <option value="characters" selected>POSTAVY</option>
        <option value="def">🛡️ PROTI OBRANE (DEF)</option>
        <option value="atk">⚔️ ÚČINNÝ ÚTOK (ATK)</option>
        <option value="char">PODĽA POSTAVY V TÍME</option>
    </select>
`;

// Prepínanie zobrazenia (IKONY / TEXT)
let currentViewType = "icons"; 
const viewTypeWrapper = document.createElement("div");
viewTypeWrapper.className = "view-type-container";
viewTypeWrapper.style.display = "none"; 
viewTypeWrapper.innerHTML = `
    <button class="view-btn active" data-view="icons">IKONY</button>
    <button class="view-btn" data-view="text">TEXT</button>
`;

// Vytvorenie fialového riadka pre vyhľadávanie a filtre
const searchRow = document.createElement("div");
searchRow.className = "search-row";

let detailContainer = document.createElement("div");
detailContainer.id = "detail-container";
detailContainer.style.display = "none";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Pridanie nápisu do hlavičky
    const nav = document.querySelector('header, .header, nav, .nav-bar, .top-nav');
    if (nav) {
        const logo = nav.querySelector('.logo-title');
        if (logo && !nav.querySelector('.sub-location')) {
            const span = document.createElement('span');
            span.className = 'sub-location';
            span.textContent = 'ALLIANCE WAR';
            logo.appendChild(span);
        }
    }

    // 2. Presné umiestnenie: Riadok -> Počítadlo -> Detail -> Container
    if (container && searchInput && countElement) {
        const parent = container.parentNode;
        parent.insertBefore(searchRow, container); 
        parent.insertBefore(countElement, container);
        parent.insertBefore(detailContainer, container);
        
        searchRow.appendChild(modeWrapper); 
        searchRow.appendChild(searchInput); 
        searchRow.appendChild(viewTypeWrapper); 
    }
});

let allCharacters = [];
let allCounters = [];
let allTeams = {}; 

// Naviazanie logiky na dropdown výberu sekcie
document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "mainModeSelect") {
        currentMode = e.target.value;
        
        viewTypeWrapper.style.display = (currentMode === "characters") ? "none" : "flex"; 
        
        if (searchInput) {
            searchInput.value = "";
            const place = {
                "characters": "Vyhľadaj postavu podľa mena...",
                "def": "Zadaj OBRANNÝ tím (nájde countery)...",
                "atk": "Zadaj ÚTOČIACI tím (nájde čo porazí)...",
                "char": "Zadaj meno hľadanej postavy v tímoch..."
            };
            searchInput.placeholder = place[currentMode] || "Vyhľadávanie...";
        }
        
        if (currentMode === "characters") {
            renderCharacters(allCharacters);
        } else {
            container.innerHTML = "";
            if (searchInput && searchInput.value.trim() !== "") {
                searchInput.dispatchEvent(new Event('input'));
            } else {
                renderCounters([]);
            }
        }
    }
});

// Naviazanie logiky na tlačidlá IKONY / TEXT
viewTypeWrapper.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        viewTypeWrapper.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        
        currentViewType = e.target.getAttribute("data-view");
        
        if (currentMode !== "characters" && searchInput && searchInput.value.trim() !== "") {
            searchInput.dispatchEvent(new Event('input'));
        }
    });
});

// Vykresľovanie Postáv
function renderCharacters(characters) {
    if (!container) return;
    container.style.display = "grid"; 
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

// Vykresľovanie Counterov
function renderCounters(counters) {
    if (!container) return;
    
    const openKeys = new Set();
    container.querySelectorAll(".counter-group.open").forEach(group => {
        const key = group.getAttribute("data-key");
        if (key) openKeys.add(key);
    });

    container.style.display = "flex";
    container.innerHTML = "";

    if (searchInput && searchInput.value.trim() === "") {
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
                <div class="mini-char-click ${sizeClass}" data-name="${name}" title="${name}">
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
        groupWrapper.setAttribute("data-key", group.key);
        
        const isOpen = openKeys.has(group.key);
        if (isOpen) groupWrapper.classList.add("open");

        let headerHtml = "";
        if (currentViewType === "icons") {
            headerHtml = `
                <span style="color: ${isAtkMode ? '#4fc3f7' : '#ffcc00'}; font-weight: bold; font-size: 15px; text-transform: uppercase;">
                    ${isAtkMode ? '⚔️ ' : '🛡️ '}${group.teamName}
                </span>
                <div class="team-icons-row" style="margin-top: 5px; width: 100%;">
                    ${makeIconsHtml(group.members, isAtkMode, "char-size-76")}
                </div>
                <div class="arrow-toggle">${isOpen ? "▲ ZBALIŤ COUNTERY" : "ROZBALIŤ COUNTERY ▼"}</div>
            `;
        } else {
            headerHtml = `
                <div class="team-text-row-trigger" style="display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; user-select: none;">
                    <span class="header-arrow" style="color: #ffcc00; font-size: 13px; font-weight: bold;">${isOpen ? "▼" : "▶"}</span>
                    <div class="compact-team-text">
                        <span class="compact-team-name" style="font-size: 13px; color: ${isAtkMode ? '#4fc3f7' : '#ffcc00'};">
                            ${isAtkMode ? '⚔️ ' : '🛡️ '}${group.teamName}
                        </span>
                        <span class="compact-team-members" style="font-size: 12px; color: #e0e6ed;">
                            ${group.members.join(" • ")}
                        </span>
                    </div>
                </div>
                <div class="header-expanded-icons" style="display: ${isOpen ? 'flex' : 'none'}; width: 100%; margin-top: 6px; justify-content: center;">
                    <div class="team-icons-row">
                        ${makeIconsHtml(group.members, isAtkMode, "char-size-52")}
                    </div>
                </div>
            `;
        }

        let rowsHtml = group.list.map(item => {
            const secondaryKey = isAtkMode ? item.defense : item.offense;
            const secondaryTeamData = allTeams[secondaryKey] || {};
            const secondaryTeamName = secondaryTeamData.name || secondaryKey.toUpperCase();
            const secondaryMembers = secondaryTeamData.members || [];
            const rowIconsHtml = makeIconsHtml(secondaryMembers, !isAtkMode, "char-size-52");
            const savedVote = localStorage.getItem(`vote_${item.id}`) || "";
            const votes = item.votes || { ez: 0, ok: 0, half: 0, no: 0 };
            
            const voteHtml = `
                <div class="vote-container" data-counter-id="${item.id}">
                    <button class="vote-btn ez ${savedVote === 'ez' ? 'active' : ''}" data-type="ez">EZ (${votes.ez || 0})</button>
                    <button class="vote-btn ok ${savedVote === 'ok' ? 'active' : ''}" data-type="ok">OK (${votes.ok || 0})</button>
                    <button class="vote-btn half ${savedVote === 'half' ? 'active' : ''}" data-type="half">50/50 (${votes.half || 0})</button>
                    <button class="vote-btn no ${savedVote === 'no' ? 'active' : ''}" data-type="no">Big No (${votes.no || 0})</button>
                </div>
            `;
            
            const noteText = item.note || item.poznamka || "";
            const noteHtml = noteText ? `<div class="match-note"><b>Poznámka:</b> ${noteText}</div>` : '';

            if (currentViewType === "icons") {
                return `
                    <div class="atk-row">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1a3c61; padding-bottom: 5px; flex-wrap: wrap; gap: 10px;">
                            <span style="font-size: 11px; color: ${isAtkMode ? '#ffcc00' : '#4fc3f7'}; font-weight: bold; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;">
                                ${isAtkMode ? '🛡️ ' : '⚔️ '}${secondaryTeamName}
                            </span>
                            ${voteHtml}
                        </div>
                        <div class="team-icons-row">${rowIconsHtml}</div>
                        ${noteHtml}
                    </div>
                `;
            } else {
                return `
                    <div class="atk-row text-mode-row">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; width: 100%;">
                            <div class="row-text-trigger" style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex-grow: 1; text-align: left; user-select: none;">
                                <span class="row-arrow" style="color: #4fc3f7; font-size: 11px; font-weight: bold;">▶</span>
                                <div class="compact-team-text">
                                    <span class="compact-team-name" style="font-size: 12px; color: ${isAtkMode ? '#ffcc00' : '#4fc3f7'};">
                                        ${isAtkMode ? '🛡️ ' : '⚔️ '}${secondaryTeamName}
                                    </span>
                                    <span class="compact-team-members" style="font-size: 11px; color: #b0bec5;">
                                        ${secondaryMembers.join(" • ")}
                                    </span>
                                </div>
                            </div>
                            ${voteHtml}
                        </div>
                        <div class="row-expanded-icons" style="display: none; width: 100%; margin-top: 4px; justify-content: center;">
                            <div class="team-icons-row">${rowIconsHtml}</div>
                        </div>
                        ${noteHtml}
                    </div>
                `;
            }
        }).join("");

        groupWrapper.innerHTML = `
            <div class="counter-header">${headerHtml}</div>
            <div class="counter-body ${isOpen ? "active" : ""}">
                <h4 style="margin: 0 0 10px 0; font-size: 10px; color: #8a9ba8; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                    ${isAtkMode ? 'Porazí tieto obrany:' : 'Odporúčané útoky:'}
                </h4>
                ${rowsHtml}
                <button class="close-bottom-btn" style="position: sticky; bottom: 15px; z-index: 10; width: 100%; margin-top: 15px; padding: 12px; background: #112544; color: #ffcc00; border: 1px solid #1a3c61; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px; text-transform: uppercase; transition: background 0.2s; box-shadow: 0 -4px 10px rgba(0,0,0,0.4);">
                    ▲ ZBALIŤ COUNTERY
                </button>
            </div>
        `;

        const header = groupWrapper.querySelector(".counter-header");
        const body = groupWrapper.querySelector(".counter-body");
        const bottomCloseBtn = groupWrapper.querySelector(".close-bottom-btn");

        header.addEventListener("click", (e) => {
            if (e.target.closest(".mini-char-click") || e.target.closest(".vote-btn") || e.target.closest(".text-mode-row")) return;
            const isOpenNow = body.classList.toggle("active");
            groupWrapper.classList.toggle("open");
            const headerArrow = header.querySelector(".header-arrow");
            const headerIcons = header.querySelector(".header-expanded-icons");
            const arrowToggle = header.querySelector(".arrow-toggle");
            if (headerArrow) headerArrow.innerText = isOpenNow ? "▼" : "▶";
            if (headerIcons) headerIcons.style.display = isOpenNow ? "flex" : "none";
            if (arrowToggle) arrowToggle.innerText = isOpenNow ? "▲ ZBALIŤ COUNTERY" : "ROZBALIŤ COUNTERY ▼";
        });

        groupWrapper.querySelectorAll(".text-mode-row").forEach(row => {
            const trigger = row.querySelector(".row-text-trigger");
            const iconsDiv = row.querySelector(".row-expanded-icons");
            const rowArrow = row.querySelector(".row-arrow");
            if (trigger) trigger.addEventListener("click", (e) => {
                e.stopPropagation(); 
                const isHidden = iconsDiv.style.display === "none";
                iconsDiv.style.display = isHidden ? "flex" : "none";
                rowArrow.innerText = isHidden ? "▼" : "▶";
            });
        });

        if (bottomCloseBtn) bottomCloseBtn.addEventListener("click", () => {
            body.classList.remove("active");
            groupWrapper.classList.remove("open");
            groupWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        container.appendChild(groupWrapper);
    });

    document.querySelectorAll(".mini-char-click").forEach(el => {
        el.addEventListener("click", (e) => {
            if (e.target.closest(".vote-btn")) return;
            const charName = e.currentTarget.getAttribute("data-name");
            const found = allCharacters.find(c => c.name && c.name.toLowerCase().trim() === charName.toLowerCase().trim());
            if (found) showCharacterDetail(found);
        });
    });
}

// Logika hlasovania
if (container) {
    container.addEventListener("click", (e) => {
        const btn = e.target.closest(".vote-btn");
        if (!btn) return;
        const voteContainer = btn.closest(".vote-container");
        const counterId = voteContainer.getAttribute("data-counter-id");
        const voteType = btn.getAttribute("data-type"); 
        const storageKey = `vote_${counterId}`;
        const previousVote = localStorage.getItem(storageKey);
        if (previousVote === voteType) return;
        
        localStorage.setItem(storageKey, voteType);
        voteContainer.querySelectorAll(".vote-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        const counterVoteRef = ref(db, `counters/war/${counterId}/votes`);
        runTransaction(counterVoteRef, (currentVotes) => {
            if (!currentVotes) currentVotes = { ez: 0, ok: 0, half: 0, no: 0 };
            if (previousVote && currentVotes[previousVote] > 0) currentVotes[previousVote]--;
            if (!currentVotes[voteType]) currentVotes[voteType] = 0;
            currentVotes[voteType]++;
            return currentVotes;
        }).catch((err) => {
            console.error("Hlasovanie zlyhalo: ", err);
        });
    });
}

// Zobrazenie detailov
function showCharacterDetail(char) {
    history.pushState({ view: "detail" }, "");
    container.style.display = "none";
    if (searchInput) searchInput.style.display = "none";
    if (countElement) countElement.style.display = "none";
    if (searchRow) searchRow.style.display = "none";
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
                            return `<img src="${abils[type].icon}" class="ability-btn" data-type="${type}" style="width: 70px; height: 70px; cursor: pointer; border: ${activeAbility === type ? '3px solid #f2a900' : '2px solid #333'}; border-radius: 4px; flex-shrink: 0;">`;
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
                                    <select id="abilityLevelSelect" style="background: transparent; color: #d18000; border: 1px solid #d18000; padding: 5px; font-weight: bold; cursor: pointer;">${levelsOptions}</select>
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

        document.getElementById("backToList").addEventListener("click", () => history.back());
        document.querySelectorAll(".ability-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                activeAbility = e.target.getAttribute("data-type");
                const newLevels = Object.keys(abils[activeAbility]?.levels || {});
                activeLevel = newLevels.length > 0 ? Math.max(...newLevels) : 1;
                renderDetailContent();
            });
        });
        const selectEl = document.getElementById("abilityLevelSelect");
        if (selectEl) selectEl.addEventListener("change", (e) => {
            activeLevel = e.target.value;
            renderDetailContent();
        });
    }
    renderDetailContent();
}

// Načítavanie dát z Firebase
async function initDataSequential() {
    try {
        const charsSnap = await get(ref(db, 'characters/'));
        if (charsSnap.exists()) {
            allCharacters = Object.values(charsSnap.val());
            if (currentMode === "characters") renderCharacters(allCharacters);
        }
        const teamsSnap = await get(ref(db, 'teams/'));
        if (teamsSnap.exists()) allTeams = teamsSnap.val();
        
        // Načítame základné listenery pre postavy a tímy
        onValue(ref(db, 'characters/'), (snapshot) => {
            const data = snapshot.val();
            if (data) { allCharacters = Object.values(data); if (currentMode === "characters") renderCharacters(allCharacters); }
        });
        onValue(ref(db, 'teams/'), (snapshot) => { if (snapshot.val()) allTeams = snapshot.val(); });
        
        // Inicializujeme listenery pre countery podľa predvolenej kategórie
        loadCountersForCategory(currentCategory);
        
    } catch (error) { console.error("Chyba:", error); }
}

initDataSequential();


// Listener pre menu, ktorý prepína dáta bez načítania stránky
const navMenu = document.getElementById("navMenu");
if (navMenu) {
    navMenu.addEventListener("change", (e) => {
        const val = e.target.value;
        const dashboard = document.getElementById("home-dashboard");
        const mainSection = document.querySelector(".roster-section");
        const subLoc = document.querySelector('.sub-location');

        // 1. Logika pre HOME (dashboard)
        if (val === "home") {
            if (dashboard) dashboard.style.display = "block";
            if (mainSection) mainSection.style.display = "none";
            if (subLoc) subLoc.textContent = "HOME";
        } 
        // 2. Logika pre WAR / CRUCIBLE (dynamická zmena dát)
        else if (val === "war" || val === "crucible") {
            if (dashboard) dashboard.style.display = "none";
            if (mainSection) mainSection.style.display = "block";
            
            loadCountersForCategory(val);
            if (subLoc) {
                subLoc.textContent = val === "war" ? "ALLIANCE WAR" : "COSMIC CRUCIBLE";
            }
        } 
        // 3. Logika pre presmerovanie na iné stránky
        else {
            const pageMap = {
                "admin": "admin.html",
                "arena": "arena.html"
            };
            if (pageMap[val]) {
                window.location.href = pageMap[val];
            }
        }
        // 4. Uprava pripnutia stranky
        updatePinUI();
    });
}


////Nová funkcia pre načítanie counterov
function loadCountersForCategory(category) {
    currentCategory = category;
    
    // 1. Vypneme starý listener, ak existuje
    if (countersListener) {
        countersListener(); // Firebase onValue vráti funkciu na zrušenie odberu
    }
    
    // 2. Zapneme nový listener pre vybranú kategóriu
    countersListener = onValue(ref(db, `counters/${category}/`), (snapshot) => {
        const data = snapshot.val();
        allCounters = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
        // Ak nie sme v móde postáv a niečo vyhľadávame, aktualizujeme UI
        if (currentMode !== "characters" && searchInput && searchInput.value.trim() !== "") {
            searchInput.dispatchEvent(new Event('input'));
        }
    });
}

// Interakcia s vyhľadávaním
if (searchInput) {
    searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") searchInput.blur(); });
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (currentMode === "characters") {
            renderCharacters(allCharacters.filter(char => char.name && char.name.toLowerCase().includes(searchTerm)));
        } else {
            if (!searchTerm) { renderCounters([]); return; }
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
    });
}

// Back to top & Popstate
const backToTopBtn = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
    if(backToTopBtn) backToTopBtn.style.display = (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) ? "block" : "none";
});

window.addEventListener("popstate", () => {
    if (detailContainer && detailContainer.style.display === "block") {
        detailContainer.style.display = "none";
        container.style.display = "flex"; 
        if (searchInput) searchInput.style.display = "block";
        if (countElement) countElement.style.display = "block";
        if (searchRow) searchRow.style.display = "flex";
        if (currentMode === "characters") renderCharacters(allCharacters);
        else searchInput.dispatchEvent(new Event('input'));
    }
});

if (backToTopBtn) backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: 'smooth' }));
console.log("Script načítaný kompletne.");



// ==========================================
// --- COSMIC CRUCIBLE PLANNER MODUL ---
// ==========================================

// 1. Injekcia CSS pre Planner
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
    .cc-result-row { padding: 10px; border-bottom: 1px dashed #1a3c61; display: flex; justify-content: space-between;}
    .cc-result-row:last-child { border-bottom: none; }
`;
document.head.appendChild(ccStyle);

// 2. Injekcia HTML
const ccHTML = `
    <section id="crucible-planner">
        <h2 style="text-align: center; color: #ffcc00; margin-bottom: 20px;">CRUCIBLE PLANNER (BETA)</h2>
        <div class="cc-grid" id="cc-nodes-container"></div>
        <div style="text-align: center; margin-top: 20px;">
            <button id="cc-calc-btn" class="cta-btn">VYPOČÍTAŤ UNIKÁTNE COUNTERY</button>
        </div>
        <div id="cc-results"></div>
    </section>
`;
document.querySelector(".roster-section").insertAdjacentHTML("afterend", ccHTML);

const ccPlannerSection = document.getElementById("crucible-planner");
const ccNodesContainer = document.getElementById("cc-nodes-container");
const ccCalcBtn = document.getElementById("cc-calc-btn");
const ccResults = document.getElementById("cc-results");

// 3. Vytvorenie 6 miestností
for (let i = 1; i <= 6; i++) {
    const nodeDiv = document.createElement("div");
    nodeDiv.className = "cc-node";
    nodeDiv.innerHTML = `
        <h3>Miestnosť ${i}</h3>
        <input type="text" class="cc-input" id="cc-def-${i}" placeholder="Zadaj obranu (napr. x-men)...">
        <div class="cc-counter-list" id="cc-list-${i}">
            <p style="color:#556b85; text-align:center; font-style:italic;">Zadaj tím pre zobrazenie možností</p>
        </div>
    `;
    ccNodesContainer.appendChild(nodeDiv);

    // Event listener na vyhľadávanie counterov pre danú miestnosť
    const inputEl = document.getElementById(`cc-def-${i}`);
    const listEl = document.getElementById(`cc-list-${i}`);
    
    inputEl.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        listEl.innerHTML = "";
        
        if (term.length < 2) {
            listEl.innerHTML = `<p style="color:#556b85; text-align:center;">Zadaj tím...</p>`;
            return;
        }

        // Nájdeme všetky countery pre tento defenzívny tím
        const foundCounters = allCounters.filter(c => {
            const defTeam = allTeams[c.defense]?.name || c.defense;
            return defTeam.toLowerCase().includes(term);
        });

        if (foundCounters.length === 0) {
            listEl.innerHTML = `<p style="color:#e74c3c; text-align:center;">Žiadny counter nenájdený.</p>`;
            return;
        }

        // Vykreslíme checkboxy pre nájdené countery
        foundCounters.forEach(counter => {
            const atkTeamName = allTeams[counter.offense]?.name || counter.offense;
            const div = document.createElement("div");
            div.className = "cc-counter-item";
            div.innerHTML = `
                <input type="checkbox" checked data-offense="${counter.offense}">
                <span><b>${atkTeamName}</b> (Hlasy: ${counter.votes?.ez || 0} EZ)</span>
            `;
            listEl.appendChild(div);
        });
    });
}

// 4. Prepojenie zobrazenia Planneru na hlavné menu
const originalNavMenuChange = navMenu.onchange;
navMenu.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "crucible") {
        document.querySelector(".roster-section").style.display = "none";
        ccPlannerSection.style.display = "block";
    } else {
        ccPlannerSection.style.display = "none";
        if(val === "war") document.querySelector(".roster-section").style.display = "block";
    }
});

// 5. Algoritmus na výpočet unikátnych tímov
ccCalcBtn.addEventListener("click", () => {
    // Pozbierame vyznačené možnosti zo všetkých 6 miestností
    const rooms = [];
    for (let i = 1; i <= 6; i++) {
        const defName = document.getElementById(`cc-def-${i}`).value;
        const checkedBoxes = document.querySelectorAll(`#cc-list-${i} input[type="checkbox"]:checked`);
        const allowedOffenses = Array.from(checkedBoxes).map(cb => cb.getAttribute("data-offense"));
        
        rooms.push({
            roomNum: i,
            defense: defName || "Nezadané",
            options: allowedOffenses
        });
    }

    ccResults.style.display = "block";
    ccResults.innerHTML = "<h3 style='color:#00d2ff; text-align:center;'>VÝSLEDKY:</h3>";

    // Rekurzívna funkcia (Backtracking) na nájdenie kombinácie bez použitia rovnakej postavy dvakrát
    let finalSolution = null;

    function solve(roomIndex, usedCharacters, currentAssignment) {
        if (roomIndex === 6) {
            finalSolution = [...currentAssignment];
            return true; // Našli sme platné riešenie
        }

        const room = rooms[roomIndex];
        if (room.options.length === 0) {
            currentAssignment.push({ roomNum: room.roomNum, atk: "ŽIADNA MOŽNOSŤ" });
            return solve(roomIndex + 1, usedCharacters, currentAssignment);
        }

        for (let atkKey of room.options) {
            const atkMembers = allTeams[atkKey]?.members || [];
            
            // Kontrola, či niektorá postava z tohto tímu už nebola použitá
            const hasConflict = atkMembers.some(char => usedCharacters.has(char));
            
            if (!hasConflict) {
                // Postavy sú voľné, použijeme ich
                atkMembers.forEach(char => usedCharacters.add(char));
                currentAssignment.push({ roomNum: room.roomNum, atk: atkKey });
                
                if (solve(roomIndex + 1, usedCharacters, currentAssignment)) return true;
                
                // Backtrack (krok späť, ak táto vetva nevedie k riešeniu)
                currentAssignment.pop();
                atkMembers.forEach(char => usedCharacters.delete(char));
            }
        }
        return false;
    }

    solve(0, new Set(), []);

    if (finalSolution) {
        finalSolution.forEach(sol => {
            const atkTeamName = allTeams[sol.atk]?.name || sol.atk;
            ccResults.innerHTML += `
                <div class="cc-result-row">
                    <span style="color:#ffcc00;">Miestnosť ${sol.roomNum} (Def: ${rooms[sol.roomNum-1].defense}):</span>
                    <span style="color:#2ecc71; font-weight:bold;">${atkTeamName}</span>
                </div>
            `;
        });
    } else {
        ccResults.innerHTML += `<p style="color:#e74c3c; text-align:center;">Nenašla sa žiadna unikátna kombinácia! Zrejme ti chýbajú postavy alebo sa tímy prekrývajú.</p>`;
    }
});