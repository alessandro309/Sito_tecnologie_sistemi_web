document.addEventListener("DOMContentLoaded", function() {

    // ==========================================
    // 1. NAVIGAZIONE SIDEBAR (Cambio Schede)
    // ==========================================
    const btnProfilo = document.getElementById('btnMenuProfilo'); 
    const btnImpostazioni = document.getElementById('btnMenuImpostazioni'); 
    const sezioneProfilo = document.getElementById('sezioneProfilo');
    const sezioneImpostazioni = document.getElementById('sezioneImpostazioni');

    if (btnProfilo && btnImpostazioni) {
        // Clic su "Il mio profilo"
        btnProfilo.addEventListener('click', (e) => {
            e.preventDefault();
            sezioneImpostazioni.classList.add('d-none'); // Nascondi impostazioni
            sezioneProfilo.classList.remove('d-none');   // Mostra profilo
            
            // Gestione grafica del bottone rosso attivo
            document.querySelectorAll('.sidebar-profilo .list-group-item').forEach(el => el.classList.remove('active'));
            btnProfilo.classList.add('active');
        });

        // Clic su "Impostazioni"
        btnImpostazioni.addEventListener('click', (e) => {
            e.preventDefault();
            sezioneProfilo.classList.add('d-none');      // Nascondi profilo
            sezioneImpostazioni.classList.remove('d-none'); // Mostra impostazioni
            
            document.querySelectorAll('.sidebar-profilo .list-group-item').forEach(el => el.classList.remove('active'));
            btnImpostazioni.classList.add('active');
        });
    }


    // ==========================================
    // 2. GESTIONE CAMBIO TEMA (Scuro/Azzurro)
    // ==========================================
    const radioTemaScuro = document.getElementById('temaScuro');
    const radioTemaChiaro = document.getElementById('temaChiaro');

    function applicaTema(tema) {
        if (tema === 'light') {
            document.body.classList.add('tema-chiaro');
            localStorage.setItem('temaSelezionato', 'light'); // Salva nel browser
        } else {
            document.body.classList.remove('tema-chiaro');
            localStorage.setItem('temaSelezionato', 'dark');
        }
    }

    if (radioTemaScuro && radioTemaChiaro) {
        // Ascolta il click sui pallini
        radioTemaScuro.addEventListener('change', () => applicaTema('dark'));
        radioTemaChiaro.addEventListener('change', () => applicaTema('light'));

        // Controlla se c'era un tema salvato al caricamento della pagina
        if (localStorage.getItem('temaSelezionato') === 'light') {
            radioTemaChiaro.checked = true;
            applicaTema('light');
        }
    }


    // ==========================================
    // 3. BLOCCO RICARICAMENTO MODULI IMPOSTAZIONI
    // ==========================================
    const formInfo = document.getElementById('formInfoPersonali');
    if (formInfo) {
        formInfo.addEventListener('submit', function(e) {
            e.preventDefault();
            // TODO: Qui metteremo la fetch() per inviare i nuovi dati al server
            console.log("Modulo Info Personali inviato");
        });
    }

    const formPassword = document.getElementById('formPassword');
    if (formPassword) {
        formPassword.addEventListener('submit', function(e) {
            e.preventDefault();
            // TODO: Qui metteremo la fetch() per aggiornare la password
            console.log("Modulo Cambio Password inviato");
        });
    }
});