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
    const adminPanel = document.getElementById("admin-panel"); // Uisti sa, že máš toto ID v HTML

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
} else {
    console.warn("⚠️ Formulár 'login-form' nebol nájdený!");
}

// Odhlásenie
document.getElementById("logout-btn")?.addEventListener("click", () => {
    signOut(auth).then(() => {
        console.log("Odhlásené");
        location.reload();
    });
});

// Event Listener pre odoslanie formulára (s prevenciou refreshu)
document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault(); // TOTO ZASTAVÍ REFRESH
    const email = document.getElementById("login-email").value;
    const heslo = document.getElementById("login-password").value;

    signInWithEmailAndPassword(auth, email, heslo)
        .then(() => {
            console.log("Úspešne prihlásený!");
        })
        .catch((error) => {
            alert("Chyba pri prihlásení: " + error.message);
        });
});

// Event Listener pre odhlásenie
document.getElementById("logout-btn")?.addEventListener("click", () => {
    signOut(auth).then(() => {
        location.reload(); // Obnoví stránku po odhlásení
    });
});

// --- OSTATNÝ KÓD APLIKÁCIE ---

// Injekcia responzívnych štýlov
const responsiveStyle = document.createElement("style");
responsiveStyle.textContent = `
    header, .header, nav, .nav-bar, .top-nav { position: fixed !important; top: 0; left: 0; width: 100%; z-index: 2000; }
    body { padding-top: 85px !important; }
    #character-container { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px 0; }
    .detail-layout { display: flex; flex-wrap: nowrap; gap: 20px; background: #081226; color: white; padding: 20px; font-family: sans-serif; border: 1px solid #1a3c61; align-items: flex-start; }
    .detail-left { width: 250px; flex-shrink: 0; display: flex; flex-direction: column; }
    .char-avatar-block { width: 100%; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 15px; font-size: 13px; text-align: center; }
    .detail-right-container { display: flex; flex-grow: 1; gap: 20px; align-items: flex-start; }
    .ability-icons-col { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
    .ability-desc-col { flex-grow: 1; background: #0a1b35; border: 1px solid #1a3c61; padding: 20px; display: flex; flex-direction: column; max-height: 550px; box-sizing: border-box; }
    .mode-container { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .mode-tab { padding: 10px 15px; background: #0c1a30; color: #aaa; border: 1px solid #1a3c61; cursor: pointer; font-weight: bold; border-radius: 4px; font-size: 13px; transition: all 0.2s ease; }
    .mode-tab.active { background: #00509e; color: white; border-color: #0070f3; }
    .view-type-container { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; flex-wrap: wrap; font-family: sans-serif; }
    .view-btn { padding: 6px 12px; background: #0c1a30; color: #aaa; border: 1px solid #1a3c61; cursor: pointer; font-weight: bold; border-radius: 4px; font-size: 11px; transition: all 0.2s ease; text-transform: uppercase; }
    .view-btn.active { background: #00509e; color: white; border-color: #0070f3; }
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
    .team-icons-row { display: flex; gap: 2px; flex-wrap: wrap; align-items: center; justify-content: center; }
    .mini-char-click { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
    .char-thumb { background-size: cover; background-position: top center; border: 2px solid #333; border-radius: 4px; background-color: #05264f; }
    .no-img-placeholder { display: block; text-align: center; color: #556b85; }
    .char-size-76 { width: 84px; } .char-size-76 .char-thumb { width: 76px; height: 76px; } .char-size-76 .char-name-label { font-size: 11px; }
    .char-size-52 { width: 58px; } .char-size-52 .char-thumb { width: 52px; height: 52px; } .char-size-52 .char-name-label { font-size: 9px; }
    .char-name-label { color: #b0bec5; text-align: center; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; margin-top: 2px; }
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

let currentMode = "characters"; 
const modeWrapper = document.createElement("div");
modeWrapper.className = "mode-container";
modeWrapper.innerHTML = `
    <button class="mode-tab active" data-mode="characters">POSTAVY</button>
    <button class="mode-tab" data-mode="def">🛡️ PROTI OBRANE (DEF)</button>
    <button class="mode-tab" data-mode="atk">⚔️ ÚČINNÝ ÚTOK (ATK)</button>
    <button class="mode-tab" data-mode="char">PODĽA POSTAVY V TÍME</button>
