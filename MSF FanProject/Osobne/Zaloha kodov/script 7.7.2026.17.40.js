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

let allCharacters = [];

// Jediná a správna verzia funkcie
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
        card.innerHTML = `
            <div class="char-img" style="background-image: url('${char.image}');"></div>
            <div class="char-info">
                <h3>${char.name}</h3>
                <span class="role">Kliknite pre zobrazenie counterov</span>
            </div>
        `;
        container.appendChild(card);
    });
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

// Logika na vyskrolovanie hore
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