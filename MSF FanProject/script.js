import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// Firebase Konfigurácia
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

setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Chyba perzistencie:", error);
});

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

const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email")?.value;
        const password = document.getElementById("login-password")?.value;

        if (!email || !password) {
            alert("Prosím zadajte e-mail aj heslo.");
            return;
        }

        signInWithEmailAndPassword(auth, email, password).catch((error) => {
            alert("Nepodarilo sa prihlásiť: " + error.message);
        });
    });
}

document.getElementById("logout-btn")?.addEventListener("click", () => {
    signOut(auth).then(() => { location.reload(); });
});

// --- BEZPEČNÉ A IZOLOVANÉ ŠTÝLY ---
const styleId = "msf-roster-custom-styles";
if (!document.getElementById(styleId)) {
    const responsiveStyle = document.createElement("style");
    responsiveStyle.id = styleId;
    responsiveStyle.textContent = `
        .search-row { 
            position: sticky !important; 
            top: 45px; 
            z-index: 90; 
            background: rgba(3, 10, 22, 0.95); 
            padding: 12px 20px;
            display: flex; gap: 12px; align-items: center; width: 100%; box-sizing: border-box; justify-content: center; 
            backdrop-filter: blur(5px);
        }
        
        #character-count {
            position: relative;
            z-index: 89;
            background: transparent;
            padding: 10px 0;
            text-align: center;
            font-weight: bold;
            color: #d18000;
            font-size: 14px;
        }

        .search-row input { 
            flex-grow: 1; 
            max-width: 500px;
            height: 40px; 
            padding: 0 15px;
            border-radius: 6px;
            background: #081a33;
            color: white;
            font-size: 14px;
            border: 1px solid rgba(59, 130, 246, 0.9) !important;
            outline: none;
        }  

        #character-container { 
            display: flex !important; 
            flex-wrap: wrap !important; 
            gap: 20px !important; 
            justify-content: center !important; 
            padding: 20px 0 !important; 
        }
        .char-card { 
            background: #0c1a30 !important; 
            border: 1px solid #1a3c61 !important; 
            border-radius: 8px !important; 
            overflow: hidden !important; 
            width: 200px !important; 
            text-align: center !important; 
            color: white !important; 
            cursor: pointer !important;
            transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s !important; 
        }
        .char-card:hover { 
            border-color: #3b82f6 !important; 
            transform: translateY(-4px) !important;
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.5) !important;
        }
        .char-img { 
            height: 200px !important; 
            background-size: cover !important; 
            background-position: top center !important; 
            background-color: #05264f !important; 
            background-repeat: no-repeat !important;
        }
        .char-info { padding: 12px !important; }
        .char-info h3 { font-size: 15px !important; margin: 0 0 6px 0 !important; color: #fff !important; word-break: break-word !important; }
        .char-info .role { font-size: 11px !important; color: #8a9ba8 !important; font-weight: bold !important; text-transform: uppercase !important; }

        .detail-layout { display: flex; flex-wrap: nowrap; gap: 20px; background: #081226; color: white; padding: 20px; font-family: sans-serif; border: 1px solid #1a3c61; border-radius: 8px; align-items: flex-start; }
        .detail-left { width: 250px; flex-shrink: 0; display: flex; flex-direction: column; }
        .char-avatar-block { width: 100%; border-radius: 6px; overflow: hidden; border: 1px solid #1a3c61; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 15px; font-size: 13px; text-align: center; }
        .stats-grid div { background: #0c1c38; padding: 8px; border-radius: 4px; border: 1px solid #18355c; }
        .detail-right-container { display: flex; flex-grow: 1; gap: 20px; align-items: flex-start; }
        .ability-icons-col { display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; }
        .ability-desc-col { flex-grow: 1; background: #0a1b35; border: 1px solid #1a3c61; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; min-height: 350px; max-height: 550px; box-sizing: border-box; }
        
        @media (max-width: 768px) { 
            .detail-layout { flex-direction: column; align-items: center; padding: 12px; } 
            .detail-left { width: 100%; max-width: 500px; flex-direction: row; gap: 15px; align-items: center; margin-bottom: 15px; } 
            .char-avatar-block { width: 140px; flex-shrink: 0; } 
            .char-avatar-block div { height: 140px !important; } 
            .stats-grid { flex-grow: 1; padding-top: 0; font-size: 11px; gap: 6px; } 
            .detail-right-container { width: 100%; flex-direction: column; align-items: center; gap: 15px; } 
            .ability-icons-col { flex-direction: row; justify-content: center; width: 100%; flex-wrap: wrap; } 
            .ability-desc-col { width: 100%; max-height: none; } 
        }
    `;
    document.head.appendChild(responsiveStyle);
}