`;

let currentViewType = "icons"; 
const viewTypeWrapper = document.createElement("div");
viewTypeWrapper.className = "view-type-container";
viewTypeWrapper.innerHTML = `
    <span style="font-size: 11px; color: #8a9ba8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 4px;">Zobrazenie ako:</span>
    <button class="view-btn active" data-view="icons">IKONY</button>
    <button class="view-btn" data-view="text">TEXT</button>
`;

if (searchInput) {
    searchInput.parentNode.insertBefore(modeWrapper, searchInput);
    searchInput.parentNode.insertBefore(viewTypeWrapper, searchInput);
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

// Event listenery pre módy a zobrazenia
document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
        document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
        e.target.classList.add("active");
        
        currentMode = e.target.getAttribute("data-mode");
        
        if (currentMode === "characters") {
            viewTypeWrapper.style.display = "none"; 
        } else {
            viewTypeWrapper.style.display = "flex"; 
        }
        
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

viewTypeWrapper.style.display = "none";
//funkcia na ukladanie bez znakov
function sanitizeKey(str) {
    return str.toString().toLowerCase().trim()
        .replace(/\[/g, "(")
        .replace(/\]/g, ")")
        .replace(/\./g, "")
        .replace(/\s*\+\s*/g, "+")
        .replace(/[^a-z0-9\-+()]/g, "_");
}
// Vykresľovanie Postáv
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
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 20px; width: 100%;'>Začni písať pre vyhľadanie tímových counterov.</p>";
        if (countElement) countElement.innerText = "Počet nájdených skupín: 0";
        return;
    }

    if (!counters || counters.length === 0) {
        container.innerHTML = "<p style='color: #aaa; text-align: center; padding: 20px; width: 100%;'>Nenašli sa žiadne zodpovedajúce countery.</p>";
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

        // Eventy pre header a body
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
    if (modeWrapper) modeWrapper.style.display = "none";
    if (viewTypeWrapper) viewTypeWrapper.style.display = "none";
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

// Postupné načítavanie dát z Firebase
async function initDataSequential() {
    try {
        const charsSnap = await get(ref(db, 'characters/'));
        if (charsSnap.exists()) {
            allCharacters = Object.values(charsSnap.val());
            if (currentMode === "characters") renderCharacters(allCharacters);
        }
        const teamsSnap = await get(ref(db, 'teams/'));
        if (teamsSnap.exists()) allTeams = teamsSnap.val();
        const countersSnap = await get(ref(db, 'counters/war/'));
        if (countersSnap.exists()) allCounters = Object.entries(countersSnap.val()).map(([key, val]) => ({ id: key, ...val }));
        
        onValue(ref(db, 'characters/'), (snapshot) => {
            const data = snapshot.val();
            if (data) { allCharacters = Object.values(data); if (currentMode === "characters") renderCharacters(allCharacters); }
        });
        onValue(ref(db, 'teams/'), (snapshot) => { if (snapshot.val()) allTeams = snapshot.val(); });
        onValue(ref(db, 'counters/war/'), (snapshot) => {
            const data = snapshot.val();
            allCounters = data ? Object.entries(data).map(([key, val]) => ({ id: key, ...val })) : [];
            if (currentMode !== "characters" && searchInput && searchInput.value.trim() !== "") searchInput.dispatchEvent(new Event('input'));
        });
    } catch (error) { console.error("Chyba:", error); }
}

initDataSequential();

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
        if (modeWrapper) modeWrapper.style.display = "flex";
        if (currentMode !== "characters") viewTypeWrapper.style.display = "flex";
        if (currentMode === "characters") renderCharacters(allCharacters);
        else searchInput.dispatchEvent(new Event('input'));
    }
});

if (backToTopBtn) backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: 'smooth' }));
console.log("Script načítaný kompletne.");