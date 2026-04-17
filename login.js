const fetchAvanzata = (url, options = {}) => {
    options.credentials = 'include';
    return fetch(url, options);
};

const INDIRIZZO_BASE = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async function() {
    try {
        const risposta = await fetchAvanzata(`${INDIRIZZO_BASE}/utente/me`);
        
        if (risposta.ok) {
            const dati = await risposta.json();
            
            if (dati.loggato) {
                const btnLogin = document.getElementById('pulsante_login');
                
                if (btnLogin) {
                    const contenitoreNav = btnLogin.parentElement;
                    btnLogin.remove();

                    const divPulsanti = document.createElement("div");
                    divPulsanti.className = "d-flex flex-column flex-lg-row align-items-center gap-3 ms-lg-4 mt-3 mt-lg-0";

                    // AGGIUNTO: text-nowrap e py-2 su entrambi i pulsanti
                    divPulsanti.innerHTML = `
                        <a href="crea_annuncio.html" class="btn bottone_login font-monospace text-uppercase rounded-1 d-flex align-items-center justify-content-center w-100 w-lg-auto px-4 py-2 text-nowrap">
                            <i class="bi bi-plus-circle me-2 fs-5"></i> Crea Annuncio
                        </a>

                        <div class="nav-item dropdown w-100 w-lg-auto">
                            <a href="#" class="btn bottone_login font-monospace text-uppercase rounded-1 d-flex align-items-center justify-content-center w-100 px-4 py-2 text-nowrap" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-person-circle me-2 fs-5"></i>
                                ${dati.nickname}
                            </a>
                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end rounded-2 mt-2 shadow-lg border-secondary">
                                <li><a class="dropdown-item font-monospace py-2" href="profilo.html"><i class="bi bi-person me-2"></i>Il mio Profilo</a></li>
                                <li><hr class="dropdown-divider border-secondary"></li>
                                <li><button class="dropdown-item font-monospace text-danger py-2 w-100 text-start" onclick="eseguiLogout()"><i class="bi bi-box-arrow-right me-2"></i>Esci</button></li>
                            </ul>
                        </div>
                    `;

                    contenitoreNav.appendChild(divPulsanti);
                }
            }
        }
    } catch (errore) {
        console.log("Sessione non attiva.");
    }
});

window.eseguiLogout = async function() {
    try {
        await fetchAvanzata(`${INDIRIZZO_BASE}/logout`, { method: "POST" });
        window.location.reload();
    } catch (errore) {
        console.error("Errore durante il logout:", errore);
    }
};

const formLogin = document.querySelector('#modalLogin form');
if (formLogin) {
    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault();
        const nicknameInput = document.getElementById('nickname').value;
        const passwordInput = document.getElementById('password').value;
        const btnSubmit = this.querySelector('button[type="submit"]');
        
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Accesso...';

        try {
            const risposta = await fetchAvanzata(`${INDIRIZZO_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nicknameInput, password: passwordInput })
            });

            if (risposta.ok) {
                const modalEl = document.getElementById('modalLogin');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
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