let allCharacters = [];
let firebaseLoaded = false;
let lastContainerState = false;

// --- HLAVNÁ RIADIACA FUNKCIA PRE SPA ---
function handleAppLifecycle() {
    const container = document.getElementById("character-container");

    // Ak nie sme na stránke s postavami (napr. sme v Alliance War alebo Crucible), okamžite upraceme naše elementy, aby nič nezavadzalo
    if (!container) {
        if (lastContainerState) {
            document.querySelectorAll(".search-row, #character-count, #detail-container").forEach(el => el.remove());
            lastContainerState = false;
        }
        return;
    }

    // Ak sme na stránke postáv a ešte nie sú injektované ovládacie prvky
    if (!lastContainerState || !document.getElementById("searchInput")) {
        lastContainerState = true;
        initRosterView(container);
    }
}

function initRosterView(container) {
    // Odstránime prípadné duplicity
    document.querySelectorAll(".search-row, #character-count, #detail-container").forEach(el => el.remove());

    const searchRow = document.createElement("div");
    searchRow.className = "search-row";

    const searchInput = document.createElement("input");
    searchInput.id = "searchInput";
    searchInput.type = "text";
    searchInput.placeholder = "Vyhľadaj postavu podľa mena...";
    searchInput.setAttribute("autocomplete", "off");
    searchRow.appendChild(searchInput);

    const countElement = document.createElement("div");
    countElement.id = "character-count";

    const detailContainer = document.createElement("div");
    detailContainer.id = "detail-container";
    detailContainer.style.display = "none";

    const parent = container.parentNode;
    if (parent) {
        parent.insertBefore(searchRow, container); 
        parent.insertBefore(countElement, container);
        parent.insertBefore(detailContainer, container);
    }

    function renderCharacters(characters) {
        container.style.display = "flex"; 
        container.innerHTML = "";
        
        if (!characters || characters.length === 0) {
            container.innerHTML = "<p style='text-align:center; width:100%; padding: 40px; color: #8a9ba8;'>Nenašli sa žiadne postavy.</p>";
            countElement.innerText = "Počet zobrazených postáv: 0";
            return;
        }

        countElement.innerText = "Počet zobrazených postáv: " + characters.length;

        characters.forEach(char => {
            const card = document.createElement("div");
            card.className = "char-card";
            const imageUrl = char.image || 'https://via.placeholder.com/200x200?text=No+Image';
            
            card.innerHTML = `
                <div class="char-img" style="background-image: url('${imageUrl}');"></div>
                <div class="char-info">
                    <h3>${char.name || "Neznáma postava"}</h3>
                    <span class="role">Klikni pre detaily</span>
                </div>
            `;
            card.addEventListener("click", () => showCharacterDetail(char));
            container.appendChild(card);
        });
    }

    function showCharacterDetail(char) {
        history.pushState({ view: "detail" }, "");
        container.style.display = "none";
        searchInput.style.display = "none";
        countElement.style.display = "none";
        searchRow.style.display = "none";
        detailContainer.style.display = "block";
        
        const stats = char.stats || {};
        const abils = char.abilities || {};
        
        let activeAbility = "basic";
        if (!abils.basic && abils.special) activeAbility = "special";
        else if (!abils.basic && abils.ultimate) activeAbility = "ultimate";
        else if (!abils.basic && abils.passive) activeAbility = "passive";

        let activeLevel = 1;
        if (abils[activeAbility] && abils[activeAbility].levels) {
            const lvlKeys = Object.keys(abils[activeAbility].levels);
            if (lvlKeys.length > 0) activeLevel = Math.max(...lvlKeys.map(Number));
        }

        function renderDetailContent() {
            const currentAbil = abils[activeAbility] || {};
            const levelsObj = currentAbil.levels || {};
            const levelKeys = Object.keys(levelsObj).sort((a,b) => Number(a) - Number(b));
            
            const currentDesc = levelsObj[activeLevel] || currentAbil.desc || "Žiadny popis schopnosti.";
            const levelsOptions = levelKeys.map(lvl => `<option value="${lvl}" ${lvl == activeLevel ? 'selected' : ''}>LEVEL ${lvl}</option>`).join("");
            const critDmg = 100 + (stats.critDamageBonus || 0);
            const imageUrl = char.image || 'https://via.placeholder.com/250x250?text=No+Image';

            detailContainer.innerHTML = `
                <button id="backToList" style="margin-bottom: 20px; padding: 10px 20px; background: #00509e; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">⬅ SPÄŤ NA ZOZNAM</button>
                <div class="detail-layout">
                    <div class="detail-left">
                        <div class="char-avatar-block">
                            <div style="background-image: url('${imageUrl}'); height: 250px; background-size: cover; background-position: top center; border-bottom: 3px solid #1a3c61;"></div>
                            <h2 style="text-align: center; margin: 0; padding: 12px 10px; background: #05264f; font-size: 18px; color: white;">${char.name || "Neznámy"}</h2>
                        </div>
                        <div class="stats-grid">
                            <div><span style="color: #d18000; font-weight: bold;">Health</span><br><b>${(stats.health || 0).toLocaleString()}</b></div>
                            <div><span style="color: #d18000; font-weight: bold;">Speed</span><br><b>${stats.speed || 0}</b></div>
                            <div><span style="color: #d18000; font-weight: bold;">Damage</span><br><b>${(stats.damage || 0).toLocaleString()}</b></div>
                            <div><span style="color: #d18000; font-weight: bold;">Crit Chance</span><br><b>${stats.critChance || 0}%</b></div>
                            <div><span style="color: #d18000; font-weight: bold;">Armor</span><br><b>${(stats.armor || 0).toLocaleString()}</b></div>
                            <div><span style="color: #d18000; font-weight: bold;">Crit Damage</span><br><b>${critDmg}%</b></div>
                            <div><span style="color: #d18000; font-weight: bold;">Focus</span><br><b>${(stats.focus || 0).toLocaleString()}</b></div>
                            <div><span style="color: #d18000; font-weight: bold;">Accuracy</span><br><b>${stats.accuracy || 0}%</b></div>
                            <div><span style="color: #d18000; font-weight: bold;">Resistance</span><br><b>${(stats.resist || 0).toLocaleString()}</b></div>
                            <div><span style="color: #d18000; font-weight: bold;">Block Amount</span><br><b>${stats.blockAmount || 0}%</b></div>
                        </div>
                    </div>
                    <div class="detail-right-container">
                        <div class="ability-icons-col">
                            ${['basic', 'special', 'ultimate', 'passive'].map(type => {
                                if (!abils[type]) return '';
                                const iconUrl = abils[type].icon || 'https://via.placeholder.com/70?text=Icon';
                                return `<img src="${iconUrl}" class="ability-btn" data-type="${type}" title="${abils[type].name || type}" style="width: 70px; height: 70px; cursor: pointer; border: ${activeAbility === type ? '3px solid #f2a900' : '2px solid #1a3c61'}; border-radius: 6px; flex-shrink: 0; background: #05264f; box-sizing: border-box; object-fit: cover;">`;
                            }).join("")}
                        </div>
                        <div class="ability-desc-col">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #1a3c61; padding-bottom: 12px; flex-shrink: 0; flex-wrap: wrap; gap: 10px;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    ${currentAbil.icon ? `<img src="${currentAbil.icon}" style="width: 50px; height: 50px; border: 2px solid #f2a900; border-radius: 6px; box-shadow: 0 0 8px rgba(242, 169, 0, 0.4); object-fit: cover;">` : ''}
                                    <h3 style="margin: 0; color: white; font-size: 20px;">${currentAbil.name || "Neznáma schopnosť"}</h3>
                                </div>
                                ${levelKeys.length > 0 ? `
                                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                        <span style="color: #d18000; font-size: 11px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Úroveň Schopnosti</span>
                                        <select id="abilityLevelSelect" style="background: #081a33; color: #f2a900; border: 1px solid #d18000; padding: 6px 10px; font-weight: bold; border-radius: 4px; cursor: pointer; outline: none;">${levelsOptions}</select>
                                    </div>
                                ` : ''}
                            </div>
                            <div style="overflow-y: auto; padding-right: 8px; flex-grow: 1;">
                                <p style="white-space: pre-line; line-height: 1.6; color: #d0dbe5; font-size: 15px;">${currentDesc}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById("backToList")?.addEventListener("click", () => history.back());
            
            document.querySelectorAll(".ability-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    activeAbility = e.currentTarget.getAttribute("data-type");
                    const newLevels = Object.keys(abils[activeAbility]?.levels || {});
                    activeLevel = newLevels.length > 0 ? Math.max(...newLevels.map(Number)) : 1;
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

    if (!firebaseLoaded) {
        firebaseLoaded = true;
        get(ref(db, 'characters/')).then((charsSnap) => {
            if (charsSnap.exists()) {
                const val = charsSnap.val();
                allCharacters = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
                renderCharacters(allCharacters);
            } else {
                renderCharacters([]);
            }
        }).catch(err => console.error("Chyba dát:", err));

        onValue(ref(db, 'characters/'), (snapshot) => {
            const data = snapshot.val();
            if (data) { 
                allCharacters = Array.isArray(data) ? data.filter(Boolean) : Object.values(data); 
                if (detailContainer.style.display === "none") {
                    const currentSearch = searchInput.value.toLowerCase().trim();
                    const filtered = allCharacters.filter(char => char && char.name && char.name.toLowerCase().includes(currentSearch));
                    renderCharacters(filtered); 
                }
            }
        });
    } else {
        renderCharacters(allCharacters);
    }

    searchInput.addEventListener("keydown", (e) => { 
        if (e.key === "Enter") searchInput.blur(); 
    });
    
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filtered = allCharacters.filter(char => char && char.name && char.name.toLowerCase().includes(searchTerm));
        renderCharacters(filtered);
    });

    window.addEventListener("popstate", () => {
        if (detailContainer.style.display === "block") {
            detailContainer.style.display = "none";
            container.style.display = "flex"; 
            searchInput.style.display = "block";
            countElement.style.display = "block";
            searchRow.style.display = "flex";
            
            const currentSearch = searchInput.value.toLowerCase().trim();
            const filtered = allCharacters.filter(char => char && char.name && char.name.toLowerCase().includes(currentSearch));
            renderCharacters(filtered);
        }
    });
}

// Sledovanie zmien v SPA prostredí (prepínanie záložiek)
const observer = new MutationObserver(() => {
    handleAppLifecycle();
});
observer.observe(document.body, { childList: true, subtree: true });

// Úvodná kontrola pri načítaní
handleAppLifecycle();