document.getElementById('formRegistrazione').onsubmit = async function(event) {
    event.preventDefault(); // Blocca il ricaricamento della pagina

    const form = document.getElementById('formRegistrazione');
    const btnSubmit = document.querySelector('button[type="submit"]');

    // --- FUNZIONE PER MOSTRARE ERRORI A SCHERMO SENZA ALERT ---
    function mostraErrore(messaggio) {
        // Se c'è già un messaggio precedente, lo cancella
        let vecchioMessaggio = document.getElementById('messaggioFeedback');
        if (vecchioMessaggio) vecchioMessaggio.remove();

        // Crea un nuovo box rosso (alert Bootstrap) per l'errore
        let divErrore = document.createElement('div');
        divErrore.id = 'messaggioFeedback';
        divErrore.className = 'alert alert-danger mt-4 mb-0 text-center fw-bold rounded-1';
        divErrore.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i> ${messaggio}`;
        
        // Lo aggiunge alla fine del form
        form.appendChild(divErrore);
        
        // Lo fa sparire in automatico dopo 4 secondi
        setTimeout(() => {
            if (document.getElementById('messaggioFeedback')) {
                document.getElementById('messaggioFeedback').remove();
            }
        }, 4000);
    }

    // --- 1. CONTROLLI RAPIDI ---
    if (document.getElementById('email').value !== document.getElementById('confermaEmail').value) {
        return mostraErrore("Le email non corrispondono!");
    }
    if (document.getElementById('password').value !== document.getElementById('confermaPassword').value) {
        return mostraErrore("Le password non corrispondono!");
    }

    // --- 2. RACCOLTA DATI E PREPARAZIONE ---
    const datiUtente = {
        nome: document.getElementById('nome').value,
        cognome: document.getElementById('cognome').value,
        nickname: document.getElementById('nickname').value,
        nascita: document.getElementById('dataNascita').value,
        sesso: document.getElementById('sesso').value || null,
        citta: document.getElementById('citta').value || null,
        provincia: document.getElementById('provincia').value || null,
        mail: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    // Salva il testo originale del bottone e lo disabilita mostrando uno spinner
    let testoOriginaleBottone = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Registrazione in corso...';

    try {
        // --- 3. CREAZIONE UTENTE (Dati testo) ---
        let resUtente = await fetch('http://127.0.0.1:8000/utenti/registrazione', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datiUtente)
        });

        if (!resUtente.ok) throw new Error((await resUtente.json()).detail || "Errore durante la registrazione");

        // --- 4. CARICAMENTO FOTO PROFILO ---
        let foto = document.getElementById('fotoProfilo').files[0];
        if (foto) {
            let formData = new FormData();
            formData.append("foto", foto);
            
            await fetch(`http://127.0.0.1:8000/utenti/${datiUtente.nickname}/foto`, {
                method: 'POST',
                body: formData
            });
        }

        // --- 5. SUCCESSO E REINDIRIZZAMENTO ---
        // Cancella eventuali errori precedenti
        let vecchioMessaggio = document.getElementById('messaggioFeedback');
        if (vecchioMessaggio) vecchioMessaggio.remove();

        // Cambia il bottone rendendolo verde
        btnSubmit.classList.replace('btn-danger', 'btn-success');
        btnSubmit.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Account Creato!';
        
        // Aspetta 1.5 secondi per far leggere il messaggio, poi va alla Home
        setTimeout(() => {
            window.location.href = "profilo.html";
        }, 1500);

    } catch (errore) {
        // In caso di errore: riabilita il bottone, rimette il testo originale e mostra l'errore
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = testoOriginaleBottone;
        mostraErrore(errore.message); 
    }
};