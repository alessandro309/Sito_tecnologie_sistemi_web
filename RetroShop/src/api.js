// URL base del backend - lasciamo vuoto così le richieste vanno allo stesso host
// (il proxy di Vite in dev reindirizza /api e /utente al server Python)
const BASE = '';

// Wrapper su fetch che include sempre i cookie di sessione
const apiFetch = (url, opts = {}) =>
  fetch(url, { credentials: 'include', ...opts });

const api = {

  // --- Autenticazione ---

  utenteMe: () =>
    apiFetch(`${BASE}/utente/me`),

  login: (dati) =>
    apiFetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  logout: () =>
    apiFetch(`${BASE}/logout`, { method: 'POST' }),

  // --- Utenti ---

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

  utente: (nickname) =>
    apiFetch(`${BASE}/utenti/${nickname}`),

  // --- Annunci ---

  annuncio: (id) =>
    apiFetch(`${BASE}/annunci/${id}`),

  // Ricerca con filtri: i parametri arrivano come stringa query (es. "q=ps1&prezzo_max=100")
  ricercaAnnunci: (params) =>
    apiFetch(`${BASE}/annunci/ricerca/?${params}`),

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

  eliminaAnnuncio: (idAnnuncio) =>
    apiFetch(`${BASE}/annunci/${idAnnuncio}`, { method: 'DELETE' }),


  aggiornaDati: (nickname, dati) =>
    apiFetch(`${BASE}/utenti/${nickname}/dati`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  aggiornaPassword: (nickname, dati) =>
    apiFetch(`${BASE}/utenti/${nickname}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  eliminaAccount: (nickname) =>
    apiFetch(`${BASE}/utenti/${nickname}`, { method: 'DELETE' }),

  // --- Preferiti ---

  getPreferiti: () =>
    apiFetch(`${BASE}/preferiti`),

  aggiungiPreferito: (idAnnuncio) =>
    apiFetch(`${BASE}/preferiti/${idAnnuncio}`, { method: 'POST' }),

  rimuoviPreferito: (idAnnuncio) =>
    apiFetch(`${BASE}/preferiti/${idAnnuncio}`, { method: 'DELETE' }),

};

export { api, BASE };
