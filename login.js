const fetchAvanzata = (url, options = {}) => {
    options.credentials = 'include';
    return fetch(url, options);
};

const INDIRIZZO_BASE = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async function() {
    try {
        // Controlla se l'utente ha una sessione attiva
        const risposta = await fetchAvanzata(`${INDIRIZZO_BASE}/utente/me`);
        
        if (risposta.ok) {
            const dati = await risposta.json();
            
            // Aggiorna la Navbar
            const btnLogin = document.getElementById('pulsante_login');
            if (btnLogin) {
                // Cambia il bottone in un Dropdown
                btnLogin.outerHTML = `
                <div class="nav-item dropdown ms-lg-4">
                    <a href="#" class="btn bottone_login font-monospace text-uppercase rounded-1 d-flex align-items-center" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle me-2 fs-5"></i>
                        ${dati.nickname}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end rounded-2 mt-2">
                        <li><a class="dropdown-item font-monospace" href="profilo.html"><i class="bi bi-person me-2"></i>Il mio Profilo</a></li>
                        <li><a class="dropdown-item font-monospace" href="crea_annuncio.html"><i class="bi bi-plus-circle me-2"></i>Crea Annuncio</a></li>
                        <li><hr class="dropdown-divider border-secondary"></li>
                        <li><button class="dropdown-item font-monospace text-danger" onclick="eseguiLogout()"><i class="bi bi-box-arrow-right me-2"></i>Esci</button></li>
                    </ul>
                </div>`;
            }
        }
    } catch (errore) {
        console.error("Errore nel controllo della sessione:", errore);
    }
});

// Funzione per il Logout
async function eseguiLogout() {
    try {
        await fetchAvanzata(`${INDIRIZZO_BASE}/logout`, { method: "POST" });
        // Ricarica la pagina per resettare l'interfaccia
        window.location.reload();
    } catch (errore) {
        console.error("Errore durante il logout:", errore);
    }
}

// Gestione del Login dalla Modale
const formLogin = document.querySelector('#modalLogin form');
if (formLogin) {
    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault(); // Evita il ricaricamento della pagina
        
        const nicknameInput = document.getElementById('nickname').value;
        const passwordInput = document.getElementById('password').value;
        const btnSubmit = this.querySelector('button[type="submit"]');
        
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Accesso...';

        try {
            const risposta = await fetchAvanzata(`${INDIRIZZO_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: nicknameInput,
                    password: passwordInput
                })
            });

            if (risposta.ok) {
                // Chiude la modale di Bootstrap in modo pulito
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalLogin'));
                modalInstance.hide();
                
                // Ricarica la pagina per far attivare lo script di controllo sessione
                window.location.reload();
            } else {
                const erroreDati = await risposta.json();
                alert(erroreDati.detail || "Credenziali errate");
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Entra';
            }
        } catch (errore) {
            alert("Errore di connessione al server.");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Entra';
        }
    });
}