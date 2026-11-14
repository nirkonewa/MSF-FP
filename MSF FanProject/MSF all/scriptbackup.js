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
        if (loginForm) loginForm.style.display = "none";
        if (adminPanel) adminPanel.style.display = "block";
    } else {
        if (loginForm) loginForm.style.display = "block";
        if (adminPanel) adminPanel.style.display = "none";
    }
});

// --- OŠETRENIE FORMULÁRA ---
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        signInWithEmailAndPassword(auth, email, password)
            .catch((error) => {
                alert("Nepodarilo sa prihlásiť: " + error.message);
            });
    });
}

// Global state variables
let currentMode = "characters"; 
let currentCategory = "war";
let countersListener = null; 
let allCharacters = [];
let allCounters = [];
let allTeams = {}; 
let currentViewType = "icons"; 

// Helper funkcie pre PIN UI
function updatePinUI() {
    const pinIcon = document.getElementById("pinIcon");
    if (!pinIcon) return;
    
    const pinned = localStorage.getItem("pinnedMode");
    const homeDash = document.getElementById("home-dashboard");
    const currentModeState = (homeDash && homeDash.style.display === "none") ? currentCategory : "home";
    
    if (pinned === currentModeState) {
        pinIcon.classList.add("pinned");
        pinIcon.title = "Zrušiť pripnutie módu";
    } else {
        pinIcon.classList.remove("pinned");
        pinIcon.title = "Pripnúť tento mód";
    }
}

document.getElementById("pinModeBtn")?.addEventListener("click", () => {
    let modeToPin = document.querySelector(".roster-section")?.style.display === "block" ? "war" : "home";
    if (modeToPin === "war") modeToPin = currentCategory; 
    
    localStorage.setItem("pinnedMode", modeToPin);
    alert("Mód " + modeToPin.toUpperCase() + " bol pripnutý!");
});

const pinIcon = document.getElementById("pinIcon");
if (pinIcon) {
    pinIcon.addEventListener("click", () => {
        const homeDash = document.getElementById("home-dashboard");
        const currentModeState = (homeDash && homeDash.style.display === "none") ? currentCategory : "home";
        
        if (localStorage.getItem("pinnedMode") === currentModeState) {
            localStorage.removeItem("pinnedMode");
        } else {
            localStorage.setItem("pinnedMode", currentModeState);
        }
        updatePinUI();
    });
}

// Odhlásenie
document.getElementById("logout-btn")?.addEventListener("click", () => {
    signOut(auth).then(() => {
        location.reload();
    });
});

// --- INJEKCIA RESPONSÍVNYCH ŠTÝLOV ---
const responsiveStyle = document.createElement("style");
responsiveStyle.textContent = `
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

    .logo-title { font-weight: bold; font-size: 18px; white-space: nowrap; color: white; text-transform: uppercase; margin: 0; display: flex; align-items: center; cursor: pointer; }
    .sub-location { font-size: 11px; color: #8a9ba8; margin-left: 8px; padding-left: 8px; border-left: 1px solid #1a3c61; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .nav-menu-select { padding: 4px 8px; background: #0c1a30; color: white; border: 1px solid #1a3c61; border-radius: 2px; font-weight: bold; font-size: 13px; cursor: pointer; outline: none; text-transform: uppercase; }

    .search-row { 
        position: sticky !important; 
        top: 45px; 
        z-index: 1999; 
        background: transparent; 
        padding: 10px 20px;
        display: flex; gap: 12px; align-items: center; width: 100%; margin-top: 0; margin-bottom: 5px; flex-wrap: wrap; box-sizing: border-box; justify-content: center; 
    }
    
    #character-count {
        position: relative;
        top: 0;
        z-index: 1998;
        background: transparent;
        padding: 8px 0;
        text-align: center;
        font-weight: bold;
    }

    #character-count::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 280px;
        height: 100%;
        background: radial-gradient(ellipse, rgba(0, 0, 0, 0.95) 30%, rgba(0, 0, 0, 0.7) 60%, transparent 90%);
        filter: blur(6px);
        z-index: -1;
        pointer-events: none;
    }

    /* Všeobecný štýl pre obaly inputov s X tlačidlom vo vnútri */
    .input-clear-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        flex-grow: 1;
        min-width: 220px;
        max-width: 400px;
        margin: 0 !important;
        box-sizing: border-box;
    }
    .input-clear-wrapper input {
        width: 100% !important;
        height: 32px;
        padding-right: 30px !important;
        box-sizing: border-box;
        border: 1px solid rgba(59, 130, 246, 0.9) !important;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.5) !important;
    }
    .input-clear-btn {
        position: absolute;
        right: 8px;
        background: none;
        border: none;
        color: #8a9ba8;
        font-size: 14px;
        cursor: pointer;
        display: none;
        padding: 0;
        z-index: 5;
    }
    .input-clear-btn:hover { color: #fff; }

    /* Multi-char grid pre mód 'char' */
    .multi-char-search-container {
        display: none;
        flex-direction: column;
        gap: 8px;
        flex-grow: 1;
        max-width: 300px;
    }
    .multi-char-inputs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(60px, 60px));
        gap: 8px;
        width: 100%;
    }
    .multi-char-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    .clear-all-btn {
        background: #3a1c1c;
        color: #e74c3c;
        border: 1px solid #e74c3c;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        font-weight: bold;
    }
    .clear-all-btn:hover { background: #e74c3c; color: #fff; }
    .multi-char-warning {
        color: #ff6b6b;
        font-size: 11px;
        background: #3a1c1c;
        border: 1px solid #e74c3c;
        padding: 4px 8px;
        border-radius: 4px;
        display: none;
    }

    .search-row select {
        border: 1px solid rgba(59, 130, 246, 0.9) !important;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.5) !important;
    }  

    .mode-container { display: flex; flex-direction: row; align-items: center; gap: 8px; font-family: sans-serif; white-space: nowrap; }
    .mode-select { padding: 4px 8px; background: #0c1a30; color: white; border: 1px solid #1a3c61; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px; outline: none; height: 32px; box-sizing: border-box; }

    .view-type-container { display: flex; gap: 4px; flex-shrink: 0; margin: 0 !important; font-family: sans-serif; }
    .view-btn { 
        padding: 4px 8px; 
        background: #0c1a30; 
        color: #aaa; 
        cursor: pointer; 
        font-weight: bold; 
        border-radius: 4px; 
        font-size: 12px; 
        transition: all 0.2s ease; 
        text-transform: uppercase; 
        box-sizing: border-box; 
        height: 32px; 
        border: 1px solid rgba(59, 130, 246, 0.9) !important;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.5) !important;
    }
    .view-btn.active { 
        background: #00509e; 
        color: white; 
        border-color: #0070f3 !important;
    }
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

const container = document.getElementById("character-container");
const searchInput = document.getElementById("searchInput");
const countElement = document.getElementById("character-count");

// Obal pre pôvodný input s X tlačidlom
const searchInputWrapper = document.createElement("div");
searchInputWrapper.className = "input-clear-wrapper";
searchInputWrapper.id = "searchInputWrapper";

const clearSearchBtn = document.createElement("button");
clearSearchBtn.className = "input-clear-btn";
clearSearchBtn.id = "clearSearchBtn";
clearSearchBtn.innerHTML = "✖";
clearSearchBtn.title = "Vymazať text";

// Vytvorenie kontajnera pre 5 vyhľadávacích polí (mód 'char')
const multiCharSearchContainer = document.createElement("div");
multiCharSearchContainer.className = "multi-char-search-container";
multiCharSearchContainer.id = "multiCharSearchContainer";
multiCharSearchContainer.innerHTML = `
    <div class="multi-char-inputs-grid" id="multiCharInputsGrid"></div>
    <div class="multi-char-warning" id="multiCharWarning">⚠️ Upozornenie: Niektoré postavy sú zadané duplicitne!</div>
    <div class="multi-char-actions">
        <button class="clear-all-btn" id="multiCharClearAllBtn">Vymazať všetky polia</button>
    </div>
