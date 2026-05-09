const BASE = '';

// Wrapper su fetch che include sempre i cookie di sessione
const apiFetch = (url, opts = {}) =>
  fetch(url, { credentials: 'include', ...opts });

const api = {

  // --- Autenticazione ---

  // Controlla se c'è una sessione attiva e restituisce i dati dell'utente loggato
  utenteMe: () =>
    apiFetch(`${BASE}/utente/me`),

  // Effettua il login con email e password
  login: (dati) =>
    apiFetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  // Invalida la sessione corrente
  logout: () =>
    apiFetch(`${BASE}/logout`, { method: 'POST' }),

  // --- Utenti ---

  // Crea un nuovo account utente
  registrazione: (dati) =>
    apiFetch(`${BASE}/utenti/registrazione`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  // Carica la foto profilo come FormData (multipart)
  uploadFotoProfilo: (nickname, foto) => {
    const fd = new FormData();
    fd.append('foto', foto);
    return apiFetch(`${BASE}/utenti/${nickname}/foto`, { method: 'POST', body: fd });
  },

  // Recupera il profilo pubblico di un utente tramite nickname
  utente: (nickname) =>
    apiFetch(`${BASE}/utenti/${nickname}`),

  // --- Annunci ---

  // Recupera i dettagli di un singolo annuncio
  annuncio: (id) =>
    apiFetch(`${BASE}/annunci/${id}`),

  // Ricerca con filtri: i parametri arrivano come stringa query (es. "q=ps1&prezzo_max=100")
  ricercaAnnunci: (params) =>
    apiFetch(`${BASE}/annunci/ricerca/?${params}`),

  // Pubblica un nuovo annuncio
  creaAnnuncio: (dati) =>
    apiFetch(`${BASE}/annunci/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  // Carica le immagini dell'annuncio (massimo 10, come da validazione del form)
  uploadImmaginiAnnuncio: (idAnnuncio, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('immagini', f));
    return apiFetch(`${BASE}/annunci/${idAnnuncio}/immagini`, { method: 'POST', body: fd });
  },

  // Segna l'annuncio come acquistato dall'utente corrente
  acquistaAnnuncio: (idAnnuncio) =>
    apiFetch(`${BASE}/annunci/${idAnnuncio}/acquista`, { method: 'POST' }),

  // Rimuove definitivamente un annuncio
  eliminaAnnuncio: (idAnnuncio) =>
    apiFetch(`${BASE}/annunci/${idAnnuncio}`, { method: 'DELETE' }),

  // Aggiorna parzialmente i dati di un annuncio esistente
  modificaAnnuncio: (id, dati) =>
    apiFetch(`${BASE}/annunci/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  // Elimina una singola immagine dall'annuncio
  eliminaImmagine: (immagineId) =>
    apiFetch(`${BASE}/immagini/${immagineId}`, { method: 'DELETE' }),

  // Aggiorna i dati anagrafici del profilo (nome, bio, ecc.)
  aggiornaDati: (nickname, dati) =>
    apiFetch(`${BASE}/utenti/${nickname}/dati`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  // Cambia la password richiedendo anche quella vecchia
  aggiornaPassword: (nickname, dati) =>
    apiFetch(`${BASE}/utenti/${nickname}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  // Elimina l'account in modo permanente, serve la password come conferma
  eliminaAccount: (nickname, password) =>
    apiFetch(`${BASE}/utenti/${nickname}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }),

  // --- Preferiti ---

  // Restituisce tutti gli annunci salvati dall'utente loggato
  getPreferiti: () =>
    apiFetch(`${BASE}/preferiti`),

  // Aggiunge un annuncio ai preferiti
  aggiungiPreferito: (idAnnuncio) =>
    apiFetch(`${BASE}/preferiti/${idAnnuncio}`, { method: 'POST' }),

  // Rimuove un annuncio dai preferiti
  rimuoviPreferito: (idAnnuncio) =>
    apiFetch(`${BASE}/preferiti/${idAnnuncio}`, { method: 'DELETE' }),

  // --- Chat ---

  // Apre una nuova conversazione tra acquirente e venditore
  creaConversazioneChat: (dati) =>
    fetch('/api/chat/conversazioni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  // Invia il messaggio automatico generato dopo un acquisto
  inviaMessaggioAcquisto: (dati) =>
    fetch('/api/chat/messaggi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  // Aggiorna un messaggio esistente (es. per allegare l'id ordine dopo il pagamento)
  aggiornaMessaggioChat: (id, dati) =>
    fetch(`/api/chat/messaggi/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  // Avvia il rimborso per un annuncio già acquistato
  rimborsaAnnuncio: (idAnnuncio) =>
    apiFetch(`${BASE}/annunci/${idAnnuncio}/rimborso`, { method: 'POST' }),

};

export { api, BASE };
