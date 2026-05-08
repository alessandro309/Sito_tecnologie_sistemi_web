import { useState, useEffect, useRef } from 'react';
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
  const [annuncioInElimina, setAnnuncioInElimina] = useState(null);
  const [eliminazioneInCorso, setEliminazioneInCorso] = useState(false);
  const [erroreElimina, setErroreElimina] = useState(null);
  const [mostraModalEliminaAccount, setMostraModalEliminaAccount] = useState(false);
  const [eliminaAccountInCorso, setEliminaAccountInCorso] = useState(false);
  const [erroreEliminaAccount, setErroreEliminaAccount] = useState(null);

  const [formDati, setFormDati] = useState({ nome: '', cognome: '', mail: '', citta: '' });
  const [salvaDatiInCorso, setSalvaDatiInCorso] = useState(false);
  const [feedbackDati, setFeedbackDati] = useState(null);

  const inputFotoRef = useRef(null);
  const [caricandoFoto, setCaricandoFoto] = useState(false);

  const [formPassword, setFormPassword] = useState({ password_attuale: '', nuova_password: '', conferma_password: '' });
  const [salvaPasswordInCorso, setSalvaPasswordInCorso] = useState(false);
  const [feedbackPassword, setFeedbackPassword] = useState(null);
  const [mostraPassword, setMostraPassword] = useState({ attuale: false, nuova: false, conferma: false });

  const [sezioneAttiva, setSezioneAttiva] = useState('sezioneProfilo');

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

  // Evidenzia la voce attiva nella sidebar in base alla sezione visibile.
  // Dipende da loading/utente perché il DOM delle sezioni esiste solo dopo il render completo.
  useEffect(() => {
    if (loading || !utente) return;
    const ids = ['sezioneProfilo', 'sezioneMieiAnnunci', 'sezionePreferiti', 'sezioneImpostazioni'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setSezioneAttiva(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loading, utente]);

  // Carica i dati del profilo, gli annunci pubblicati e i preferiti
  useEffect(() => {
    if (!utente?.nickname) return;
    const nickname = utente.nickname;

    api.utente(nickname)
      .then((r) => r.ok ? r.json() : null)
      .then((dati) => setDatiProfilo(dati))
      .catch(console.error);

    api.ricercaAnnunci('')
      .then((r) => r.json())
      .then((tutti) => {
        setAnnunci(tutti.filter((a) => a.utente === nickname));
        setCaricamentoAnnunci(false);
      })
      .catch(() => setCaricamentoAnnunci(false));

    api.getPreferiti()
      .then((r) => r.ok ? r.json() : [])
      .then((dati) => {
        setPreferiti(dati);
        setCaricamentoPreferiti(false);
      })
      .catch(() => setCaricamentoPreferiti(false));
  }, [utente]);

  // Popola il form con i dati attuali appena arrivano dal server
  useEffect(() => {
    if (!datiProfilo) return;
    setFormDati({
      nome:    datiProfilo.nome    ?? '',
      cognome: datiProfilo.cognome ?? '',
      mail:    datiProfilo.mail    ?? '',
      citta:   datiProfilo.citta   ?? '',
    });
  }, [datiProfilo]);

  // Applica il tema scelto al body e lo salva in localStorage.
  // Si esegue anche al mount, garantendo che lo stato del body
  // sia sempre sincronizzato con il valore letto dal localStorage.
  useEffect(() => {
    if (tema === 'light') {
      document.body.classList.add('tema-chiaro');
      localStorage.setItem('temaSelezionato', 'light');
    } else {
      document.body.classList.remove('tema-chiaro');
      localStorage.setItem('temaSelezionato', 'dark');
    }
  }, [tema]);

  function handleElimina(annuncio) {
    setErroreElimina(null);
    setAnnuncioInElimina(annuncio);
  }

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
      if (nuovoStato) {
        setPreferiti((prev) => prev.filter((a) => a.idAnnuncio !== annuncio.idAnnuncio));
      } else {
        setPreferiti((prev) => [...prev, annuncio]);
      }
    }
  }

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
      setAnnunci((prev) => prev.filter((a) => a.idAnnuncio !== annuncioInElimina.idAnnuncio));
      setAnnuncioInElimina(null);
    } catch (e) {
      setErroreElimina(e.message);
    } finally {
      setEliminazioneInCorso(false);
    }
  }

  async function handleSalvaDati(e) {
    e.preventDefault();
    setSalvaDatiInCorso(true);
    setFeedbackDati(null);
    try {
      const res = await api.aggiornaDati(utente.nickname, formDati);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Errore durante il salvataggio');
      }
      const aggiornato = await res.json();
      setDatiProfilo(aggiornato);
      setFeedbackDati({ tipo: 'ok', messaggio: 'Dati aggiornati con successo!' });
    } catch (e) {
      setFeedbackDati({ tipo: 'errore', messaggio: e.message });
    } finally {
      setSalvaDatiInCorso(false);
    }
  }

  async function handleAggiornaPassword(e) {
    e.preventDefault();
    setFeedbackPassword(null);
    if (formPassword.nuova_password !== formPassword.conferma_password) {
      setFeedbackPassword({ tipo: 'errore', messaggio: 'Le nuove password non coincidono' });
      return;
    }
    if (formPassword.nuova_password.length < 6) {
      setFeedbackPassword({ tipo: 'errore', messaggio: 'La nuova password deve essere di almeno 6 caratteri' });
      return;
    }
    setSalvaPasswordInCorso(true);
    try {
      const res = await api.aggiornaPassword(utente.nickname, {
        password_attuale: formPassword.password_attuale,
        nuova_password:   formPassword.nuova_password,
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Errore durante il cambio password');
      }
      setFormPassword({ password_attuale: '', nuova_password: '', conferma_password: '' });
      setFeedbackPassword({ tipo: 'ok', messaggio: 'Password aggiornata con successo!' });
    } catch (e) {
      setFeedbackPassword({ tipo: 'errore', messaggio: e.message });
    } finally {
      setSalvaPasswordInCorso(false);
    }
  }

  async function handleCambiaFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCaricandoFoto(true);
    try {
      const res = await api.uploadFotoProfilo(utente.nickname, file);
      if (!res.ok) throw new Error();
      const utenteRes = await api.utente(utente.nickname);
      if (utenteRes.ok) setDatiProfilo(await utenteRes.json());
    } catch { /* silenzioso */ } finally {
      setCaricandoFoto(false);
      e.target.value = '';
    }
  }

  async function handleConfermaEliminaAccount() {
    setEliminaAccountInCorso(true);
    setErroreEliminaAccount(null);
    try {
      const res = await api.eliminaAccount(utente.nickname);
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Errore durante l'eliminazione dell'account");
      }
      window.location.href = "/";
    } catch (e) {
      setErroreEliminaAccount(e.message);
      setEliminaAccountInCorso(false);
    }
  }

  if (loading || !utente) return null;

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
              <img src="/Arcade_png-removebg-preview.png" alt="Logo" className="logo-navbar" />
              <span className="brand-text">
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
                  { href: '#sezioneProfilo',      icon: 'person-fill', label: 'Il mio profilo' },
                  { href: '#sezioneMieiAnnunci',  icon: 'tags-fill',   label: 'I miei annunci' },
                  { href: '#sezionePreferiti',    icon: 'floppy-fill', label: 'Annunci salvati' },
                  { href: '#sezioneImpostazioni', icon: 'gear-fill',   label: 'Impostazioni' },
                ].map((item) => (
                  <a key={item.href} href={item.href} className={`list-group-item list-group-item-action fw-bold text-uppercase py-3${sezioneAttiva === item.href.slice(1) ? ' active' : ''}`}>
                    <i className={`bi bi-${item.icon} me-2`}></i>{item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-9">

            {/* Sezione: dati profilo */}
            <section id="sezioneProfilo" className="pb-5 mb-5 border-bottom border-secondary">
              <div className="profilo-card p-4 mb-4 shadow">
                <div className="d-flex align-items-center gap-4 flex-wrap">
                  <div className="position-relative" style={{ width: 110, height: 110 }}>
                    <img
                      src={fotoProfilo}
                      alt="Foto Profilo"
                      className="profilo-avatar rounded-circle shadow"
                      style={{ cursor: 'pointer', opacity: caricandoFoto ? 0.5 : 1 }}
                      onClick={() => inputFotoRef.current?.click()}
                    />
                    <button
                      type="button"
                      className="position-absolute bottom-0 end-0 rounded-circle border-0 d-flex align-items-center justify-content-center p-0"
                      style={{ width: 28, height: 28, background: '#dc3545', cursor: 'pointer' }}
                      onClick={() => inputFotoRef.current?.click()}
                      disabled={caricandoFoto}
                      title="Cambia foto profilo"
                    >
                      {caricandoFoto
                        ? <span className="spinner-border spinner-border-sm text-white" style={{ width: 14, height: 14 }} />
                        : <i className="bi bi-camera-fill text-white lh-1" style={{ fontSize: '0.75rem' }}></i>
                      }
                    </button>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      ref={inputFotoRef}
                      className="d-none"
                      onChange={handleCambiaFoto}
                    />
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
              <div className="profilo-sezione-header d-flex justify-content-between align-items-center">
                <h4 className="profilo-sezione-titolo fw-bold text-uppercase">
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
                <div className="profilo-vuoto">
                  <div className="d-flex flex-column justify-content-center align-items-center py-5 text-secondary">
                    <i className="bi bi-tags fs-1 mb-3 opacity-50 text-danger"></i>
                    <p className="small text-uppercase mb-3">Non hai ancora pubblicato nessun annuncio</p>
                    <Link to="/crea-annuncio" className="btn bottone_login rounded-1 text-uppercase fw-bold px-4">
                      <i className="bi bi-plus-lg me-1"></i> Pubblica un annuncio
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
              <div className="profilo-sezione-header d-flex justify-content-between align-items-center">
                <h4 className="profilo-sezione-titolo fw-bold text-uppercase">
                  <i className="bi bi-floppy-fill text-danger me-2"></i>
                  Annunci Preferiti
                  <span className="text-danger ms-1">({preferiti.length})</span>
                </h4>
              </div>

              {caricamentoPreferiti ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-2 small text-secondary">Caricamento preferiti...</p>
                </div>
              ) : preferiti.length === 0 ? (
                <div className="profilo-vuoto">
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
              <div className="profilo-sezione-header">
                <h4 className="profilo-sezione-titolo fw-bold text-uppercase">
                  <i className="bi bi-gear-fill text-danger me-2"></i>Impostazioni Account
                </h4>
              </div>

              {/* Selezione tema */}
              <div className="profilo-panel">
                <h6 className="profilo-panel-label fw-bold text-uppercase">
                  Tema dell'interfaccia
                </h6>
                <div className="btn-group w-100 shadow-sm" role="group">
                  <input type="radio" className="btn-check" name="sceltaTema" id="temaScuro" value="dark" checked={tema === 'dark'} onChange={() => setTema('dark')} />
                  <label className="btn btn-outline-danger text-uppercase fw-bold py-2 rounded-start-1" htmlFor="temaScuro">
                    <i className="bi bi-moon-stars-fill me-2"></i>Retro Nes
                  </label>
                  <input type="radio" className="btn-check" name="sceltaTema" id="temaChiaro" value="light" checked={tema === 'light'} onChange={() => setTema('light')} />
                  <label className="btn btn-outline-danger text-uppercase fw-bold py-2 rounded-end-1" htmlFor="temaChiaro">
                    <i className="bi bi-sun-fill me-2"></i>Modern Wii
                  </label>
                </div>
              </div>

              {/* Informazioni personali */}
              <div className="profilo-panel">
                <h6 className="profilo-panel-label fw-bold text-uppercase">
                  Informazioni Personali
                </h6>
                <form onSubmit={handleSalvaDati}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Nome</label>
                      <input
                        type="text"
                        className="form-control bg-transparent text-white border-secondary rounded-1"
                        placeholder="Nome"
                        value={formDati.nome}
                        onChange={(e) => setFormDati((p) => ({ ...p, nome: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Cognome</label>
                      <input
                        type="text"
                        className="form-control bg-transparent text-white border-secondary rounded-1"
                        placeholder="Cognome"
                        value={formDati.cognome}
                        onChange={(e) => setFormDati((p) => ({ ...p, cognome: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Email</label>
                      <input
                        type="email"
                        className="form-control bg-transparent text-white border-secondary rounded-1"
                        placeholder="email@esempio.com"
                        value={formDati.mail}
                        onChange={(e) => setFormDati((p) => ({ ...p, mail: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary mb-1">Città</label>
                      <input
                        type="text"
                        className="form-control bg-transparent text-white border-secondary rounded-1"
                        placeholder="Città"
                        value={formDati.citta}
                        onChange={(e) => setFormDati((p) => ({ ...p, citta: e.target.value }))}
                      />
                    </div>
                    {feedbackDati && (
                      <div className="col-12">
                        <p className={`small mb-0 ${feedbackDati.tipo === 'ok' ? 'text-success' : 'text-danger'}`}>
                          <i className={`bi bi-${feedbackDati.tipo === 'ok' ? 'check-circle' : 'exclamation-triangle'} me-1`}></i>
                          {feedbackDati.messaggio}
                        </p>
                      </div>
                    )}
                    <div className="col-12 mt-2 text-end">
                      <button type="submit" className="btn bottone_login rounded-1 text-uppercase fw-bold px-4" disabled={salvaDatiInCorso}>
                        {salvaDatiInCorso
                          ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Salvataggio...</>
                          : 'Salva modifiche'
                        }
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Sicurezza password */}
              <div className="profilo-panel">
                <h6 className="profilo-panel-label fw-bold text-uppercase">
                  Sicurezza Password
                </h6>
                <form onSubmit={handleAggiornaPassword}>
                  <div className="row g-3">
                    {[
                      { campo: 'attuale',  label: 'Password attuale',        key: 'password_attuale' },
                      { campo: 'nuova',    label: 'Nuova Password',           key: 'nuova_password'   },
                      { campo: 'conferma', label: 'Conferma nuova Password',  key: 'conferma_password' },
                    ].map(({ campo, label, key }) => (
                      <div className="col-md-6" key={key}>
                        <label className="form-label small text-secondary mb-1">{label}</label>
                        <div className="input-group">
                          <input
                            type={mostraPassword[campo] ? 'text' : 'password'}
                            className="form-control bg-transparent text-white border-secondary rounded-start-1"
                            placeholder={label}
                            value={formPassword[key]}
                            onChange={(e) => setFormPassword((p) => ({ ...p, [key]: e.target.value }))}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary rounded-end-1"
                            onClick={() => setMostraPassword((p) => ({ ...p, [campo]: !p[campo] }))}
                            tabIndex={-1}
                          >
                            <i className={`bi bi-eye${mostraPassword[campo] ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                      </div>
                    ))}
                    {feedbackPassword && (
                      <div className="col-12">
                        <p className={`small mb-0 ${feedbackPassword.tipo === 'ok' ? 'text-success' : 'text-danger'}`}>
                          <i className={`bi bi-${feedbackPassword.tipo === 'ok' ? 'check-circle' : 'exclamation-triangle'} me-1`}></i>
                          {feedbackPassword.messaggio}
                        </p>
                      </div>
                    )}
                    <div className="col-12 mt-2 text-end">
                      <button type="submit" className="btn bottone_login rounded-1 text-uppercase fw-bold px-4" disabled={salvaPasswordInCorso}>
                        {salvaPasswordInCorso
                          ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Aggiornamento...</>
                          : 'Aggiorna Password'
                        }
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="mt-4 pt-4 border-top border-secondary d-flex justify-content-between align-items-center">
                <div>
                  <span className="small text-danger fw-bold text-uppercase">Zona pericolosa</span>
                  <p className="small text-secondary mb-0 mt-1">Questa azione è irreversibile. Tutti i tuoi annunci e dati verranno cancellati.</p>
                </div>
                <button
                  className="btn btn-sm btn-outline-danger text-uppercase fw-bold px-3 rounded-1 ms-3 text-nowrap"
                  onClick={() => { setErroreEliminaAccount(null); setMostraModalEliminaAccount(true); }}
                >
                  <i className="bi bi-person-x me-1"></i>Elimina Account
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
          className="modal d-block modal-backdrop-custom"
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

      {/* Modal di conferma eliminazione account */}
      {mostraModalEliminaAccount && (
        <div
          className="modal d-block modal-backdrop-custom"
          onClick={(e) => { if (e.target === e.currentTarget && !eliminaAccountInCorso) setMostraModalEliminaAccount(false); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-black border border-danger text-white font-monospace shadow-lg">
              <div className="modal-header border-danger">
                <h5 className="modal-title text-uppercase fs-6 fw-bold text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Elimina Account
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setMostraModalEliminaAccount(false)}
                  disabled={eliminaAccountInCorso}
                />
              </div>
              <div className="modal-body">
                <p className="small mb-2">
                  Stai per eliminare definitivamente l'account <strong className="text-danger">@{utente.nickname}</strong>.
                </p>
                <p className="small text-secondary mb-0">
                  Verranno cancellati tutti i tuoi annunci, i preferiti e la foto profilo. <strong>Non potrai recuperarli.</strong>
                </p>
                {erroreEliminaAccount && (
                  <p className="small text-danger mt-3 mb-0">
                    <i className="bi bi-exclamation-triangle me-1"></i>{erroreEliminaAccount}
                  </p>
                )}
              </div>
              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-outline-secondary rounded-1 text-uppercase fw-bold px-3 small"
                  onClick={() => setMostraModalEliminaAccount(false)}
                  disabled={eliminaAccountInCorso}
                >
                  Annulla
                </button>
                <button
                  className="btn btn-danger rounded-1 text-uppercase fw-bold px-3 small"
                  onClick={handleConfermaEliminaAccount}
                  disabled={eliminaAccountInCorso}
                >
                  {eliminaAccountInCorso
                    ? <span className="spinner-border spinner-border-sm" role="status" />
                    : <><i className="bi bi-person-x me-1"></i>Sì, elimina account</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
