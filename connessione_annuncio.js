async function caricaDatiAnnuncio() {

    let url = new URLSearchParams(window.location.search);
    let idAnnuncio = url.get('id') || 1;

    const indirizzo = "http://127.0.0.1:8000";

    try {
        // --- 1. CARICAMENTO DATI ANNUNCIO ---
        let risposta = await fetch(`${indirizzo}/annunci/${idAnnuncio}`);
        let dati = await risposta.json(); 

        // --- POPOLAMENTO TESTI ---
        document.getElementById('nome_annuncio').innerText = dati.nome;
        document.getElementById('prezzo_annuncio').innerText = "€ " + dati.prezzo;
        
        // CORRETTO: marca -> piattaforma e aggiunto il modello
        document.getElementById('Piattaforma').innerText = dati.piattaforma; 
        document.getElementById('Modello').innerText = dati.modello;
        
        document.getElementById('Tipologia').innerText = dati.tipologia;
        document.getElementById('Condizioni').innerText = dati.condizione;
        document.getElementById('nome_utente').innerText = dati.utente;
        document.getElementById('posizione_utente').innerText = dati.posizione;
        document.getElementById('Descrizione').innerText = dati.descrizione;

        if (dati.spedizione === true) {
            document.getElementById('ValoreSpedizione').innerText = "Sì (€ " + dati.prezzo_spedizione + ")";
        } else {
            document.getElementById('ValoreSpedizione').innerText = "No";
        }

        // Gestione Consegna a mano
        if (dati.presenza === true) {
            document.getElementById('AMano').innerText = "Sì";
        } else {
            document.getElementById('AMano').innerText = "No";
        }

        // --- 2. GESTIONE IMMAGINI ANNUNCIO ---
        const contenitoreMiniature = document.getElementById('contenitoreMiniature');
        const immaginePrincipale = document.getElementById('immaginePrincipale');

        contenitoreMiniature.innerHTML = '';

        if (dati.immagini && dati.immagini.length > 0) {
            immaginePrincipale.src = indirizzo + dati.immagini[0].url_immagine;

            dati.immagini.forEach((img, index) => {
                let nuovaMiniatura = document.createElement('img');
                nuovaMiniatura.src = indirizzo + img.url_immagine;
                nuovaMiniatura.className = 'img-thumbnail thumbnail-img bg-black';

                // Evidenzia la prima miniatura come "attiva"
                if (index === 0) {
                    nuovaMiniatura.classList.add('attiva');
                }

                nuovaMiniatura.setAttribute('onclick', 'cambiaImmagine(this)');
                contenitoreMiniature.appendChild(nuovaMiniatura);
            });

        } else {
            immaginePrincipale.src = "https://via.placeholder.com/800x450/1a1a1a/ffffff?text=Nessuna+Immagine";
        }

        // --- 3. RECUPERO FOTO PROFILO UTENTE ---
        try {
            // Facciamo una chiamata all'endpoint dell'utente usando il suo nickname
            let rispostaUtente = await fetch(`${indirizzo}/utenti/${dati.utente}`);
            if (rispostaUtente.ok) {
                let datiUtente = await rispostaUtente.json();
                
                // Se l'utente ha una foto profilo, la mostriamo
                if (datiUtente.foto_profilo) {
                    document.getElementById('foto_profilo_utente').src = indirizzo + datiUtente.foto_profilo;
                }
            }
        } catch (erroreUtente) {
            console.log("Non è stato possibile caricare i dettagli dell'utente:", erroreUtente);
        }

    } catch (errore) {
        console.log("C'è stato un problema nel caricare l'annuncio:", errore);
    }
}

caricaDatiAnnuncio();