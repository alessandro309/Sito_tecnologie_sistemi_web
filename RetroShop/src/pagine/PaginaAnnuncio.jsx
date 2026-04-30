import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../componenti/Navbar';
import BarraRicerca from '../componenti/BarraRicerca';
import ModalLogin from '../componenti/Login';
import ModalFiltri from '../componenti/Filtri';
import Footer from '../componenti/Footer';
import { api, BASE } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function PaginaAnnuncio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { utente } = useAuth();

  const [annuncio, setAnnuncio] = useState(null);
  const [fotoProfilo, setFotoProfilo] = useState(null);
  const [indiceImmagine, setIndiceImmagine] = useState(0);
  const [salvato, setSalvato] = useState(false);

  useEffect(() => {
    api.annuncio(id)
      .then((r) => r.json())
      .then(async (dati) => {
        setAnnuncio(dati);
        try {
          const utenteResp = await api.utente(dati.utente);
          if (utenteResp.ok) {
            const utenteDati = await utenteResp.json();
            if (utenteDati.foto_profilo) setFotoProfilo(BASE + utenteDati.foto_profilo);
          }
        } catch { /* Foto profilo opzionale */ }
      })
      .catch(console.error);
  }, [id]);

  if (!annuncio) {
    return (
      <>
        <Navbar><BarraRicerca /></Navbar>
        <div className="container my-5 text-center text-white">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-3 font-monospace">Caricamento annuncio...</p>
        </div>
        <Footer />
      </>
    );
  }

  const immagini = annuncio.immagini ?? [];
  const immagineUrl = immagini.length > 0
    ? `${BASE}${immagini[indiceImmagine].url_immagine}`
    : 'https://via.placeholder.com/800x450/1a1a1a/ffffff?text=Nessuna+Immagine';

  function precedente() {
    setIndiceImmagine((i) => (i === 0 ? immagini.length - 1 : i - 1));
  }

  function successiva() {
    setIndiceImmagine((i) => (i === immagini.length - 1 ? 0 : i + 1));
  }

  // Naviga alla chat. Se l'utente non è loggato, apre il modal di login.
  // Quando il backend gestirà le conversazioni, qui si potrà passare anche
  // l'id annuncio e il venditore come query param o state, ad esempio:
  // navigate('/chat', { state: { venditore: annuncio.utente, idAnnuncio: id } })
  function apriChat() {
    if (!utente) {
      // Apre il modal login tramite Bootstrap
      const modal = document.getElementById('modalLogin');
      if (modal) {
        const bsModal = window.bootstrap?.Modal.getOrCreateInstance(modal);
        bsModal?.show();
      }
      return;
    }
    // L'utente è il proprietario dell'annuncio: non può contattare se stesso
    if (utente.nickname === annuncio.utente) return;

    navigate('/chat', {
      state: {
        venditore: annuncio.utente,
        idAnnuncio: id,
        titoloAnnuncio: annuncio.nome,
        prezzoAnnuncio: annuncio.prezzo,
      },
    });
  }

  const isProprietario = utente?.nickname === annuncio.utente;

  return (
    <>
      <Navbar><BarraRicerca /></Navbar>

      <main>
        <div className="container my-5">
          <div className="row">

            {/* Colonna immagini */}
            <div className="col-lg-6 mb-4">
              <div className="container-immagine-principale border border-secondary mb-3 shadow-sm">
                {immagini.length > 1 && (
                  <button className="btn-navigazione prev" onClick={precedente}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                )}
                <img id="immaginePrincipale" src={immagineUrl} alt={annuncio.nome} />
                {immagini.length > 1 && (
                  <button className="btn-navigazione next" onClick={successiva}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                )}
              </div>

              {/* Miniature */}
              <div className="d-flex gap-2 overflow-auto pb-4 scrollbar-nascosta">
                {immagini.map((img, i) => (
                  <img
                    key={i}
                    src={`${BASE}${img.url_immagine}`}
                    className={`img-thumbnail thumbnail-img bg-black ${i === indiceImmagine ? 'attiva' : ''}`}
                    alt={`Immagine ${i + 1}`}
                    onClick={() => setIndiceImmagine(i)}
                  />
                ))}
              </div>
            </div>

            {/* Colonna dettagli */}
            <div className="col-lg-6 d-flex flex-column text-white">
              <div className="box_citta_descrizione shadow-sm mb-4">
                <div className="mb-4">
                  <h1 className="fw-bold font-monospace mb-2">{annuncio.nome}</h1>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="scritte_arancioni font-monospace fw-bold mb-0">€ {annuncio.prezzo}</h2>
                    <button
                      className={`btn ${salvato ? 'btn-danger' : 'btn-outline-danger'} font-monospace d-flex align-items-center gap-2 rounded-1`}
                      onClick={() => setSalvato(!salvato)}
                    >
                      <i className={`bi bi-floppy${salvato ? '-fill' : ''} fs-5`}></i>
                      <span className="d-none d-sm-inline">Salva</span>
                    </button>
                  </div>

                  <div className="d-flex gap-3 mt-2">
                    <button className="btn pulsante_verde font-monospace px-4 py-2 rounded-2 shadow-sm d-flex align-items-center justify-content-center flex-grow-1">
                      <i className="bi bi-cart-fill me-2"></i>Acquista
                    </button>

                    {/* ── PULSANTE CONTATTA ── */}
                    {isProprietario ? (
                      // Se è il proprietario mostra un badge informativo al posto del pulsante
                      <span className="btn pulsante_arancione font-monospace px-4 py-2 rounded-2 shadow-sm d-flex align-items-center justify-content-center flex-grow-1 opacity-50" style={{ cursor: 'default' }}>
                        <i className="bi bi-person-check-fill me-2"></i>Tuo annuncio
                      </span>
                    ) : (
                      <button
                        className="btn pulsante_arancione font-monospace px-4 py-2 rounded-2 shadow-sm d-flex align-items-center justify-content-center flex-grow-1"
                        onClick={apriChat}
                        title={!utente ? 'Accedi per contattare il venditore' : `Contatta ${annuncio.utente}`}
                      >
                        <i className="bi bi-chat-dots-fill me-2"></i>Contatta
                      </button>
                    )}
                  </div>
                </div>

                {/* Dettagli tecnici */}
                <div className="mb-4 font-monospace" style={{ fontSize: '0.95rem' }}>
                  {[
                    ['Piattaforma', annuncio.piattaforma],
                    ['Modello',     annuncio.modello],
                    ['Tipologia',   annuncio.tipologia],
                    ['Condizioni',  annuncio.condizione],
                    ['Spedizione',  annuncio.spedizione ? `Sì (€ ${annuncio.prezzo_spedizione})` : 'No'],
                    ['Consegna a mano', annuncio.presenza ? 'Sì' : 'No'],
                  ].map(([label, valore]) => (
                    <div className="row mb-2" key={label}>
                      <div className="col-5 colore-titoli">{label}</div>
                      <div className="col-7 fw-bold">{valore}</div>
                    </div>
                  ))}
                </div>

                <hr className="border-secondary" />

                {/* Info venditore */}
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={fotoProfilo || 'https://via.placeholder.com/50/1a1a1a/ffffff?text=User'}
                      alt="Foto Profilo"
                      className="rounded-circle border border-secondary object-fit-cover"
                      style={{ width: 50, height: 50 }}
                    />
                    <h5 className="mb-0 font-monospace">{annuncio.utente}</h5>
                  </div>
                  <div className="text-end">
                    <span className="d-block text-secondary small font-monospace">Località:</span>
                    <div className="d-flex align-items-center gap-2 justify-content-end">
                      <i className="bi bi-geo-alt-fill text-danger"></i>
                      <h6 className="mb-0 font-monospace fw-bold">{annuncio.posizione}</h6>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrizione */}
              <div className="p-2">
                <h5 className="font-monospace text-uppercase colore_descrizione mb-3">Descrizione</h5>
                <p className="font-monospace text-light" style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {annuncio.descrizione}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
      <ModalLogin />
      <ModalFiltri />

      <style>{`
        .container-immagine-principale {
          height: 450px; width: 100%; display: flex; align-items: center;
          justify-content: center; background-color: #1a1a1a;
          border-radius: 0.375rem; overflow: hidden; position: relative;
        }
        .container-immagine-principale img { max-height: 100%; max-width: 100%; object-fit: contain; }
        .thumbnail-img { width: 90px; height: 90px; object-fit: cover; cursor: pointer; opacity: 0.5; transition: all 0.3s ease; border: 2px solid transparent; }
        .thumbnail-img:hover { opacity: 0.8; }
        .thumbnail-img.attiva { opacity: 1; border-color: #dc3545; }
        .scrollbar-nascosta::-webkit-scrollbar { height: 6px; }
        .scrollbar-nascosta::-webkit-scrollbar-thumb { background-color: #6c757d; border-radius: 10px; }
        .btn-navigazione { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(0,0,0,0.5); color: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; transition: all 0.3s ease; z-index: 10; opacity: 0; visibility: hidden; }
        .container-immagine-principale:hover .btn-navigazione { opacity: 1; visibility: visible; }
        .btn-navigazione:hover { background-color: rgba(255,17,0,0.5); transform: translateY(-50%) scale(1.1); }
        .btn-navigazione.prev { left: 15px; }
        .btn-navigazione.next { right: 15px; }
        .pulsante_verde { background-color: rgb(3,235,72); color: white; border: 2px solid rgb(3,235,72); transition: all 0.3s ease; }
        .pulsante_verde:hover { background-color: transparent; border-color: rgb(3,235,72); color: rgb(3,235,72); }
        .pulsante_arancione { background-color: rgb(255,17,0); color: white; border: 2px solid rgb(255,17,0); transition: all 0.3s ease; }
        .pulsante_arancione:hover { background-color: transparent; border-color: rgb(255,17,0); color: rgb(255,17,0); }
        .colore-titoli { color: rgb(220,80,80); }
        .colore_descrizione { color: rgb(200,200,210); }
        .box_citta_descrizione { background-color: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
      `}</style>
    </>
  );
}
