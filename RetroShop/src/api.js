const BASE = '';

// Aggiunge sempre le credenziali (cookie di sessione) ad ogni richiesta
const apiFetch = (url, opts = {}) =>
  fetch(url, { credentials: 'include', ...opts });

const api = {
  // Autenticazione
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

  // Utenti
  registrazione: (dati) =>
    apiFetch(`${BASE}/utenti/registrazione`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  uploadFotoProfilo: (nickname, foto) => {
    const fd = new FormData();
    fd.append('foto', foto);
    return apiFetch(`${BASE}/utenti/${nickname}/foto`, { method: 'POST', body: fd });
  },

  utente: (nickname) =>
    apiFetch(`${BASE}/utenti/${nickname}`),

  // Annunci
  annuncio: (id) =>
    apiFetch(`${BASE}/annunci/${id}`),

  ricercaAnnunci: (params) =>
    apiFetch(`${BASE}/annunci/ricerca/?${params}`),

  creaAnnuncio: (dati) =>
    apiFetch(`${BASE}/annunci/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    }),

  uploadImmaginiAnnuncio: (idAnnuncio, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('immagini', f));
    return apiFetch(`${BASE}/annunci/${idAnnuncio}/immagini`, { method: 'POST', body: fd });
  },

  eliminaAnnuncio: (idAnnuncio) =>
    apiFetch(`${BASE}/annunci/${idAnnuncio}`, { method: 'DELETE' }),

  getPreferiti: () =>
    apiFetch(`${BASE}/preferiti`),

  aggiungiPreferito: (idAnnuncio) =>
    apiFetch(`${BASE}/preferiti/${idAnnuncio}`, { method: 'POST' }),

  rimuoviPreferito: (idAnnuncio) =>
    apiFetch(`${BASE}/preferiti/${idAnnuncio}`, { method: 'DELETE' }),
};

export { api, BASE };