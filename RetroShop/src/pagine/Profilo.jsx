import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, BASE } from '../api';
import CardAnnuncio from '../componenti/CardAnnuncio';
import Footer from '../componenti/Footer';

export default function Profilo() {
  const { utente, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [datiProfilo, setDatiProfilo] = useState(null);
  const [annunci, setAnnunci] = useState([]);
  const [caricamentoAnnunci, setCaricamentoAnnunci] = useState(true);
  const [preferiti, setPreferiti] = useState([]);
  const [caricamentoPreferiti, setCaricamentoPreferiti] = useState(true);
  const [tema, setTema] = useState(localStorage.getItem('temaSelezionato') || 'dark');
  const [annuncioInElimina, setAnnuncioInElimina] = useState(null); // annuncio selezionato per la conferma
  const [eliminazioneInCorso, setEliminazioneInCorso] = useState(false);
  const [erroreElimina, setErroreElimina] = useState(null);

  // Manda via gli utenti non loggati
  useEffect(() => {
    if (!loading && !utente) navigate('/');
  }, [utente, loading, navigate]);

  // Scrolla alla sezione giusta se l'URL contiene un hash (es. /profilo#sezionePreferiti)
  useEffect(() => {
    if (!location.hash || loading) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash, loading]);

  // Attiva il Bootstrap ScrollSpy per evidenziare la voce attiva nella sidebar
  useEffect(() => {
    document.body.setAttribute('data-bs-spy', 'scroll');
    document.body.setAttribute('data-bs-target', '#scroll-spy-nav');
    document.body.setAttribute('data-bs-offset', '120');
    return () => {
      document.body.removeAttribute('data-bs-spy');
      document.body.removeAttribute('data-bs-target');
      document.body.removeAttribute('data-bs-offset');
    };
  }, []);

  // Carica i dati del profilo, gli annunci pubblicati e i preferiti
  useEffect(() => {
    if (!utente?.nickname) return;
    const nickname = utente.nickname;

    // Dati anagrafici dell'utente
    api.utente(nickname)
      .then((r) => r.ok ? r.json() : null)
      .then((dati) => setDatiProfilo(dati))
      .catch(console.error);

    // Annunci: carichiamo tutti e filtriamo quelli dell'utente loggato
    api.ricercaAnnunci('')
      .then((r) => r.json())
      .then((tutti) => {
        setAnnunci(tutti.filter((a) => a.utente === nickname));
        setCaricamentoAnnunci(false);
      })
      .catch(() => setCaricamentoAnnunci(false));

    // Preferiti salvati dall'utente
    api.getPreferiti()
      .then((r) => r.ok ? r.json() : [])
      .then((dati) => {
        setPreferiti(dati);
        setCaricamentoPreferiti(false);
      })
      .catch(() => setCaricamentoPreferiti(false));
  }, [utente]);

  // Applica il tema scelto al body e lo salva in localStorage
  useEffect(() => {
    if (tema === 'light') {
      document.body.classList.add('tema-chiaro');
      localStorage.setItem('temaSelezionato', 'light');
    } else {
      document.body.classList.remove('tema-chiaro');
      localStorage.setItem('temaSelezionato', 'dark');
    }
  }, [tema]);

  // Apre il modal di conferma eliminazione
  function handleElimina(annuncio) {
    setErroreElimina(null);
    setAnnuncioInElimina(annuncio);
  }

  // Aggiunge o rimuove un annuncio dai preferiti con aggiornamento ottimistico
  async function handleTogglePreferito(annuncio, nuovoStato) {
    if (nuovoStato) {
      setPreferiti((prev) => [...prev, annuncio]);
    } else {
      setPreferiti((prev) => prev.filter((a) => a.idAnnuncio !== annuncio.idAnnuncio));
    }

    try {
      const res = nuovoStato
        ? await api.aggiungiPreferito(annuncio.idAnnuncio)
        : await api.rimuoviPreferito(annuncio.idAnnuncio);
      if (!res.ok && res.status !== 204 && res.status !== 201) throw new Error();
    } catch {
      // Se qualcosa va storto ripristiniamo il vecchio stato
      if (nuovoStato) {
        setPreferiti((prev) => prev.filter((a) => a.idAnnuncio !== annuncio.idAnnuncio));
      } else {
        setPreferiti((prev) => [...prev, annuncio]);
      }
    }
  }

  // Elimina l'annuncio dopo la conferma nel modal
  async function handleConfermaElimina() {
    if (!annuncioInElimina) return;
    setEliminazioneInCorso(true);
    setErroreElimina(null);
    try {
      const res = await api.eliminaAnnuncio(annuncioInElimina.idAnnuncio);
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Errore durante l\'eliminazione');
      }
      // Rimuoviamo l'annuncio dalla lista senza ricaricare tutto
      setAnnunci((prev) => prev.filter((a) => a.idAnnuncio !== annuncioInElimina.idAnnuncio));
      setAnnuncioInElimina(null);
    } catch (e) {
      setErroreElimina(e.message);
    } finally {
      setEliminazioneInCorso(false);
    }
  }

  // Aspettiamo che il context abbia caricato prima di renderizzare
  if (loading || !utente) return null;

  // Foto profilo: usiamo quella caricata dall'utente oppure un placeholder con le iniziali
  const iniziali = datiProfilo
    ? encodeURIComponent((datiProfilo.nome?.[0] ?? '?') + (datiProfilo.cognome?.[0] ?? ''))
    : '?';

  const fotoProfilo = datiProfilo?.foto_profilo
    ? `${BASE}${datiProfilo.foto_profilo}`
    : `https://dummyimage.com/150x150/1a1a1a/dc3545.png&text=${iniziali}`;

  const citta = datiProfilo?.citta
    ? datiProfilo.provincia ? `${datiProfilo.citta} (${datiProfilo.provincia})` : datiProfilo.citta
    : '—';

  return (
    <>
      <header className="mb-5 sticky-top">
        <nav className="navbar bg-black border-bottom border-secondary p-3 shadow">
          <div className="container d-flex justify-content-between align-items-center">
            <Link className="text-white text-decoration-none d-flex align-items-center gap-2 font-monospace" to="/">
              <i className="bi bi-arrow-left fs-5"></i>
              <span className="d-none d-sm-inline small text-uppercase fw-bold">Torna al negozio</span>
            </Link>
            <Link to="/" className="navbar-brand font-monospace text-uppercase d-flex align-items-center gap-2">
              <img
                src="/Arcade_png-removebg-preview.png"
                alt="Logo"
                style={{
                  height: 54,
                  filter: 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(220, 53, 69, 0.9))',
                }}
              />
              <span style={{ letterSpacing: '3px', fontSize: '1.1rem', lineHeight: 1 }}>
                <span className="text-white">RETRO</span>
                <span className="text-danger">SHOP</span>
              </span>
            </Link>
            <Link to="/crea-annuncio" className="btn bottone_login font-monospace text-uppercase rounded-1 d-flex align-items-center gap-2 py-1 px-3">
              <i className="bi bi-plus-circle fs-6"></i>
              <span className="d-none d-sm-inline">Crea Annuncio</span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mb-5 text-white font-monospace">
        <div className="row g-4">

          {/* Sidebar di navigazione (visibile solo su desktop) */}
          <div className="col-lg-3 d-none d-lg-block">
            <div className="sidebar-profilo sticky-top bg-black" style={{ top: 100 }}>
              <div className="list-group list-group-flush" id="scroll-spy-nav">
                {[
                  { href: '#sezioneProfilo',     icon: 'person-fill',  label: 'Il mio profilo' },
                  { href: '#sezioneMieiAnnunci', icon: 'tags-fill',    label: 'I miei annunci' },
                  { href: '#sezionePreferiti',   icon: 'floppy-fill',  label: 'Annunci salvati' },
                  { href: '#sezioneImpostazioni',icon: 'gear-fill',    label: 'Impostazioni' },
                ].map((item) => (
                  <a key={item.href} href={item.href} className="list-group-item list-group-item-action fw-bold text-uppercase py-3">
                    <i className={`bi bi-${item.icon} me-2`}></i>{item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-9">

            {/* Sezione: dati profilo */}
            <section id="sezioneProfilo" className="pb-5 mb-5 border-bottom border-secondary">
              <div className="profilo-header p-4 mb-4 shadow">
                <div className="d-flex align-items-center gap-4 flex-wrap">
                  <div className="avatar-wrapper">
                    <img src={fotoProfilo} alt="Foto Profilo" className="rounded-circle shadow" />
                  </div>
                  <div>
                    <h2 className="fw-bold mb-1 text-uppercase text-white">
                      {datiProfilo ? `${datiProfilo.nome} ${datiProfilo.cognome}` : utente.nickname}
                    </h2>
                    <p className="text-secondary mb-1 small">
                      <i className="bi bi-at me-1"></i>
                      <span className="text-white">{utente.nickname}</span>
                    </p>
                    <p className="text-secondary mb-1 small">
                      <i className="bi bi-geo-alt me-1"></i>{citta}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Sezione: annunci pubblicati dall'utente */}
            <section id="sezioneMieiAnnunci" className="pb-5 mb-5 border-bottom border-secondary">
              <div className="sezione-titolo d-flex justify-content-between align-items-center">
                <h4 className="fw-bold text-uppercase">
                  <i className="bi bi-tags-fill text-danger me-2"></i>
                  I miei annunci
                  <span className="text-danger ms-1">({annunci.length})</span>
                </h4>
              </div>

              {caricamentoAnnunci ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-2 small text-secondary">Caricamento annunci...</p>
                </div>
              ) : annunci.length === 0 ? (
                <div className="stato-vuoto">
                  <div className="d-flex flex-column justify-content-center align-items-center py-5 text-secondary">
                    <i className="bi bi-tags fs-1 mb-3 opacity-50 text-danger"></i>
                    <p className="small text-uppercase mb-3">Non hai ancora pubblicato nessun annuncio</p>
                    <Link to="/crea-annuncio" className="btn bottone_login rounded-1 text-uppercase fw-bold px-4">
                      <i className="bi bi-plus-lg me-1"></i> Crea il tuo primo annuncio
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="row g-4">
                  {annunci.map((a) => (
                    <div key={a.idAnnuncio} className="col-12 col-md-6 col-xl-4">
                      <CardAnnuncio annuncio={a} mostraElimina={true} onElimina={handleElimina} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sezione: annunci salvati nei preferiti */}
            <section id="sezionePreferiti" className="py-5 mb-5 border-bottom border-secondary">
              <div className="sezione-titolo d-flex justify-content-between align-items-center">
                <h4 className="fw-bold text-uppercase">
                  <i className="bi bi-floppy-fill text-danger me-2"></i>
                  Annunci Salvati
                  <span className="text-danger ms-1">({preferiti.length})</span>
                </h4>
              </div>

              {caricamentoPreferiti ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-2 small text-secondary">Caricamento preferiti...</p>
                </div>
              ) : preferiti.length === 0 ? (
                <div className="stato-vuoto">
                  <div className="d-flex flex-column justify-content-center align-items-center py-5 text-secondary">
                    <i className="bi bi-floppy fs-1 mb-3 opacity-50 text-danger"></i>
                    <p className="small text-uppercase mb-3">Nessun annuncio salvato nei preferiti</p>
                    <Link to="/" className="btn bottone_login rounded-1 text-uppercase fw-bold px-4">Esplora Negozio</Link>
                  </div>
                </div>
              ) : (
                <div className="row g-4">
                  {preferiti.map((a) => (
                    <div key={a.idAnnuncio} className="col-12 col-md-6 col-xl-4">
                      <CardAnnuncio
                        annuncio={a}
                        preferito={true}
                        onTogglePreferito={handleTogglePreferito}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sezione: impostazioni account */}
            <section id="sezioneImpostazioni" className="py-5">
              <div className="sezione-titolo">
                <h4 className="fw-bold text-uppercase">
                  <i className="bi bi-gear-fill text-danger me-2"></i>Impostazioni Account
                </h4>
              </div>

              {/* Selezione tema chiaro/scuro */}
              <div className="panel-impostazioni">
                <h6 className="fw-bold text-uppercase">Tema dell'interfaccia</h6>
                <div className="btn-group w-100 shadow-sm" role="group">
                  <input type="radio" className="btn-check" name="sceltaTema" id="temaScuro" value="dark" checked={tema === 'dark'} onChange={() => setTema('dark')} />
                  <label className="btn btn-outline-danger text-uppercase fw-bold py-2 rounded-start-1" htmlFor="temaScuro">
                    <i className="bi bi-moon-stars-fill me-2"></i>Retro Dark
                  </label>
                  <input type="radio" className="btn-check" name="sceltaTema" id="temaChiaro" value="light" checked={tema === 'light'} onChange={() => setTema('light')} />
                  <label className="btn btn-outline-danger text-uppercase fw-bold py-2 rounded-end-1" htmlFor="temaChiaro">
                    <i className="bi bi-sun-fill me-2"></i>Modern Wii
                  </label>
                </div>
              </div>

              {/* Modifica dati personali - TODO: collegare al backend */}
              <div className="panel-impostazioni">
                <h6 className="fw-bold text-uppercase">Informazioni Personali</h6>
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Nome</label>
                      <input type="text" className="form-control bg-transparent text-white border-secondary rounded-1" defaultValue={datiProfilo?.nome ?? ''} placeholder="Nome" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Cognome</label>
                      <input type="text" className="form-control bg-transparent text-white border-secondary rounded-1" defaultValue={datiProfilo?.cognome ?? ''} placeholder="Cognome" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Email</label>
                      <input type="email" className="form-control bg-transparent text-white border-secondary rounded-1" defaultValue={datiProfilo?.mail ?? ''} placeholder="email@esempio.com" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Città</label>
                      <input type="text" className="form-control bg-transparent text-white border-secondary rounded-1" defaultValue={datiProfilo?.citta ?? ''} placeholder="Città" />
                    </div>
                    <div className="col-12 mt-2 text-end">
                      <button type="submit" className="btn bottone_login rounded-1 text-uppercase fw-bold px-4">Salva modifiche</button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Cambio password - TODO: collegare al backend */}
              <div className="panel-impostazioni">
                <h6 className="fw-bold text-uppercase">Sicurezza Password</h6>
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Nuova Password</label>
                      <input type="password" className="form-control bg-transparent text-white border-secondary rounded-1" placeholder="********" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Conferma Password</label>
                      <input type="password" className="form-control bg-transparent text-white border-secondary rounded-1" placeholder="********" />
                    </div>
                    <div className="col-12 mt-2 text-end">
                      <button type="submit" className="btn bottone_login rounded-1 text-uppercase fw-bold px-4">Aggiorna Password</button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="mt-4 pt-4 border-top border-secondary d-flex justify-content-between align-items-center opacity-75">
                <span className="small text-secondary">Zona pericolosa</span>
                <button className="btn btn-sm btn-outline-secondary text-uppercase fw-bold px-3 rounded-1">
                  <i className="bi bi-person-x me-1"></i>Disabilita Account
                </button>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />

      {/* Modal di conferma eliminazione annuncio */}
      {annuncioInElimina && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={(e) => { if (e.target === e.currentTarget && !eliminazioneInCorso) setAnnuncioInElimina(null); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-black border border-secondary text-white font-monospace">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-uppercase fs-6 fw-bold">
                  <i className="bi bi-trash text-danger me-2"></i>Elimina annuncio
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setAnnuncioInElimina(null)}
                  disabled={eliminazioneInCorso}
                />
              </div>
              <div className="modal-body">
                <p className="small mb-1">
                  Sei sicuro di voler eliminare <strong>"{annuncioInElimina.nome}"</strong>?
                </p>
                <p className="small text-secondary mb-0">Questa azione è irreversibile.</p>
                {erroreElimina && (
                  <p className="small text-danger mt-2 mb-0">
                    <i className="bi bi-exclamation-triangle me-1"></i>{erroreElimina}
                  </p>
                )}
              </div>
              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-outline-secondary rounded-1 text-uppercase fw-bold px-3 small"
                  onClick={() => setAnnuncioInElimina(null)}
                  disabled={eliminazioneInCorso}
                >
                  Annulla
                </button>
                <button
                  className="btn btn-danger rounded-1 text-uppercase fw-bold px-3 small"
                  onClick={handleConfermaElimina}
                  disabled={eliminazioneInCorso}
                >
                  {eliminazioneInCorso
                    ? <span className="spinner-border spinner-border-sm" role="status" />
                    : <><i className="bi bi-trash me-1"></i>Elimina</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profilo-header { background-color: #000; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; }
        .avatar-wrapper img { width: 110px; height: 110px; object-fit: cover; border: 3px solid #dc3545; }
        .sezione-titolo { border-bottom: 1px solid #333; padding-bottom: 0.6rem; margin-bottom: 1.5rem; }
        .sezione-titolo h4 { font-size: 0.95rem; letter-spacing: 0.08em; margin: 0; }
        .panel-impostazioni { background-color: #000; border: 1px solid #333; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.25rem; }
        .panel-impostazioni h6 { font-size: 0.7rem; letter-spacing: 0.1em; color: #6c757d; margin-bottom: 1rem; }
        .stato-vuoto { background-color: #000; border: 1px dashed rgba(255,255,255,0.15); border-radius: 16px; }
      `}</style>
    </>
  );
}
