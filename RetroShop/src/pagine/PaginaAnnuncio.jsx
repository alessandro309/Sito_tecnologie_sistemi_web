import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../componenti/Navbar';
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
  const [mostraModalAcquisto, setMostraModalAcquisto] = useState(false);
  const [acquistoInCorso, setAcquistoInCorso] = useState(false);
  const [acquistoCompletato, setAcquistoCompletato] = useState(false);
  const [erroreAcquisto, setErroreAcquisto] = useState(null);
  const [datiCarta, setDatiCarta] = useState({ numero: '', intestatario: '', scadenza: '', cvv: '' });

  useEffect(() => {
    if (!utente) { setSalvato(false); return; }
    api.getPreferiti()
      .then((r) => r.ok ? r.json() : [])
      .then((dati) => setSalvato(dati.some((a) => a.idAnnuncio === parseInt(id))))
      .catch(() => {});
  }, [utente, id]);

  useEffect(() => {
    api.annuncio(id)
      .then((r) => r.json())
      .then(async (dati) => {
        setAnnuncio(dati);
        setAcquistoCompletato(dati.venduto ?? false);
        try {
          const utenteResp = await api.utente(dati.utente);
          if (utenteResp.ok) {
            const utenteDati = await utenteResp.json();
            if (utenteDati.foto_profilo) setFotoProfilo(BASE + utenteDati.foto_profilo);
          }
        } catch { /* foto profilo opzionale */ }
      })
      .catch(console.error);
  }, [id]);

  if (!annuncio) {
    return (
      <>
        <Navbar />
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

  function apriChat() {
    if (!utente) {
      const modal = document.getElementById('modalLogin');
      window.bootstrap?.Modal.getOrCreateInstance(modal)?.show();
      return;
    }
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

  function chiudiModalPagamento() {
    if (acquistoInCorso) return;
    setMostraModalAcquisto(false);
    setErroreAcquisto(null);
    setDatiCarta({ numero: '', intestatario: '', scadenza: '', cvv: '' });
  }

  async function handleConfermaAcquisto() {
    setAcquistoInCorso(true);
    setErroreAcquisto(null);
    try {
      const res = await api.acquistaAnnuncio(annuncio.idAnnuncio);
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Errore durante l'acquisto");
      }
      setAcquistoCompletato(true);
      chiudiModalPagamento();

      // Crea la conversazione in chat tra acquirente e venditore con riepilogo ordine
      try {
        const convRes = await api.creaConversazioneChat({
          mittente: utente.nickname,
          destinatario: annuncio.utente,
          idAnnuncio: String(annuncio.idAnnuncio),
          titoloAnnuncio: annuncio.nome,
          prezzoAnnuncio: annuncio.prezzo,
        });
        if (convRes.ok) {
          const conv = await convRes.json();
          const prezzoSpedizione = annuncio.prezzo_spedizione ?? 0;
          await api.inviaMessaggioAcquisto({
            conversazioneId: conv.id,
            mittente: 'sistema',
            testo: `Acquisto completato: ${annuncio.nome}`,
            tipo: 'sistema',
            acquirente: utente.nickname,
            idAnnuncio: String(annuncio.idAnnuncio),
            datiAcquisto: {
              nomeAnnuncio: annuncio.nome,
              acquirente: utente.nickname,
              venditore: annuncio.utente,
              prezzoArticolo: annuncio.prezzo,
              prezzoSpedizione,
            },
          });
        }
      } catch { /* il messaggio chat non è bloccante */ }
    } catch (e) {
      setErroreAcquisto(e.message);
    } finally {
      setAcquistoInCorso(false);
    }
  }

  const isProprietario = utente?.nickname === annuncio.utente;
  const acquistaNonDisponibile = acquistoCompletato || !annuncio.spedizione;

  const cartaValida =
    datiCarta.numero.replace(/\s/g, '').length === 16 &&
    datiCarta.intestatario.trim().length > 0 &&
    datiCarta.scadenza.length === 5 &&
    datiCarta.cvv.length === 3;

  async function handleSalva() {
    if (!utente) {
      const el = document.getElementById('modalLogin');
      window.bootstrap?.Modal.getOrCreateInstance(el)?.show();
      return;
    }
    setSalvato(!salvato);
    try {
      const res = salvato
        ? await api.rimuoviPreferito(parseInt(id))
        : await api.aggiungiPreferito(parseInt(id));
      if (!res.ok && res.status !== 204 && res.status !== 201) throw new Error();
    } catch {
      setSalvato(salvato);
    }
  }

  return (
    <>
      <Navbar />

      <div className="container mt-3 mb-0">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-link text-white text-decoration-none font-monospace small p-0 opacity-75"
        >
          <i className="bi bi-arrow-left me-1"></i>Torna allo shop
        </button>
      </div>

      <main>
        <div className="container my-5">
          <div className="row">

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

            <div className="col-lg-6 d-flex flex-column text-white">
              <div className="box_citta_descrizione p-4 rounded-4 border border-secondary shadow-sm mb-4">
                <div className="mb-4">
                  <h1 className="fw-bold font-monospace mb-2">{annuncio.nome}</h1>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="scritte_arancioni font-monospace fw-bold mb-0">€ {annuncio.prezzo}</h2>
                    <button
                      className={`btn ${salvato ? 'btn-danger' : 'btn-outline-danger'} font-monospace d-flex align-items-center gap-2 rounded-1`}
                      onClick={handleSalva}
                    >
                      <i className={`bi bi-floppy${salvato ? '-fill' : ''} fs-5`}></i>
                      <span className="d-none d-sm-inline">Salva</span>
                    </button>
                  </div>

                  <div className="d-flex gap-3 mt-2">
                    {isProprietario ? (
                      <button
                        className="btn pulsante_arancione font-monospace px-4 py-2 rounded-2 shadow-sm d-flex align-items-center justify-content-center flex-grow-1"
                        onClick={() => navigate(`/annunci/${id}/modifica`)}
                      >
                        <i className="bi bi-pencil-fill me-2"></i>Modifica
                      </button>
                    ) : (
                      <>
                        <button
                          className={`btn pulsante_verde font-monospace px-4 py-2 rounded-2 shadow-sm d-flex align-items-center justify-content-center flex-grow-1 ${acquistaNonDisponibile ? 'btn-acquisto-disabilitato' : ''}`}
                          onClick={() => { setErroreAcquisto(null); setMostraModalAcquisto(true); }}
                          disabled={acquistaNonDisponibile}
                          title={!annuncio.spedizione ? 'Acquisto disponibile solo per annunci con spedizione' : undefined}
                        >
                          <i className={`bi bi-${acquistoCompletato ? 'check-circle-fill' : 'cart-fill'} me-2`}></i>
                          {acquistoCompletato ? 'Acquistato' : 'Acquista'}
                        </button>
                        <button
                          className="btn pulsante_arancione font-monospace px-4 py-2 rounded-2 shadow-sm d-flex align-items-center justify-content-center flex-grow-1"
                          onClick={apriChat}
                          title={!utente ? 'Accedi per contattare il venditore' : `Contatta ${annuncio.utente}`}
                        >
                          <i className="bi bi-chat-dots-fill me-2"></i>Contatta
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Specifiche tecniche dell'articolo */}
                <div className="mb-4 font-monospace small">
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
                      className="rounded-circle border border-secondary foto-venditore"
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

              <div className="p-2">
                <h5 className="font-monospace text-uppercase colore_descrizione mb-3">Descrizione</h5>
                <p className="font-monospace text-light lh-base small" style={{whiteSpace: "pre-wrap"}}>
                  {annuncio.descrizione}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      {/* Modal pagamento — controllato con stato React, non tramite Bootstrap */}
      {mostraModalAcquisto && (
        <div
          className="modal d-block modal-backdrop-custom"
          onClick={(e) => { if (e.target === e.currentTarget) chiudiModalPagamento(); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-black border border-secondary text-white font-monospace shadow-lg">

              <div className="modal-header border-secondary">
                <h5 className="modal-title text-uppercase fs-6 fw-bold">
                  <i className="bi bi-credit-card-fill me-2 text-success"></i>
                  Pagamento
                </h5>
                <button className="btn-close btn-close-white" onClick={chiudiModalPagamento} disabled={acquistoInCorso} />
              </div>

              <div className="riepilogo-acquisto">
                <div className="d-flex justify-content-between align-items-center small mb-1">
                  <span className="text-secondary">Articolo</span>
                  <span className="fw-bold">{annuncio.nome}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center small mb-1">
                  <span className="text-secondary">Prezzo</span>
                  <span>€ {annuncio.prezzo.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center small mb-2">
                  <span className="text-secondary">Spedizione</span>
                  <span>€ {(annuncio.prezzo_spedizione ?? 0).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pt-2" style={{ borderTop: '1px solid rgba(3,235,72,0.18)' }}>
                  <span className="text-secondary small">Totale</span>
                  <span className="fw-bold fs-5 text-success">
                    € {(annuncio.prezzo + (annuncio.prezzo_spedizione ?? 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small text-secondary mb-1">Numero Carta</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary text-secondary">
                      <i className="bi bi-credit-card"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-white font-monospace carta-input"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={datiCarta.numero}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 16);
                        v = v.match(/.{1,4}/g)?.join(' ') ?? v;
                        setDatiCarta(d => ({ ...d, numero: v }));
                      }}
                      disabled={acquistoInCorso}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small text-secondary mb-1">Intestatario</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white font-monospace carta-input"
                    placeholder="Nome Cognome"
                    value={datiCarta.intestatario}
                    onChange={(e) => setDatiCarta(d => ({ ...d, intestatario: e.target.value }))}
                    disabled={acquistoInCorso}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-secondary text-uppercase mb-1">Scadenza</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-white font-monospace carta-input"
                      placeholder="MM/AA"
                      maxLength={5}
                      value={datiCarta.scadenza}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                        setDatiCarta(d => ({ ...d, scadenza: v }));
                      }}
                      disabled={acquistoInCorso}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-secondary text-uppercase mb-1">CVV</label>
                    <input
                      type="password"
                      className="form-control bg-dark border-secondary text-white font-monospace carta-input"
                      placeholder="•••"
                      maxLength={3}
                      value={datiCarta.cvv}
                      onChange={(e) => setDatiCarta(d => ({ ...d, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                      disabled={acquistoInCorso}
                    />
                  </div>
                </div>

                {erroreAcquisto && (
                  <p className="small text-danger mb-2">
                    <i className="bi bi-exclamation-triangle me-1"></i>{erroreAcquisto}
                  </p>
                )}

                <p className="text-center text-secondary mb-0" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-lock-fill me-1"></i>Transazione fittizia, non abbiamo budget per Visa/Mastercard
                </p>
              </div>

              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-outline-secondary rounded-1 text-uppercase fw-bold px-3 small"
                  onClick={chiudiModalPagamento}
                  disabled={acquistoInCorso}
                >
                  Annulla
                </button>
                <button
                  className={`btn rounded-1 text-uppercase fw-bold px-3 small btn-paga ${cartaValida ? 'valida' : ''}`}
                  onClick={handleConfermaAcquisto}
                  disabled={acquistoInCorso || !cartaValida}
                >
                  {acquistoInCorso
                    ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Elaborazione...</>
                    : <><i className="bi bi-lock-fill me-1"></i>Paga € {(annuncio.prezzo + (annuncio.prezzo_spedizione ?? 0)).toFixed(2)}</>
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <ModalLogin />
      <ModalFiltri />
    </>
  );
}
