async function caricaDatiAnnuncio() {

    let url = new URLSearchParams(window.location.search);
    let idAnnuncio = url.get('id') || 1;

    const indirizzo = "http://127.0.0.1:8000";

    try {
        let risposta = await fetch(`${indirizzo}/annunci/${idAnnuncio}`);
        let dati = await risposta.json(); 

        document.getElementById('nome_annuncio').innerText = dati.nome;
        document.getElementById('prezzo_annuncio').innerText = "€ " + dati.prezzo;
        document.getElementById('Piattaforma').innerText = dati.marca;
        document.getElementById('Tipologia').innerText = dati.tipologia;
        document.getElementById('Condizioni').innerText = dati.condizione;
        document.getElementById('nome_utente').innerText = dati.utente;
        document.getElementById('posizione_utente').innerText = dati.posizione;
        document.getElementById('Descrizione').innerText = dati.descrizione;


        //spedizione?
        if (dati.spedizione === true) {
            document.getElementById('ValoreSpedizione').innerText = "Sì (€ " + dati.prezzo_spedizione + ")";
        } else {
            document.getElementById('ValoreSpedizione').innerText = "No";
        }

        //consegna a mano?
        if (dati.presenza === true) {
            document.getElementById('AMano').innerText = "Sì";
        } else {
            document.getElementById('AMano').innerText = "No";
        }


    //errore
    } catch (errore) {
        console.log("C'è stato un problema nel caricare l'annuncio:", errore);
    }
}

caricaDatiAnnuncio();