`;

for (let i = 0; i < 5; i++) {
    const wrap = document.createElement("div");
    wrap.className = "input-clear-wrapper";
    wrap.innerHTML = `
        <input type="text" class="multi-char-input" data-index="${i}" placeholder="Postava ${i+1}..." list="search-suggestions" autocomplete="off">
        <button class="input-clear-btn">✖</button>
    `;
    multiCharSearchContainer.querySelector(".multi-char-inputs-grid").appendChild(wrap);
}

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

const datalistEl = document.createElement("datalist");
datalistEl.id = "search-suggestions";
document.body.appendChild(datalistEl);

const viewTypeWrapper = document.createElement("div");
viewTypeWrapper.className = "view-type-container";
viewTypeWrapper.style.display = "none"; 
viewTypeWrapper.innerHTML = `
    <button class="view-btn active" data-view="icons">IKONY</button>
    <button class="view-btn" data-view="text">TEXT</button>
`;

const searchRow = document.createElement("div");
searchRow.className = "search-row";

let detailContainer = document.createElement("div");
detailContainer.id = "detail-container";
detailContainer.style.display = "none";

document.addEventListener("DOMContentLoaded", () => {
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

    const logoBtn = document.querySelector('.logo-title');
    if (logoBtn) {
        logoBtn.addEventListener("click", (event) => {
            event.preventDefault(); 
            applyMode("home");      
        });
    }

    if (container && searchInput && countElement) {
        const parent = container.parentNode;
        parent.insertBefore(searchRow, container); 
        parent.insertBefore(countElement, container);
        parent.insertBefore(detailContainer, container);
        
        // --- ZMENENÉ PORADIE V SEARCH-ROW ---
        searchRow.appendChild(modeWrapper); // 1. Výber módu
        
        // Zbalenie inputu do wrapperu s X tlačidlom
        searchInput.parentNode.insertBefore(searchInputWrapper, searchInput);
        searchInputWrapper.appendChild(searchInput);
        searchInputWrapper.appendChild(clearSearchBtn);

        searchRow.appendChild(searchInputWrapper); // 2. Searchbar / Lister 1
        parent.insertBefore(multiCharSearchContainer, container);
        searchRow.appendChild(multiCharSearchContainer); // 2b. Multi-char searchbar (ak je aktívny)

        searchRow.appendChild(viewTypeWrapper); // 3. Filtre zobrazenia (Ikony / Text)
        
        searchInput.setAttribute("list", "search-suggestions");
        searchInput.setAttribute("autocomplete", "off");
    }

    // Nastavenie eventov pre X tlačidlá v multi-char poliach
    multiCharSearchContainer.querySelectorAll(".input-clear-wrapper").forEach(wrapper => {
        const inp = wrapper.querySelector("input");
        const btn = wrapper.querySelector(".input-clear-btn");
        inp.addEventListener("input", () => {
            btn.style.display = inp.value ? "block" : "none";
            triggerMultiCharSearch();
        });
        btn.addEventListener("click", () => {
            inp.value = "";
            btn.style.display = "none";
            triggerMultiCharSearch();
        });
    });

    document.getElementById("multiCharClearAllBtn")?.addEventListener("click", () => {
        multiCharSearchContainer.querySelectorAll(".multi-char-input").forEach(inp => inp.value = "");
        multiCharSearchContainer.querySelectorAll(".input-clear-btn").forEach(btn => btn.style.display = "none");
        triggerMultiCharSearch();
    });

    const pinned = localStorage.getItem("pinnedMode") || "home";
    const dashboard = document.getElementById("home-dashboard");
    const mainSection = document.querySelector(".roster-section");
    const subLoc = document.querySelector('.sub-location');

    if (pinned === "home") {
        if (dashboard) dashboard.style.display = "block";
        if (mainSection) mainSection.style.display = "none";
        if (subLoc) subLoc.textContent = "HOME";
        applyMode("home");
    } else {
        if (dashboard) dashboard.style.display = "none";
        if (mainSection) mainSection.style.display = "block";
        loadCountersForCategory(pinned);
        if (subLoc) subLoc.textContent = pinned === "war" ? "ALLIANCE WAR" : "COSMIC CRUCIBLE";
        applyMode(pinned);
    }
    updatePinUI();
});

document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "mainModeSelect") {
        currentMode = e.target.value;
        const ccPlannerSection = document.getElementById("crucible-planner");
        
        if (typeof viewTypeWrapper !== 'undefined' && viewTypeWrapper) {
            viewTypeWrapper.style.display = (currentMode === "characters" || currentMode === "sim6") ? "none" : "flex"; 
        }
        
        // Prepínanie viditeľnosti medzi štandardným searchbarom a 5-poľovým searchbarom
        if (currentMode === "sim6") {
            if (searchInputWrapper) searchInputWrapper.style.display = "none";
            if (multiCharSearchContainer) multiCharSearchContainer.style.display = "none";
            if (countElement) countElement.style.display = "none";
        } else if (currentMode === "char") {
            if (searchInputWrapper) searchInputWrapper.style.display = "none";
            if (multiCharSearchContainer) multiCharSearchContainer.style.display = "flex";
            if (countElement) countElement.style.display = "block";
        } else {
            if (searchInputWrapper) searchInputWrapper.style.display = "flex";
            if (multiCharSearchContainer) multiCharSearchContainer.style.display = "none";
            if (countElement) countElement.style.display = "block";
        }
        
        updateSearchSuggestions(); 
        
        if (searchInput && currentMode !== "char") {
            searchInput.value = "";
            clearSearchBtn.style.display = "none";
            
            if (currentMode === "def") {
                searchInput.placeholder = "Zadaj tím v obrane (DEF)...";
            } else if (currentMode === "atk" || currentMode === "off") {
                searchInput.placeholder = "Zadaj tím v útoku (OFF)...";
            } else if (currentMode === "characters") {
                searchInput.placeholder = "Vyhľadaj postavu...";
            } else {
                searchInput.placeholder = "Zadaj názov tímu alebo postavy...";
            }
            
            if (typeof container !== 'undefined' && container) {
                container.style.display = (currentMode === "sim6") ? "none" : "flex";
                container.innerHTML = ""; 
            }
            
            if (currentMode === "characters") {
                if (ccPlannerSection) ccPlannerSection.style.display = "none";
                if (typeof renderCharacters === 'function') renderCharacters(allCharacters);
            } else if (currentMode === "sim6") {
                if (ccPlannerSection) ccPlannerSection.style.display = "block";
                refreshAllSim6Rooms();
                updateSearchSuggestions();
            } else {
                if (ccPlannerSection) ccPlannerSection.style.display = "none";
                if (typeof renderCounters === 'function') {
                    renderCounters([]);
                }
            }
        } else if (currentMode === "char") {
            if (typeof container !== 'undefined' && container) {
                container.style.display = "flex";
                container.innerHTML = "";
            }
            triggerMultiCharSearch();
        }
        setTimeout(() => {
            updateSearchSuggestions();
        }, 10);
    }
});

viewTypeWrapper.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        viewTypeWrapper.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        
        currentViewType = e.target.getAttribute("data-view");
        
        if (currentMode === "char") {
            triggerMultiCharSearch();
        } else if (currentMode !== "characters" && searchInput && searchInput.value.trim() !== "") {
            searchInput.dispatchEvent(new Event('input'));
        }
    });
});

function renderCharacters(characters) {
    if (!container) return;
    container.style.display = "grid"; 
    container.innerHTML = "";
    
    if (!characters || characters.length === 0) {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 10px; width: 100%;'>Nenašli sa žiadne postavy.</p>";
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
    
    const openKeys = new Set();
    container.querySelectorAll(".counter-group.open").forEach(group => {
        const key = group.getAttribute("data-key");
        if (key) openKeys.add(key);
    });

    container.innerHTML = "";
    container.style.display = "flex";
    container.style.flexDirection = "row";
    container.style.flexWrap = "wrap";

    const isCharMode = (currentMode === "char");
    const isAtkMode = (currentMode === "atk");

    const hasInputValues = isCharMode 
        ? Array.from(multiCharSearchContainer.querySelectorAll(".multi-char-input")).some(i => i.value.trim() !== "")
        : (searchInput && searchInput.value.trim() !== "");

    if (!hasInputValues) {
        container.innerHTML = `<p style='color: #aaa; text-align: center; padding: 10px; width: 100%;'>${isCharMode ? 'Začni písať do polí pre vyhľadanie podľa postáv v def tímoch.' : 'Začni písať pre vyhľadanie tímových counterov.'}</p>`;
        if (countElement) countElement.innerText = "Počet nájdených skupín: 0";
        return;
    }

    if (!counters || counters.length === 0) {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 10px; width: 100%;'>Nenašli sa žiadne zodpovedajúce countery.</p>";
        if (countElement) countElement.innerText = "Počet nájdených skupín: 0";
        return;
    }

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
        if (container.querySelector(`[data-key="${group.key}"]`)) return;

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

if (container) {
    container.addEventListener("click", (e) => {
        const btn = e.target.closest(".vote-btn");
        if (!btn) return;
        const voteContainer = btn.closest(".vote-container");
        const counterId = voteContainer.getAttribute("data-counter-id");
        const voteType = btn.getAttribute("data-type"); 
        const storageKey = `vote_${currentCategory}_${counterId}`;
        const previousVote = localStorage.getItem(storageKey);
        if (previousVote === voteType) return;
        
        localStorage.setItem(storageKey, voteType);
        voteContainer.querySelectorAll(".vote-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        const counterVoteRef = ref(db, `counters/${currentCategory}/${counterId}/votes`);
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

function showCharacterDetail(char) {
    history.pushState({ view: "detail" }, "");
    container.style.display = "none";
    if (searchInputWrapper) searchInputWrapper.style.display = "none";
    if (multiCharSearchContainer) multiCharSearchContainer.style.display = "none";
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

async function initDataSequential() {
    try {
        const charsSnap = await get(ref(db, 'characters/'));
        if (charsSnap.exists()) {
            allCharacters = Object.values(charsSnap.val());
            if (currentMode === "characters") renderCharacters(allCharacters);
        }
        const teamsSnap = await get(ref(db, 'teams/'));
        if (teamsSnap.exists()) allTeams = teamsSnap.val();
        
        onValue(ref(db, 'characters/'), (snapshot) => {
            const data = snapshot.val();
            if (data) { 
                allCharacters = Object.values(data); 
                if (currentMode === "characters") renderCharacters(allCharacters); 
            }
        });
        onValue(ref(db, 'teams/'), (snapshot) => { 
            if (snapshot.val()) {
                allTeams = snapshot.val();
                refreshAllSim6Rooms();
            }
        });
        
        loadCountersForCategory(currentCategory);
        updateSearchSuggestions();
    } catch (error) { console.error("Chyba načítania:", error); }
}

initDataSequential();

function updateSearchSuggestions(forcedMode) {
    const list = document.getElementById("search-suggestions");
    if (!list) return;
    
    const activeMode = forcedMode || document.getElementById("mainModeSelect")?.value || currentMode;
    let options = [];

    if (activeMode === "characters" || activeMode === "char" || currentCategory === "home") {
        options = allCharacters.map(c => c.name);
    } else if (activeMode === "def") {
        options = [...new Set(allCounters.map(item => allTeams[item.defense]?.name || item.defense).filter(Boolean))];
    } else if (activeMode === "atk") {
        options = [...new Set(allCounters.map(item => allTeams[item.offense]?.name || item.offense).filter(Boolean))];
    } else if (activeMode === "sim6") {
        options = [...new Set(allCounters.map(item => allTeams[item.defense]?.name || item.defense).filter(Boolean))];
    } else {
        options = Object.values(allTeams).map(t => t.name);
    }

    const newHtml = options.sort().map(opt => `<option value="${opt}">`).join("");
    if (list.innerHTML !== newHtml) {
        list.innerHTML = newHtml;
    }
}

const navMenu = document.getElementById("navMenu");
if (navMenu) {
    navMenu.addEventListener("change", (e) => {
        const val = e.target.value;
        const dashboard = document.getElementById("home-dashboard");
        const mainSection = document.querySelector(".roster-section");
        const subLoc = document.querySelector('.sub-location');
        const mainModeSelect = document.getElementById("mainModeSelect");

        if (mainModeSelect) {
            const hasSim6 = mainModeSelect.querySelector('option[value="sim6"]');
            if (val === "crucible") {
                if (!hasSim6) {
                    const opt = document.createElement("option");
                    opt.value = "sim6";
                    opt.textContent = "🎲 SIMULÁCIA 6 TÍMOV";
                    mainModeSelect.appendChild(opt);
                }
            } else {
                if (hasSim6) {
                    hasSim6.remove();
                    if (currentMode === "sim6") {
                        mainModeSelect.value = "characters";
                        mainModeSelect.dispatchEvent(new Event('change'));
                    }
                }
            }
        }

        if (val === "home") {
            if (dashboard) dashboard.style.display = "block";
            if (mainSection) mainSection.style.display = "none";
            if (subLoc) subLoc.textContent = "HOME";
        } else if (val === "war" || val === "crucible") {
            if (dashboard) dashboard.style.display = "none";
            if (mainSection) mainSection.style.display = "block";
            
            loadCountersForCategory(val);
            if (subLoc) {
                subLoc.textContent = val === "war" ? "ALLIANCE WAR" : "COSMIC CRUCIBLE";
            }
        } else {
            const pageMap = {
                "admin": "admin.html",
                "arena": "arena.html",
                "war sim": "war sim.html",
                "spat": "index.html"
            };
            if (pageMap[val]) {
                window.location.href = pageMap[val];
            }
        }
        applyMode(e.target.value);
        updateSearchSuggestions();
        updatePinUI();
    });
}

function loadCountersForCategory(category) {
    currentCategory = category;
    if (countersListener) {
        countersListener();
    }
    countersListener = onValue(ref(db, `counters/${category}/`), (snapshot) => {
        const data = snapshot.val();
        allCounters = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
        
        if (currentMode !== "characters" && currentMode !== "sim6") {
            if (currentMode === "char") {
                triggerMultiCharSearch();
            } else if (searchInput && searchInput.value.trim() !== "") {
                searchInput.dispatchEvent(new Event('input'));
            } else {
                renderCounters([]);
            }
        } else if (currentMode === "characters") {
            renderCharacters(allCharacters);
        }

        updateSearchSuggestions();
        refreshAllSim6Rooms();
    });
}

// Logika pre spracovanie 5 polí v móde "char"
function triggerMultiCharSearch() {
    const inputs = multiCharSearchContainer.querySelectorAll(".multi-char-input");
    const warningEl = document.getElementById("multiCharWarning");
    const searchTerms = [];
    const lowerTermsSet = new Set();
    let hasDuplicates = false;

    inputs.forEach(inp => {
        const val = inp.value.trim().toLowerCase();
        if (val) {
            if (lowerTermsSet.has(val)) {
                hasDuplicates = true;
            } else {
                lowerTermsSet.add(val);
            }
            searchTerms.push(val);
        }
    });

    if (warningEl) {
        warningEl.style.display = hasDuplicates ? "block" : "none";
    }

    if (searchTerms.length === 0) {
        renderCounters([]);
        return;
    }

    // Vyhľadávanie postáv iba v DEF tímoch
    const filtered = allCounters.filter(item => {
        const defTeamData = allTeams[item.defense] || {};
        const defChars = (defTeamData.members || []).map(n => n.toLowerCase());

        // Všetky zadané postavy sa musia nachádzať v def tíme (nezáleží na poradí)
        return searchTerms.every(term => defChars.some(dc => dc.includes(term)));
    });

    renderCounters(filtered);
}

if (searchInput) {
    searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") searchInput.blur(); });
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchTerm ? "block" : "none";

        if (currentMode === "characters" || currentCategory === "home") {
            renderCharacters(allCharacters.filter(char => char.name && char.name.toLowerCase().includes(searchTerm)));
        } else {
            if (!searchTerm) { 
                renderCounters([]); 
                return; 
            }
            renderCounters(allCounters.filter(item => {
                const defTeamData = allTeams[item.defense] || {};
                const offTeamData = allTeams[item.offense] || {};

                if (currentMode === "def") return (defTeamData.name || "").toLowerCase().includes(searchTerm) || (item.defense || "").toLowerCase().includes(searchTerm);
                if (currentMode === "atk") return (offTeamData.name || "").toLowerCase().includes(searchTerm) || (item.offense || "").toLowerCase().includes(searchTerm);
                
                const defTeamName = (defTeamData.name || item.defense || "").toLowerCase();
                const atkTeamName = (offTeamData.name || item.offense || "").toLowerCase();
                return defTeamName.includes(searchTerm) || atkTeamName.includes(searchTerm);
            }));
        }
    });

    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearSearchBtn.style.display = "none";
        searchInput.dispatchEvent(new Event('input'));
    });
}

const backToTopBtn = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
    if(backToTopBtn) backToTopBtn.style.display = (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) ? "block" : "none";
});

window.addEventListener("popstate", () => {
    if (detailContainer && detailContainer.style.display === "block") {
        detailContainer.style.display = "none";
        container.style.display = "flex"; 
        if (currentMode === "char") {
            if (multiCharSearchContainer) multiCharSearchContainer.style.display = "flex";
            if (countElement) countElement.style.display = "block";
        } else if (currentMode !== "sim6") {
            if (searchInputWrapper) searchInputWrapper.style.display = "flex";
            if (countElement) countElement.style.display = "block";
        }
        if (searchRow) searchRow.style.display = "flex";
        if (currentMode === "characters") renderCharacters(allCharacters);
        else if (currentMode === "char") triggerMultiCharSearch();
        else searchInput.dispatchEvent(new Event('input'));
    }
});

if (backToTopBtn) backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: 'smooth' }));


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

const roomPreferences = {};
let tempUnavailableChars = [];

const ccStyle = document.createElement("style");
ccStyle.textContent = `
    #crucible-planner { display: none; padding: 20px; max-width: 1200px; margin: 0 auto; }
    .cc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
    .cc-node { background: #081226; border: 1px solid #1a3c61; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; }
    .cc-node h3 { color: #00d2ff; margin-top: 0; margin-bottom: 10px; font-size: 14px; text-align: center; }
    
    .search-input-wrapper { position: relative; width: 100%; margin-bottom: 8px; display: flex; align-items: center; }
    .cc-input { width: 100%; padding: 8px 30px 8px 8px; background: #051329; border: 1px solid #00509e; color: white; border-radius: 4px; box-sizing: border-box; }
    .clear-search-btn { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #8a9ba8; font-size: 14px; cursor: pointer; display: none; padding: 0 4px; z-index: 2; }
    .clear-search-btn:hover { color: #fff; }

    .cc-node-actions { display: flex; justify-content: space-between; gap: 5px; margin-bottom: 8px; }
    .cc-btn-small { background: #112544; color: #00d2ff; border: 1px solid #00509e; border-radius: 3px; font-size: 11px; padding: 4px 8px; cursor: pointer; transition: 0.2s; flex: 1; }
    .cc-btn-small:hover { background: #00509e; color: #fff; }
    .cc-counter-list { max-height: 220px; overflow-y: auto; font-size: 12px; background: #0c1a30; padding: 5px; border-radius: 4px; flex: 1; display: flex; flex-direction: column; }
    .cc-counter-item { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; padding: 5px; border-bottom: 1px solid #1a3c61; }
    .cc-counter-item:last-child { border-bottom: none; }
    .cc-counter-item input[type="checkbox"] { cursor: pointer; }
    .cc-counter-item.disabled-counter { opacity: 0.6; color: #e74c3c; }
    .cc-divider { font-size: 10px; color: #e74c3c; font-weight: bold; margin: 8px 0 4px 0; text-align: center; border-top: 1px dashed #e74c3c; padding-top: 4px; }
    
    #cc-validation-warning { display: none; margin-top: 15px; padding: 12px; background: #3a1c1c; border: 1px solid #e74c3c; border-radius: 6px; color: #ff6b6b; font-size: 13px; text-align: center; }

    #cc-results { margin-top: 20px; padding: 15px; background: #051329; border: 2px solid #ffcc00; border-radius: 8px; display: none; }
    .cc-result-row { padding: 10px; border-bottom: 1px dashed #1a3c61; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .cc-result-row:last-child { border-bottom: none; }
    
    .cc-result-label { color: #a0aec0; flex: 1; min-width: 200px; word-break: break-word; overflow-wrap: anywhere; font-weight: bold; }
    .cc-result-actions { text-align: right; max-width: 100%; display: flex; flex-direction: column; align-items: flex-end; }

    .cc-res-select { 
        background: #0c1a30; 
        border: 1px solid #00509e; 
        color: #2ecc71; 
        padding: 6px 10px; 
        border-radius: 4px; 
        font-weight: bold; 
        font-size: 12px; 
        cursor: pointer; 
        width: max-content;
        width: -moz-max-content;
        max-width: 100%;
        box-sizing: border-box;
        text-align: right; 
        text-align-last: right; 
        direction: rtl;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
    .cc-res-select option {
        direction: ltr;
        text-align: left;
        background: #081226;
        color: #fff;
        font-weight: normal;
    }

    #char-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; justify-content: center; align-items: center; }
    .char-modal-content { background: #081226; border: 2px solid #00509e; padding: 0; width: 90%; max-width: 900px; max-height: 85vh; border-radius: 8px; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; position: relative; }
    
    .modal-close-top { position: absolute; top: 10px; right: 15px; background: none; border: none; color: #8a9ba8; font-size: 22px; font-weight: bold; cursor: pointer; z-index: 100; transition: color 0.2s; }
    .modal-close-top:hover { color: #e74c3c; }

    .modal-header { padding: 15px 40px 10px 20px; background: #081226; border-bottom: 1px solid #1a3c61; position: sticky; top: 0; z-index: 20; }
    .modal-body { padding: 15px 20px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 10px 20px; background: #051329; border-top: 1px solid #1a3c61; display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: 0; z-index: 10; }
    
    .modal-filters { display: flex; gap: 8px; margin-top: 10px; width: 100%; align-items: center; flex-wrap: nowrap; }
    .modal-filters .search-input-wrapper { flex: 1; margin-bottom: 0; width: auto; }
    .modal-filters select { padding: 8px; background: #051329; border: 1px solid #1a3c61; color: white; border-radius: 4px; font-size: 12px; box-sizing: border-box; min-width: 180px; }
    
    .scroll-btn { background: #112544; color: #00d2ff; border: 1px solid #00509e; padding: 7px 11px; border-radius: 4px; cursor: pointer; font-size: 13px; transition: 0.2s; white-space: nowrap; }
    .scroll-btn:hover { background: #00509e; color: #fff; }

    .char-grid-modal { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; margin-top: 15px; }
    .modal-char-item { cursor: pointer; text-align: center; position: relative; display: flex; flex-direction: column; align-items: center; }
    .modal-char-item .char-thumb { width: 60px; height: 60px; border: 2px solid #333; border-radius: 4px; background-size: cover; background-position: top center; background-color: #05264f; transition: all 0.2s; }
    .modal-char-item.unavailable .char-thumb { filter: grayscale(100%) brightness(0.3); border-color: #e74c3c !important; }
    .modal-char-item.unavailable::after { content: '❌'; position: absolute; top: 15px; font-size: 20px; }
    .modal-char-name { font-size: 9px; color: #b0bec5; margin-top: 2px; word-break: break-word; width: 100%; }

    .cc-btn-danger { background: #3a1c1c; color: #e74c3c; border: 1px solid #e74c3c; border-radius: 4px; font-size: 11px; padding: 8px 12px; cursor: pointer; transition: 0.2s; }
    .cc-btn-danger:hover { background: #e74c3c; color: #fff; }
`;
document.head.appendChild(ccStyle);

const ccHTML = `
    <section id="crucible-planner">
        <h2 style="text-align: center; color: #ffcc00; margin-bottom: 10px;">CRUCIBLE PLANNER (BETA)</h2>
        <div style="text-align: center; margin-bottom: 20px; display: flex; justify-content: center; gap: 10px;">
            <button id="reset-rooms-btn" class="cc-btn-danger" style="padding: 6px 14px; font-size: 12px;">↺ Resetovať obrany miestností</button>
            <button id="open-char-modal-btn" class="view-btn active" style="padding: 6px 14px; font-size: 12px; background: #112544;">🚫 Spravovať nedostupné postavy</button>
        </div>
        <div class="cc-grid" id="cc-nodes-container"></div>
        <div id="cc-validation-warning"></div>
        <div style="text-align: center; margin-top: 20px;">
            <button id="cc-calc-btn" class="cta-btn">VYPOČÍTAŤ UNIKÁTNE COUNTERY</button>
        </div>
        <div id="cc-results"></div>
    </section>

    <div id="char-modal">
        <div class="char-modal-content">
            <button class="modal-close-top" id="close-modal-top-btn" title="Zavrieť bez uloženia">✖</button>
            <div class="modal-header">
                <h3 style="color: #ffcc00; text-align: center; margin: 0 0 5px 0;">KLIKNUTÍM OZNAČ POSTAVY, KTORÉ NEMÁŠ ALEBO SÚ SLABÉ</h3>
                <p style="color: #8a9ba8; text-align: center; font-size: 12px; margin: 0;">Vybrané postavy budú automaticky vylúčené zo všetkých tímov v simulačnom planneri.</p>
                <div class="modal-filters">
                    <div class="search-input-wrapper">
                        <input type="text" id="modal-char-search" class="cc-input" placeholder="Filtrovať podľa mena/traitov...">
                        <button class="clear-search-btn" id="clear-modal-search">✖</button>
                    </div>
                    <select id="modal-char-filter">
                        <option value="all-alpha">Všetky postavy (abecedne)</option>
                        <option value="unavail-first">Všetky postavy (vyradené hore)</option>
                        <option value="unavail-last">Všetky postavy (vyradené dole)</option>
                        <option value="unavail-only">Iba vyradené postavy</option>
                        <option value="avail-only">Iba dostupné postavy</option>
                    </select>
                    <button id="scroll-to-top" class="scroll-btn" title="Na začiatok zoznamu">⬆</button>
                    <button id="scroll-to-bottom" class="scroll-btn" title="Na koniec zoznamu">⬇</button>
                </div>
            </div>
            <div class="modal-body" id="modal-body-scroll">
                <div class="char-grid-modal" id="modal-char-grid"></div>
            </div>
            <div class="modal-footer">
                <button id="reset-char-modal-btn" class="cc-btn-danger">↺ Resetovať vyradené postavy</button>
                <button id="save-close-char-modal-btn" class="view-btn active" style="padding: 8px 20px;">Uložiť a zavrieť</button>
            </div>
        </div>
    </div>
`;

const rosterSection = document.querySelector(".roster-section");
if (rosterSection) {
    rosterSection.insertAdjacentHTML("afterend", ccHTML);
}

const ccPlannerSection = document.getElementById("crucible-planner");
const ccNodesContainer = document.getElementById("cc-nodes-container");
const ccCalcBtn = document.getElementById("cc-calc-btn");
const ccResults = document.getElementById("cc-results");
const ccValidationWarning = document.getElementById("cc-validation-warning");
const resetRoomsBtn = document.getElementById("reset-rooms-btn");

const charModal = document.getElementById("char-modal");
const openModalBtn = document.getElementById("open-char-modal-btn");
const closeModalTopBtn = document.getElementById("close-modal-top-btn");
const saveCloseModalBtn = document.getElementById("save-close-char-modal-btn");
const resetModalBtn = document.getElementById("reset-char-modal-btn");
const modalCharGrid = document.getElementById("modal-char-grid");
const modalCharSearch = document.getElementById("modal-char-search");
const clearModalSearch = document.getElementById("clear-modal-search");
const modalCharFilter = document.getElementById("modal-char-filter");
const modalBodyScroll = document.getElementById("modal-body-scroll");

const scrollTopBtn = document.getElementById("scroll-to-top");
const scrollBottomBtn = document.getElementById("scroll-to-bottom");

if (scrollTopBtn && modalBodyScroll) scrollTopBtn.addEventListener("click", () => { modalBodyScroll.scrollTop = 0; });
if (scrollBottomBtn && modalBodyScroll) scrollBottomBtn.addEventListener("click", () => { modalBodyScroll.scrollTop = modalBodyScroll.scrollHeight; });

function isCharUnavailable(charName, unavailableList) {
    if (!charName) return false;
    const lowerName = charName.toLowerCase();
    return unavailableList.some(un => un.toLowerCase() === lowerName);
}

function getUnavailableChars() {
    try {
        return JSON.parse(localStorage.getItem("sim6_unavailable_chars") || "[]");
    } catch(e) { return []; }
}

function saveUnavailableChars(arr) {
    localStorage.setItem("sim6_unavailable_chars", JSON.stringify(arr));
}

function getSavedModalFilter() {
    return localStorage.getItem("sim6_modal_filter_type") || "all-alpha";
}

function saveModalFilter(filterVal) {
    localStorage.setItem("sim6_modal_filter_type", filterVal);
}

function getSavedDefenses() {
    try {
        return JSON.parse(localStorage.getItem("sim6_saved_defenses") || "{}");
    } catch(e) { return {}; }
}

function saveDefenses(defMap) {
    localStorage.setItem("sim6_saved_defenses", JSON.stringify(defMap));
}

function resetModalSearchInput() {
    if (modalCharSearch) modalCharSearch.value = "";
    if (clearModalSearch) clearModalSearch.style.display = "none";
}

if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
        tempUnavailableChars = [...getUnavailableChars()];
        if (modalCharFilter) modalCharFilter.value = getSavedModalFilter();
        if (charModal) charModal.style.display = "flex";
        applyModalCharFilters();
    });
}

if (closeModalTopBtn) {
    closeModalTopBtn.addEventListener("click", () => {
        tempUnavailableChars = [];
        resetModalSearchInput();
        if (charModal) charModal.style.display = "none";
    });
}

if (saveCloseModalBtn) {
    saveCloseModalBtn.addEventListener("click", () => {
        saveUnavailableChars(tempUnavailableChars);
        if (modalCharFilter) saveModalFilter(modalCharFilter.value);
        resetModalSearchInput();
        if (charModal) charModal.style.display = "none";
        refreshAllSim6Rooms();
        if (ccResults && ccResults.style.display === "block") {
            calculateCruciblePlanner();
        }
    });
}

if (resetModalBtn) {
    resetModalBtn.addEventListener("click", () => {
        if (confirm("Naozaj chceš resetovať vyradenie všetkých postáv v tomto okne?")) {
            tempUnavailableChars = [];
            applyModalCharFilters();
        }
    });
}

if (resetRoomsBtn) {
    resetRoomsBtn.addEventListener("click", () => {
        if (confirm("Naozaj chceš vymazať zadané obrany zo všetkých miestností?")) {
            for (let i = 1; i <= 6; i++) {
                const inputEl = document.getElementById(`cc-def-${i}`);
                const clearBtn = document.getElementById(`cc-clear-${i}`);
                if (inputEl) inputEl.value = "";
                if (clearBtn) clearBtn.style.display = "none";
                updateRoomUI(i);
            }
            for (let sKey in roomPreferences) {
                delete roomPreferences[sKey];
            }
            saveDefenses({});
            validateDefenseSetup();
            if (ccResults) ccResults.style.display = "none";
        }
    });
}

if (modalCharSearch) {
    modalCharSearch.addEventListener("input", () => {
        if (clearModalSearch) clearModalSearch.style.display = modalCharSearch.value ? "block" : "none";
        applyModalCharFilters();
    });
}

if (clearModalSearch) {
    clearModalSearch.addEventListener("click", () => {
        resetModalSearchInput();
        applyModalCharFilters();
    });
}

if (modalCharFilter) {
    modalCharFilter.addEventListener("change", () => {
        saveModalFilter(modalCharFilter.value);
        applyModalCharFilters();
    });
}

function applyModalCharFilters() {
    if (!modalCharSearch || !modalCharFilter) return;
    const term = modalCharSearch.value.toLowerCase().trim();
    const filterType = modalCharFilter.value;
    const sourceChars = typeof allCharacters !== "undefined" ? allCharacters : [];

    let list = sourceChars.filter(c => {
        const charName = typeof c === "string" ? c : c.name;
        const nameMatch = charName && charName.toLowerCase().includes(term);
        let traitMatch = false;
        if (c.traits) {
            if (Array.isArray(c.traits)) {
                traitMatch = c.traits.some(t => t.toLowerCase().includes(term));
            } else if (typeof c.traits === 'string') {
                traitMatch = c.traits.toLowerCase().includes(term);
            }
        }
        return nameMatch || traitMatch;
    });

    if (filterType === "unavail-only") {
        list = list.filter(c => isCharUnavailable(typeof c === "string" ? c : c.name, tempUnavailableChars));
    } else if (filterType === "avail-only") {
        list = list.filter(c => !isCharUnavailable(typeof c === "string" ? c : c.name, tempUnavailableChars));
    } else if (filterType === "all-alpha") {
        list.sort((a, b) => (typeof a === "string" ? a : a.name).localeCompare(typeof b === "string" ? b : b.name));
    } else if (filterType === "unavail-first") {
        list.sort((a, b) => {
            const nameA = typeof a === "string" ? a : a.name;
            const nameB = typeof b === "string" ? b : b.name;
            const aU = isCharUnavailable(nameA, tempUnavailableChars) ? 0 : 1;
            const bU = isCharUnavailable(nameB, tempUnavailableChars) ? 0 : 1;
            return aU - bU || nameA.localeCompare(nameB);
        });
    } else if (filterType === "unavail-last") {
        list.sort((a, b) => {
            const nameA = typeof a === "string" ? a : a.name;
            const nameB = typeof b === "string" ? b : b.name;
            const aU = isCharUnavailable(nameA, tempUnavailableChars) ? 1 : 0;
            const bU = isCharUnavailable(nameB, tempUnavailableChars) ? 1 : 0;
            return aU - bU || nameA.localeCompare(nameB);
        });
    }

    renderModalCharacters(list);
}

function renderModalCharacters(chars) {
    if (!modalCharGrid) return;
    modalCharGrid.innerHTML = "";

    chars.forEach(char => {
        const cName = typeof char === "string" ? char : char.name;
        const cImg = char.image || char.avatar || char.icon || '';
        const isUnavail = isCharUnavailable(cName, tempUnavailableChars);
        
        const item = document.createElement("div");
        item.className = `modal-char-item ${isUnavail ? 'unavailable' : ''}`;
        item.innerHTML = `
            <div class="char-thumb" style="${cImg ? `background-image: url('${cImg}');` : ''}"></div>
            <span class="modal-char-name">${cName}</span>
        `;
        item.addEventListener("click", () => {
            if (isCharUnavailable(cName, tempUnavailableChars)) {
                tempUnavailableChars = tempUnavailableChars.filter(n => n.toLowerCase() !== cName.toLowerCase());
                item.classList.remove("unavailable");
            } else {
                tempUnavailableChars.push(cName);
                item.classList.add("unavailable");
            }
            if (modalCharFilter && (modalCharFilter.value === "unavail-only" || modalCharFilter.value === "avail-only")) {
                applyModalCharFilters();
            }
        });
        modalCharGrid.appendChild(item);
    });
}

const savedDefs = getSavedDefenses();

if (ccNodesContainer) {
    for (let i = 1; i <= 6; i++) {
        const nodeDiv = document.createElement("div");
        nodeDiv.className = "cc-node";
        nodeDiv.innerHTML = `
            <h3>Miestnosť ${i}</h3>
            <div class="search-input-wrapper">
                <input type="text" class="cc-input" id="cc-def-${i}" placeholder="Zadaj obranu (napr. x-men)..." list="search-suggestions" autocomplete="off">
                <button class="clear-search-btn" id="cc-clear-${i}">✖</button>
            </div>
            <div class="cc-node-actions">
                <button class="cc-btn-small" onclick="toggleRoomCheckboxes(${i}, true)">Označiť všetko</button>
                <button class="cc-btn-small" onclick="toggleRoomCheckboxes(${i}, false)">Odoznačiť všetko</button>
            </div>
            <div class="cc-counter-list" id="cc-list-${i}">
                <p style="color:#556b85; text-align:center; font-style:italic;">Zadaj tím pre zobrazenie možností</p>
            </div>
        `;
        ccNodesContainer.appendChild(nodeDiv);

        const inputEl = document.getElementById(`cc-def-${i}`);
        const clearBtn = document.getElementById(`cc-clear-${i}`);

        if (savedDefs[i]) {
            inputEl.value = savedDefs[i];
            clearBtn.style.display = "block";
        }

        inputEl.addEventListener("focus", () => {
            const list = document.getElementById("search-suggestions");
            if (list && list.children.length === 0 && typeof updateSearchSuggestions === "function") {
                updateSearchSuggestions("sim6");
            }
        });

        const handleDefChange = () => {
            clearBtn.style.display = inputEl.value ? "block" : "none";
            
            const currentDefs = getSavedDefenses();
            currentDefs[i] = inputEl.value.trim();
            saveDefenses(currentDefs);

            for (let sKey in roomPreferences) {
                delete roomPreferences[sKey][i];
            }
            updateRoomUI(i);
            validateDefenseSetup();
        };

        inputEl.addEventListener("input", handleDefChange);

        clearBtn.addEventListener("click", () => {
            inputEl.value = "";
            handleDefChange();
        });
    }
}

window.toggleRoomCheckboxes = function(roomNum, checkState) {
    const checkboxes = document.querySelectorAll(`#cc-list-${roomNum} input[type="checkbox"]:not(:disabled)`);
    checkboxes.forEach(cb => cb.checked = checkState);
};

function validateDefenseSetup() {
    if (!ccValidationWarning) return;
    ccValidationWarning.style.display = "none";
    ccValidationWarning.innerHTML = "";
    
    if (typeof allTeams === "undefined") return;

    const defMap = {};
    const charMap = {};
    const warnings = [];

    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`cc-def-${i}`);
        if (!input) continue;
        const defVal = input.value.trim();
        if (!defVal) continue;
        const lowerDef = defVal.toLowerCase();

        if (defMap[lowerDef]) {
            defMap[lowerDef].push(i);
        } else {
            defMap[lowerDef] = [i];
        }

        const foundKey = Object.keys(allTeams).find(k => (allTeams[k]?.name || k).toLowerCase() === lowerDef);
        const members = foundKey ? (allTeams[foundKey]?.members || []) : [];

        members.forEach(m => {
            const lowerM = m.toLowerCase();
            if (!charMap[lowerM]) charMap[lowerM] = { name: m, rooms: [] };
            charMap[lowerM].rooms.push(i);
        });
    }

    for (let defName in defMap) {
        if (defMap[defName].length > 1) {
            const teamRealName = Object.values(allTeams).find(t => t.name?.toLowerCase() === defName)?.name || defName;
            warnings.push(`⚠️ Tím <b>${teamRealName}</b> je priradený viackrát (Miestnosti: ${defMap[defName].join(", ")})`);
        }
    }

    for (let cKey in charMap) {
        if (charMap[cKey].rooms.length > 1) {
            warnings.push(`⚠️ Postava <b>${charMap[cKey].name}</b> sa nachádza vo viac obranách naraz (Miestnosti: ${charMap[cKey].rooms.join(", ")})`);
        }
    }

    if (warnings.length > 0) {
        ccValidationWarning.innerHTML = warnings.join("<br>");
        ccValidationWarning.style.display = "block";
    }
}

function updateRoomUI(roomNum) {
    const inputEl = document.getElementById(`cc-def-${roomNum}`);
    const listEl = document.getElementById(`cc-list-${roomNum}`);

    if (!inputEl || !listEl) return;

    const term = inputEl.value.toLowerCase().trim();
    listEl.innerHTML = "";

    if (term.length < 2) {
        listEl.innerHTML = `<p style="color:#556b85; text-align:center;">Zadaj tím...</p>`;
        return;
    }

    if (typeof allCounters === "undefined" || !allCounters || allCounters.length === 0 || typeof allTeams === "undefined") {
        listEl.innerHTML = `<p style="color:#00d2ff; text-align:center; font-style:italic;">Načítavam dáta z databázy...</p>`;
        return;
    }

    const unavailable = getUnavailableChars();

    const foundCounters = allCounters.filter(c => {
        const defTeam = allTeams[c.defense]?.name || c.defense;
        return defTeam && defTeam.toLowerCase().includes(term);
    });

    if (foundCounters.length === 0) {
        listEl.innerHTML = `<p style="color:#e74c3c; text-align:center;">Žiadny counter nenájdený.</p>`;
        return;
    }

    const usableCounters = [];
    const unusableCounters = [];

    foundCounters.forEach(counter => {
        const atkKey = counter.offense;
        const atkTeamData = allTeams[atkKey] || {};
        const atkTeamName = atkTeamData.name || atkKey;
        const atkMembers = atkTeamData.members || [];
        
        const missingChars = atkMembers.filter(m => isCharUnavailable(m, unavailable));

        const itemObj = { atkKey, atkTeamName, missingChars };
        if (missingChars.length > 0) {
            unusableCounters.push(itemObj);
        } else {
            usableCounters.push(itemObj);
        }
    });

    usableCounters.sort((a, b) => a.atkTeamName.localeCompare(b.atkTeamName));
    unusableCounters.sort((a, b) => a.atkTeamName.localeCompare(b.atkTeamName));

    usableCounters.forEach(item => {
        const div = document.createElement("div");
        div.className = "cc-counter-item";
        div.innerHTML = `
            <input type="checkbox" checked data-offense="${item.atkKey}">
            <span><b>${item.atkTeamName}</b></span>
        `;
        listEl.appendChild(div);
    });

    if (unusableCounters.length > 0) {
        if (usableCounters.length > 0) {
            const divider = document.createElement("div");
            divider.className = "cc-divider";
            divider.textContent = "--- NEPOUŽITEĽNÉ COUNTERY ---";
            listEl.appendChild(divider);
        }

        unusableCounters.forEach(item => {
            const div = document.createElement("div");
            div.className = "cc-counter-item disabled-counter";
            div.innerHTML = `
                <input type="checkbox" disabled data-offense="${item.atkKey}">
                <span><b>${item.atkTeamName}</b> <i style="font-size:11px;">(chýba: ${item.missingChars.join(", ")})</i></span>
            `;
            listEl.appendChild(div);
        });
    }
}

function calculateCruciblePlanner() {
    validateDefenseSetup();
    const baseRooms = [];
    const unavailable = getUnavailableChars();

    for (let i = 1; i <= 6; i++) {
        const defInput = document.getElementById(`cc-def-${i}`);
        const defName = defInput ? defInput.value : "";
        const checkedBoxes = document.querySelectorAll(`#cc-list-${i} input[type="checkbox"]:checked`);
        
        let allowedOffenses = Array.from(checkedBoxes).map(cb => {
            const atkKey = cb.getAttribute("data-offense");
            const counterObj = allCounters.find(c => c.defense === roomsDefKey(i) && c.offense === atkKey) || 
                               allCounters.find(c => c.offense === atkKey);
            return { 
                offense: atkKey, 
                ezCount: counterObj?.votes?.ez || 0,
                okCount: counterObj?.votes?.ok || 0
            };
        }).filter(opt => {
            const members = allTeams[opt.offense]?.members || [];
            return !members.some(m => isCharUnavailable(m, unavailable));
        });

        allowedOffenses.sort(sim6);
        
        baseRooms.push({
            roomNum: i,
            defense: defName || "Nezadané",
            options: allowedOffenses
        });
    }

    function roomsDefKey(roomNum) {
        const input = document.getElementById(`cc-def-${roomNum}`);
        if (!input) return null;
        const defVal = input.value.toLowerCase();
        const found = allCounters.find(c => (allTeams[c.defense]?.name || c.defense).toLowerCase() === defVal);
        return found ? found.defense : null;
    }

    if (!ccResults) return;
    ccResults.style.display = "block";
    ccResults.innerHTML = "<h3 style='color:#00d2ff; text-align:center;'>VÝSLEDKY (UNIKÁTNE KOMBINÁCIE):</h3>";

    let uniqueSolutions = [];

    function solveForOption(optionIdx, rankOffset) {
        let usedCharacters = new Set();
        let assignment = [];

        baseRooms.forEach(room => {
            const prefAtk = roomPreferences[optionIdx]?.[room.roomNum];

            if (room.options.length === 0) {
                assignment.push({ roomNum: room.roomNum, atk: null, conflicts: ["Žiadna dostupná možnosť"] });
                return;
            }

            if (prefAtk) {
                const atkMembers = allTeams[prefAtk]?.members || [];
                const conflicts = atkMembers.filter(char => usedCharacters.has(char));
                atkMembers.forEach(char => usedCharacters.add(char));
                assignment.push({ roomNum: room.roomNum, atk: prefAtk, conflicts });
                return;
            }

            const validOptions = room.options.filter(opt => {
                const members = allTeams[opt.offense]?.members || [];
                return !members.some(char => usedCharacters.has(char));
            });

            if (validOptions.length > 0) {
                const chosenOpt = validOptions[rankOffset] || validOptions[0];
                const atkKey = chosenOpt.offense;
                const atkMembers = allTeams[atkKey]?.members || [];
                atkMembers.forEach(char => usedCharacters.add(char));
                assignment.push({ roomNum: room.roomNum, atk: atkKey, conflicts: [] });
            } else {
                const fallbackOpt = room.options[0];
                const atkKey = fallbackOpt.offense;
                const atkMembers = allTeams[atkKey]?.members || [];
                const conflicts = atkMembers.filter(char => usedCharacters.has(char));
                atkMembers.forEach(char => usedCharacters.add(char));
                assignment.push({ roomNum: room.roomNum, atk: atkKey, conflicts });
            }
        });

        return assignment;
    }

    for (let sIdx = 0; sIdx < 3; sIdx++) {
        uniqueSolutions.push(solveForOption(sIdx, sIdx));
    }

    uniqueSolutions.forEach((solution, sIndex) => {
        if (!roomPreferences[sIndex]) {
            roomPreferences[sIndex] = {};
        }

        ccResults.innerHTML += `
            <div style="margin-top: 15px; border-top: 1px solid #00509e; padding-top: 10px;">
                <strong style="color: #ffcc00;">Možnosť ${sIndex + 1} ${sIndex === 0 ? '(Top 1 Countery)' : sIndex === 1 ? '(Top 2 Countery)' : '(Top 3 Countery)'}:</strong>
            </div>
        `;

        solution.forEach(sol => {
            const roomObj = baseRooms[sol.roomNum - 1];
            const currentAtk = sol.atk;
            
            if (!currentAtk) {
                ccResults.innerHTML += `
                    <div class="cc-result-row">
                        <div class="cc-result-label">Miestnosť ${sol.roomNum} (Def: ${roomObj.defense}):</div>
                        <span style="color:#e74c3c; font-weight:bold;">ŽIADNA MOŽNOSŤ</span>
                    </div>
                `;
                return;
            }

            let conflictText = "";
            if (sol.conflicts && sol.conflicts.length > 0) {
                conflictText = `<br><span style="color:#e74c3c; font-size:11px;">⚠️ Kryje sa postava/y: ${sol.conflicts.join(", ")}</span>`;
            }

            let selectOptionsHtml = `<option value="">-- Automatický výber --</option>`;
            roomObj.options.forEach(opt => {
                const tName = allTeams[opt.offense]?.name || opt.offense;
                const isSelected = currentAtk === opt.offense ? "selected" : "";
                selectOptionsHtml += `<option value="${opt.offense}" ${isSelected}>${tName}</option>`;
            });

            ccResults.innerHTML += `
                <div class="cc-result-row">
                    <div class="cc-result-label">Miestnosť ${sol.roomNum} (Def: ${roomObj.defense}):</div>
                    <div class="cc-result-actions">
                        <select class="cc-res-select" data-option="${sIndex}" data-room="${sol.roomNum}">
                            ${selectOptionsHtml}
                        </select>
                        ${conflictText}
                    </div>
                </div>
            `;
        });
    });

    document.querySelectorAll(".cc-res-select").forEach(selectEl => {
        selectEl.addEventListener("change", (e) => {
            const sIdx = e.target.getAttribute("data-option");
            const rNum = e.target.getAttribute("data-room");
            const selectedTeam = e.target.value;
            
            if (!roomPreferences[sIdx]) roomPreferences[sIdx] = {};

            if (selectedTeam) {
                roomPreferences[sIdx][rNum] = selectedTeam;
            } else {
                delete roomPreferences[sIdx][rNum];
            }
            
            calculateCruciblePlanner(); 
        });
    });
}

if (ccCalcBtn) ccCalcBtn.addEventListener("click", calculateCruciblePlanner);

function refreshAllSim6Rooms() {
    for (let i = 1; i <= 6; i++) {
        updateRoomUI(i);
    }
    validateDefenseSetup();
}

function applyMode(val) {
    const dashboard = document.getElementById("home-dashboard");
    const mainSection = document.querySelector(".roster-section");
    const ccPlannerSection = document.getElementById("crucible-planner");
    const subLoc = document.querySelector('.sub-location');
    const mainModeSelect = document.getElementById("mainModeSelect");
    const navMenuEl = document.getElementById("navMenu");

    if (navMenuEl && navMenuEl.value !== val) {
        navMenuEl.value = val;
    }

    if (searchInput) {
        searchInput.value = "";
        clearSearchBtn.style.display = "none";
    }

    if (mainModeSelect) {
        const hasSim6 = mainModeSelect.querySelector('option[value="sim6"]');
        if (val === "crucible") {
            if (!hasSim6) {
                const opt = document.createElement("option");
                opt.value = "sim6";
                opt.textContent = "🎲 SIMULÁCIA 6 TÍMOV";
                mainModeSelect.appendChild(opt);
            }
        } else {
            if (hasSim6) {
                hasSim6.remove();
            }
            if (currentMode === "sim6") {
                currentMode = "def";
                mainModeSelect.value = "def";
            }
        }
    }

    if (detailContainer) detailContainer.style.display = "none";

    if (val === "sim6") {
        currentMode = "sim6";
        if (dashboard) dashboard.style.display = "none";
        if (mainSection) mainSection.style.display = "none";
        if (ccPlannerSection) ccPlannerSection.style.display = "block";
        if (subLoc) subLoc.textContent = "SIMULÁCIA 6 TÍMOV";
        
        if (searchInputWrapper) searchInputWrapper.style.display = "none";
        if (multiCharSearchContainer) multiCharSearchContainer.style.display = "none";

        refreshAllSim6Rooms();
    } else {
        if (ccPlannerSection) ccPlannerSection.style.display = "none";

        if (val === "home") {
            if (dashboard) dashboard.style.display = "block";
            if (mainSection) mainSection.style.display = "none";
            if (subLoc) subLoc.textContent = "HOME";
        } else if (val === "war" || val === "crucible") {
            if (dashboard) dashboard.style.display = "none";
            if (mainSection) mainSection.style.display = "block";
            
            if (typeof viewTypeWrapper !== 'undefined' && viewTypeWrapper) {
                viewTypeWrapper.style.display = (currentMode === "characters") ? "none" : "flex"; 
            }

            if (currentMode === "char") {
                if (searchInputWrapper) searchInputWrapper.style.display = "none";
                if (multiCharSearchContainer) multiCharSearchContainer.style.display = "flex";
            } else {
                if (searchInputWrapper) searchInputWrapper.style.display = "flex";
                if (multiCharSearchContainer) multiCharSearchContainer.style.display = "none";
            }

            if (countElement) countElement.style.display = "block";
            if (searchRow) searchRow.style.display = "flex";

            if (subLoc) {
                subLoc.textContent = val === "war" ? "ALLIANCE WAR" : "COSMIC CRUCIBLE";
            }

            if (searchInput) {
                if (currentMode === "def") {
                    searchInput.placeholder = "Zadaj tím v obrane (DEF)...";
                } else if (currentMode === "atk" || currentMode === "off") {
                    searchInput.placeholder = "Zadaj tím v útoku (OFF)...";
                } else if (currentMode === "characters") {
                    searchInput.placeholder = "Vyhľadaj postavu...";
                } else {
                    searchInput.placeholder = "Zadaj názov tímu alebo postavy...";
                }
            }

            loadCountersForCategory(val);
        } else {
            const pageMap = {
                "admin": "admin.html",
                "arena": "arena.html",
                "war sim": "war sim.html",
                "spat": "index.html"
            };
            if (pageMap[val]) {
                window.location.href = pageMap[val];
            }
        }
    }

    if (typeof updateSearchSuggestions === "function") updateSearchSuggestions();
    if (typeof updatePinUI === "function") updatePinUI();
}

(function waitForFirebaseData() {
    let checkAttempts = 0;
    const interval = setInterval(() => {
        checkAttempts++;
        
        if (typeof allCounters !== "undefined" && Array.isArray(allCounters) && allCounters.length > 0) {
            clearInterval(interval);
            refreshAllSim6Rooms();
        }

        if (checkAttempts > 50) {
            clearInterval(interval);
        }
    }, 200);
})();