import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, BASE } from "../api";
import Navbar from "../componenti/Navbar";
import ModalLogin from "../componenti/Login";
import ModalFiltri from "../componenti/Filtri";


// Formatta il timestamp del messaggio:
// - se è oggi mostra solo l'ora (es. "14:32")
// - se è ieri mostra "Ieri 14:32"
// - altrimenti mostra solo la data (es. "23/04")
function formattaOra(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const oggi = new Date();
  const ieri = new Date(oggi);
  ieri.setDate(oggi.getDate() - 1);
  if (d.toDateString() === oggi.toDateString())
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === ieri.toDateString())
    return "Ieri " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
}

// Estrae le prime due lettere dal nickname per mostrare nell'avatar
function inizialiDa(nome = "") {
  const parti = nome.trim().split(" ");
  if (parti.length >= 2) return (parti[0][0] + parti[1][0]).toUpperCase();
  return nome.slice(0, 2).toUpperCase();
}

// Avatar circolare: mostra la foto dell'annuncio se disponibile, altrimenti le iniziali
function Avatar({ nickname, foto, size = 48 }) {
  return (
    <div
      className="chat-avatar flex-shrink-0"
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.34 }}
    >
      {foto
        ? <img src={foto} alt="" className="chat-avatar-img" />
        : inizialiDa(nickname)
      }
    </div>
  );
}


export default function Chat() {
  const location = useLocation();
  const { utente, loading: authLoading } = useAuth();

  // Se arriviamo da PaginaAnnuncio (cliccando "Contatta venditore"),
  // location.state contiene i dati dell'annuncio da usare per aprire/creare la chat
  const nuovaChat = location.state ?? null;

  const [conversazioni, setConversazioni] = useState([]);
  const [selezionata, setSelezionata] = useState(null);
  const [messaggi, setMessaggi] = useState([]);
  const [testo, setTesto] = useState("");
  const [ricerca, setRicerca] = useState("");
  const [connesso, setConnesso] = useState(false);
  const [caricandoConv, setCaricandoConv] = useState(false);
  const [caricandoMsg, setCaricandoMsg] = useState(false);
  const [mostraSidebar, setMostraSidebar] = useState(true); // su mobile mostriamo o sidebar o chat

  const [fotoAnnunci, setFotoAnnunci] = useState({});
  const [rimborsoInCorso, setRimborsoInCorso] = useState(null); // idAnnuncio in elaborazione
  const [consegnaInCorso, setConsegnaInCorso] = useState(null); // idAnnuncio in elaborazione
  const [modalRimborso, setModalRimborso] = useState({ aperto: false, msg: null, spiegazione: '' });

  const wsRef = useRef(null);      // riferimento alla connessione WebSocket
  const endRef = useRef(null);     // elemento in fondo alla lista messaggi per lo scroll automatico

  // Questo ref serve perché il handler onmessage del WebSocket è una closure:
  // se usassimo direttamente lo state `selezionata`, vedrebbe sempre il valore
  // iniziale (null). Con il ref aggiorniamo sempre il valore corrente.
  const selezionataRef = useRef(null);

  // Evitiamo di aprire/creare due volte la stessa chat se l'effetto si ri-esegue
  const nuovaChatProcessata = useRef(false);

  // Disabilita il bounce/overscroll del browser mobile solo su questa pagina
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  // Teniamo aggiornato il ref ogni volta che cambia la conversazione selezionata
  useEffect(() => {
    selezionataRef.current = selezionata;
  }, [selezionata]);

  // Ogni volta che arriva un nuovo messaggio, scrolliamo automaticamente in fondo
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messaggi]);

  // Carica dal server la lista di tutte le conversazioni dell'utente,
  // poi scarica in parallelo la prima immagine di ogni annuncio
  async function fetchConversazioni() {
    if (!utente) return [];
    setCaricandoConv(true);
    try {
      const r = await fetch(`/api/chat/conversazioni?nickname=${utente.nickname}`);
      const data = await r.json();
      setConversazioni(data);

      const ids = [...new Set(data.map((c) => c.idAnnuncio).filter(Boolean))];
      Promise.allSettled(ids.map((id) => api.annuncio(id).then((r) => r.ok ? r.json() : null)))
        .then((results) => {
          const mappa = {};
          results.forEach((res, i) => {
            const ann = res.status === "fulfilled" ? res.value : null;
            mappa[ids[i]] = ann?.immagini?.length > 0 ? `${BASE}${ann.immagini[0].url_immagine}` : null;
          });
          setFotoAnnunci((prev) => ({ ...prev, ...mappa }));
        });

      return data;
    } catch {
      return [];
    } finally {
      setCaricandoConv(false);
    }
  }

  // Carica le conversazioni al primo render (e quando cambia l'utente)
  useEffect(() => {
    if (utente) fetchConversazioni();
  }, [utente?.nickname]); // eslint-disable-line react-hooks/exhaustive-deps


  // Connessione WebSocket: si apre appena l'utente è loggato e si chiude al logout
  useEffect(() => {
    if (!utente) return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Subito dopo la connessione ci autentichiamo mandando il nickname
      ws.send(JSON.stringify({ tipo: "autentica", nickname: utente.nickname }));
      setConnesso(true);
    };

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.tipo !== "messaggio") return;

      const nuovoMsg = msg.messaggio;
      const convAttiva = selezionataRef.current; // usiamo il ref, non lo state!

      // Se il messaggio appartiene alla chat aperta, lo aggiungiamo subito
      if (convAttiva?.id === nuovoMsg.conversazioneId) {
        setMessaggi((prev) => [...prev, nuovoMsg]);
      }

      // Aggiorniamo l'anteprima nella sidebar (ultimo messaggio + badge non letti)
      setConversazioni((prev) =>
        prev.map((c) => {
          if (c.id !== nuovoMsg.conversazioneId) return c;
          const nonLetti =
            nuovoMsg.mittente !== utente.nickname &&
            convAttiva?.id !== nuovoMsg.conversazioneId
              ? (c.nonLetti || 0) + 1
              : c.nonLetti;
          return { ...c, ultimoMessaggio: nuovoMsg.testo, oraUltimo: nuovoMsg.ora, nonLetti };
        })
      );
    };

    ws.onclose = () => setConnesso(false);
    ws.onerror = () => setConnesso(false);

    // Cleanup: chiudiamo il WebSocket quando usciamo dalla pagina
    return () => ws.close();
  }, [utente?.nickname]); // eslint-disable-line react-hooks/exhaustive-deps


  // Gestisce il caso in cui arriviamo dalla pagina di un annuncio cliccando "Contatta venditore"
  useEffect(() => {
    if (!nuovaChat || !utente || nuovaChatProcessata.current) return;
    nuovaChatProcessata.current = true; // segniamo che l'abbiamo già gestita

    // Crea la conversazione se non esiste ancora, o la recupera se esiste già
    fetch("/api/chat/conversazioni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mittente: utente.nickname,
        destinatario: nuovaChat.venditore,
        idAnnuncio: nuovaChat.idAnnuncio,
        titoloAnnuncio: nuovaChat.titoloAnnuncio,
        prezzoAnnuncio: nuovaChat.prezzoAnnuncio,
      }),
    })
      .then((r) => r.json())
      .then(async (conv) => {
        // Ricarichiamo la lista conversazioni e apriamo quella appena creata/trovata
        const convs = await fetchConversazioni();
        const trovata = convs.find((c) => c.id === conv.id) ?? {
          ...conv,
          altroUtente: nuovaChat.venditore,
          ultimoMessaggio: null,
          oraUltimo: conv.creatoIl,
          nonLetti: 0,
        };
        apriChat(trovata);
      })
      .catch(console.error);
  }, [utente?.nickname]); // eslint-disable-line react-hooks/exhaustive-deps


  // Apre una conversazione: carica i messaggi e azzera il badge dei non letti
  function apriChat(conv) {
    setSelezionata(conv);
    setMostraSidebar(false); // su mobile nascondiamo la sidebar e mostriamo la chat
    setMessaggi([]);
    setCaricandoMsg(true);
    setConversazioni((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, nonLetti: 0 } : c))
    );
    fetch(`/api/chat/messaggi?conversazioneId=${conv.id}&nickname=${utente.nickname}`)
      .then((r) => r.json())
      .then(setMessaggi)
      .catch(console.error)
      .finally(() => setCaricandoMsg(false));
  }

  // Invia il messaggio tramite WebSocket (solo se connessi e c'è del testo)
  function invia() {
    if (!testo.trim() || !selezionata || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      return;
    wsRef.current.send(
      JSON.stringify({ tipo: "messaggio", conversazioneId: selezionata.id, testo: testo.trim() })
    );
    setTesto("");
  }

  async function handleRimborso(msg, spiegazione) {
    setModalRimborso({ aperto: false, msg: null, spiegazione: '' });
    setRimborsoInCorso(msg.idAnnuncio);
    try {
      const res = await api.rimborsaAnnuncio(msg.idAnnuncio);
      // 404 = annuncio eliminato: il rimborso DB non è necessario, procediamo comunque
      if (!res.ok && res.status !== 204 && res.status !== 404) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Errore rimborso');
      }
      await api.aggiornaMessaggioChat(msg.id, { rimborsato: true });
      setMessaggi((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, rimborsato: true } : m))
      );
      await api.inviaMessaggioAcquisto({
        conversazioneId: msg.conversazioneId,
        mittente: 'sistema',
        testo: spiegazione.trim(),
        tipo: 'rimborso',
        acquirente: utente.nickname,
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setRimborsoInCorso(null);
    }
  }

  async function handleConfermaRicezione(msg) {
    setConsegnaInCorso(msg.idAnnuncio);
    try {
      await api.aggiornaMessaggioChat(msg.id, { consegnaConfermata: true });
      setMessaggi((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, consegnaConfermata: true } : m))
      );
      await api.inviaMessaggioAcquisto({
        conversazioneId: msg.conversazioneId,
        mittente: 'sistema',
        testo: `${utente.nickname} ha confermato la ricezione dell'articolo`,
        tipo: 'consegna',
        acquirente: utente.nickname,
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setConsegnaInCorso(null);
    }
  }

  // Filtra le conversazioni in base al testo cercato nella sidebar
  const filtrate = conversazioni.filter(
    (c) =>
      c.altroUtente?.toLowerCase().includes(ricerca.toLowerCase()) ||
      c.titoloAnnuncio?.toLowerCase().includes(ricerca.toLowerCase())
  );

  // Totale messaggi non letti da mostrare nel badge dell'header sidebar
  const totNonLetti = conversazioni.reduce((s, c) => s + (c.nonLetti || 0), 0);


  // Spinner mentre verifichiamo se l'utente è loggato
  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
          <div className="spinner-border text-danger" role="status" />
        </div>
      </>
    );
  }

  // Schermata per utenti non loggati
  if (!utente) {
    return (
      <>
        <Navbar />
        <ModalLogin />
        <ModalFiltri />
        <div className="d-flex flex-column align-items-center justify-content-center gap-3 font-monospace text-center" style={{ minHeight: "55vh" }}>
          <i className="bi bi-chat-lock-fill text-danger" style={{ fontSize: 52 }} />
          <h5 className="text-white mb-0 text-uppercase" style={{ letterSpacing: 2 }}>
            Retro<span className="text-danger">Chat</span>
          </h5>
          <p className="text-secondary small mb-0">Accedi per usare la chat.</p>
          <button
            className="btn bottone_login font-monospace text-uppercase px-4"
            data-bs-toggle="modal"
            data-bs-target="#modalLogin"
          >
            <i className="bi bi-person-fill me-2" />Accedi
          </button>
        </div>
      </>
    );
  }


  return (
    <>
      {/* position:fixed + inset:0 ancora il container all'esatto viewport visibile su tutti i browser mobile */}
      <div className="chat-container">
        <div className="flex-shrink-0">
          <Navbar />
        </div>

        <div className="chat-wrapper">

          {/* Sidebar sinistra con la lista delle conversazioni */}
          <aside className={`chat-sidebar${!mostraSidebar ? ' chat-nascosta-mobile' : ''}`}>

            {/* Header della sidebar: titolo + indicatore connessione */}
            <div className="chat-sidebar-header border-bottom border-dark">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="font-monospace fw-bold text-white text-uppercase" style={{ letterSpacing: 1 }}>
                  <i className="bi bi-chat-dots-fill text-danger me-2" />
                  Messaggi
                  {/* Badge con il numero totale di messaggi non letti */}
                  {totNonLetti > 0 && (
                    <span className="ms-2 badge badge-nonletti">
                      {totNonLetti}
                    </span>
                  )}
                </span>
                {/* Pallino verde = WebSocket connesso, grigio = disconnesso */}
                <span
                  className="font-monospace d-flex align-items-center gap-1"
                  style={{ fontSize: 11, color: connesso ? "#2ecc71" : "#6c757d" }}
                >
                  <span
                    className="dot-connessione"
                    style={{ background: connesso ? "#2ecc71" : "#6c757d" }}
                  />
                  {connesso ? "live" : "off"}
                </span>
              </div>

              {/* Campo di ricerca tra le conversazioni */}
              <div className="position-relative">
                <i
                  className="bi bi-search position-absolute text-secondary"
                  style={{ left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}
                />
                <input
                  value={ricerca}
                  onChange={(e) => setRicerca(e.target.value)}
                  placeholder="Cerca..."
                  className="form-control form-control-sm font-monospace chat-search"
                />
              </div>
            </div>

            {/* Lista conversazioni */}
            <div className="chat-conv-list">
              {caricandoConv ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-danger" role="status" />
                </div>
              ) : filtrate.length === 0 ? (
                <p className="text-secondary font-monospace small text-center py-4 mb-0">
                  {ricerca ? "Nessun risultato" : "Nessuna conversazione"}
                </p>
              ) : (
                filtrate.map((conv) => {
                  const attiva = selezionata?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => apriChat(conv)}
                      className={`chat-conv-item ${attiva ? "attiva" : ""}`}
                    >
                      <Avatar nickname={conv.altroUtente} foto={fotoAnnunci[conv.idAnnuncio]} />
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="font-monospace fw-bold text-white" style={{ fontSize: 16 }}>
                            {conv.altroUtente}
                          </span>
                          <span className="font-monospace text-secondary" style={{ fontSize: 13 }}>
                            {formattaOra(conv.oraUltimo)}
                          </span>
                        </div>
                        <div className="text-danger font-monospace text-truncate" style={{ fontSize: 14 }}>
                          {conv.titoloAnnuncio}
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          <span
                            className="font-monospace text-truncate"
                            style={{
                              fontSize: 14,
                              color: conv.nonLetti > 0 ? "#ddd" : "#666",
                              fontWeight: conv.nonLetti > 0 ? "bold" : "normal",
                              maxWidth: "85%",
                            }}
                          >
                            {conv.ultimoMessaggio ?? "Inizia la conversazione"}
                          </span>
                          {conv.nonLetti > 0 && (
                            <span className="badge rounded-pill bg-danger" style={{ fontSize: 12, minWidth: 20 }}>
                              {conv.nonLetti}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Pannello principale della chat */}
          <main className={`chat-main${mostraSidebar ? ' chat-nascosta-mobile' : ''}`}>
            {!selezionata ? (
              // Placeholder quando non c'è nessuna conversazione aperta
              <div className="d-flex flex-column align-items-center justify-content-center h-100 gap-3">
                <i className="bi bi-chat-square-dots" style={{ fontSize: 52, color: "#2a2a2a" }} />
                <p className="font-monospace text-secondary small text-uppercase mb-0" style={{ letterSpacing: 1 }}>
                  Seleziona una conversazione
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column h-100">

                {/* Header della chat: nome utente e titolo annuncio */}
                <div className="chat-panel-header border-bottom border-dark">
                  {/* Freccia "indietro" visibile solo su mobile */}
                  <button
                    className="btn btn-link text-white d-md-none p-0 me-1 flex-shrink-0"
                    onClick={() => setMostraSidebar(true)}
                    aria-label="Torna alle conversazioni"
                  >
                    <i className="bi bi-arrow-left fs-5" />
                  </button>
                  <Avatar nickname={selezionata.altroUtente} foto={fotoAnnunci[selezionata.idAnnuncio]} size={56} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="font-monospace fw-bold text-white" style={{ fontSize: 19 }}>
                      {selezionata.altroUtente}
                    </div>
                    <Link
                      to={`/annunci/${selezionata.idAnnuncio}`}
                      className="d-flex align-items-center gap-2 text-decoration-none mt-1"
                      style={{ color: "var(--colore-accento)" }}
                    >
                      <span className="font-monospace text-truncate" style={{ fontSize: 15 }}>
                        <i className="bi bi-tag me-1" />
                        {selezionata.titoloAnnuncio}
                        {selezionata.prezzoAnnuncio && (
                          <span className="text-secondary ms-2">· € {selezionata.prezzoAnnuncio}</span>
                        )}
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Area messaggi con scroll automatico */}
                <div className="chat-messages">
                  {caricandoMsg ? (
                    <div className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-danger" role="status" />
                    </div>
                  ) : messaggi.length === 0 ? (
                    <p className="font-monospace text-secondary small text-center py-5 mb-0">
                      Inizia la conversazione con{" "}
                      <span className="text-danger">{selezionata.altroUtente}</span>
                    </p>
                  ) : (
                    messaggi.map((msg) => {
                      if (msg.tipo === 'rimborso') {
                        const sonoAcquirente = msg.acquirente === utente.nickname;
                        return (
                          <div key={msg.id} className="d-flex justify-content-center mb-3">
                            <div
                              className="font-monospace text-center px-3 py-2 rounded-3"
                              style={{
                                background: sonoAcquirente ? 'rgba(255,17,0,0.05)' : 'rgba(255,17,0,0.12)',
                                border: `1px solid ${sonoAcquirente ? 'rgba(255,17,0,0.3)' : 'rgba(255,17,0,0.7)'}`,
                                color: sonoAcquirente ? 'rgb(255,130,130)' : 'rgb(255,80,80)',
                                fontSize: 13,
                                maxWidth: '85%',
                              }}
                            >
                              <div className="fw-bold mb-1">
                                <i className="bi bi-arrow-counterclockwise me-2" />
                                {sonoAcquirente ? 'Hai richiesto un rimborso' : `${msg.acquirente} ha richiesto un rimborso`}
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap', textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '6px 10px', marginTop: 4 }}>
                                {msg.testo}
                              </div>
                              <div className="text-secondary mt-1" style={{ fontSize: 11 }}>
                                {formattaOra(msg.ora)}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (msg.tipo === 'consegna') {
                        const sonoAcquirente = msg.acquirente === utente.nickname;
                        return (
                          <div key={msg.id} className="d-flex justify-content-center mb-3">
                            <div
                              className="font-monospace text-center px-3 py-2 rounded-3"
                              style={{
                                background: 'rgba(3,235,72,0.07)',
                                border: '1px solid rgba(3,235,72,0.3)',
                                color: 'rgb(100,220,100)',
                                fontSize: 13,
                                maxWidth: '85%',
                              }}
                            >
                              <div className="fw-bold mb-1">
                                <i className="bi bi-check-circle-fill me-2" style={{ color: 'rgb(3,235,72)' }} />
                                {sonoAcquirente ? 'Hai confermato la ricezione' : `${msg.acquirente} ha confermato la ricezione`}
                              </div>
                              <div className="text-secondary mt-1" style={{ fontSize: 11 }}>
                                {formattaOra(msg.ora)}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (msg.tipo === 'sistema') {
                        const d = msg.datiAcquisto;
                        const azioniDisponibili = msg.acquirente === utente.nickname && msg.idAnnuncio && !msg.rimborsato && !msg.consegnaConfermata;
                        const rimborsoAttivo = rimborsoInCorso === msg.idAnnuncio;
                        const consegnaAttiva = consegnaInCorso === msg.idAnnuncio;
                        return (
                          <div key={msg.id} className="d-flex justify-content-center mb-4">
                            <div className="font-monospace rounded-3 overflow-hidden" style={{ maxWidth: '88%', minWidth: 260, border: '1px solid rgba(3,235,72,0.3)', background: '#080808' }}>

                              {/* Header */}
                              <div className="d-flex align-items-center gap-2 px-3 py-2" style={{ background: 'rgba(3,235,72,0.13)', borderBottom: '1px solid rgba(3,235,72,0.2)' }}>
                                <i className="bi bi-bag-check-fill" style={{ color: 'rgb(3,235,72)', fontSize: 15 }} />
                                <span className="fw-bold text-uppercase" style={{ color: 'rgb(3,235,72)', fontSize: 11, letterSpacing: 1 }}>Acquisto completato</span>
                              </div>

                              {/* Dettagli */}
                              {d ? (
                                <div className="px-3 pt-2 pb-1" style={{ fontSize: 13 }}>
                                  {[
                                    ['Articolo',   <span className="fw-bold text-white">{d.nomeAnnuncio}</span>],
                                    ['Acquirente', d.acquirente],
                                    ['Venditore',  d.venditore],
                                    ['Prezzo',     `€ ${d.prezzoArticolo.toFixed(2)}`],
                                    ['Spedizione', `€ ${d.prezzoSpedizione.toFixed(2)}`],
                                  ].map(([label, val]) => (
                                    <div key={label} className="d-flex justify-content-between gap-3 mb-1">
                                      <span className="text-secondary">{label}</span>
                                      <span className="text-end" style={{ color: '#ccc' }}>{val}</span>
                                    </div>
                                  ))}
                                  <div className="d-flex justify-content-between gap-3 pt-1 mt-1" style={{ borderTop: '1px solid rgba(3,235,72,0.18)' }}>
                                    <span className="fw-bold" style={{ color: 'rgb(3,235,72)' }}>Totale</span>
                                    <span className="fw-bold" style={{ color: 'rgb(3,235,72)' }}>€ {(d.prezzoArticolo + d.prezzoSpedizione).toFixed(2)}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="px-3 py-2 text-center" style={{ fontSize: 13, color: 'rgb(3,235,72)' }}>
                                  {msg.testo}
                                </div>
                              )}

                              {/* Footer: timestamp + azioni acquirente */}
                              <div className="d-flex justify-content-between align-items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <span className="text-secondary" style={{ fontSize: 11 }}>{formattaOra(msg.ora)}</span>
                                {azioniDisponibili && (
                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-sm font-monospace d-flex align-items-center gap-1"
                                      style={{
                                        background: 'rgba(3,235,72,0.12)',
                                        border: '1px solid rgba(3,235,72,0.5)',
                                        color: 'rgb(100,220,100)',
                                        fontSize: 11,
                                        padding: '4px 12px',
                                        borderRadius: 6,
                                        transition: 'all 0.2s',
                                      }}
                                      onClick={() => handleConfermaRicezione(msg)}
                                      disabled={consegnaAttiva || rimborsoAttivo}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(3,235,72,0.25)'; e.currentTarget.style.color = 'rgb(3,235,72)'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(3,235,72,0.12)'; e.currentTarget.style.color = 'rgb(100,220,100)'; }}
                                    >
                                      {consegnaAttiva
                                        ? <><span className="spinner-border" style={{ width: 10, height: 10, borderWidth: 2 }} />Elaborazione...</>
                                        : <><i className="bi bi-check-circle" />Ricevuto</>
                                      }
                                    </button>
                                    <button
                                      className="btn btn-sm font-monospace d-flex align-items-center gap-1"
                                      style={{
                                        background: 'rgba(220,53,69,0.12)',
                                        border: '1px solid rgba(220,53,69,0.5)',
                                        color: '#f08080',
                                        fontSize: 11,
                                        padding: '4px 12px',
                                        borderRadius: 6,
                                        transition: 'all 0.2s',
                                      }}
                                      onClick={() => setModalRimborso({ aperto: true, msg, spiegazione: '' })}
                                      disabled={rimborsoAttivo || consegnaAttiva}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,53,69,0.25)'; e.currentTarget.style.color = '#ff8080'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(220,53,69,0.12)'; e.currentTarget.style.color = '#f08080'; }}
                                    >
                                      {rimborsoAttivo
                                        ? <><span className="spinner-border" style={{ width: 10, height: 10, borderWidth: 2 }} />Elaborazione...</>
                                        : <><i className="bi bi-arrow-counterclockwise" />Rimborso</>
                                      }
                                    </button>
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      }
                      const mio = msg.mittente === utente.nickname;
                      return (
                        <div
                          key={msg.id}
                          className={`d-flex mb-2 ${mio ? "justify-content-end" : "justify-content-start"}`}
                        >
                          <div style={{ maxWidth: "68%" }}>
                            {/* Bolla messaggio: rossa se è mia, grigia se è dell'altro */}
                            <div className={`chat-bubble ${mio ? "mia" : "altrui"} font-monospace`}>
                              {msg.testo}
                            </div>
                            <div
                              className="font-monospace text-secondary"
                              style={{ fontSize: 11, marginTop: 3, textAlign: mio ? "right" : "left" }}
                            >
                              {formattaOra(msg.ora)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Elemento invisibile per lo scroll automatico in fondo */}
                  <div ref={endRef} />
                </div>

                {/* Barra di input per scrivere e inviare messaggi */}
                <div className="chat-input-bar border-top border-dark">
                  <textarea
                    value={testo}
                    onChange={(e) => setTesto(e.target.value)}
                    onKeyDown={(e) => {
                      // Invio per inviare, Shift+Invio per andare a capo
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); invia(); }
                    }}
                    placeholder={connesso ? "Scrivi un messaggio..." : "In attesa di connessione..."}
                    disabled={!connesso}
                    rows={1}
                    className="chat-textarea font-monospace"
                  />
                  <button
                    onClick={invia}
                    disabled={!testo.trim() || !connesso}
                    className="btn chat-send-btn"
                    style={{
                      background: testo.trim() && connesso ? "var(--colore-accento)" : "#2a2a2a",
                      color: testo.trim() && connesso ? "#fff" : "#555",
                      border: `2px solid ${testo.trim() && connesso ? "var(--colore-accento)" : "#2a2a2a"}`,
                    }}
                  >
                    <i className="bi bi-send-fill" />
                  </button>
                </div>

              </div>
            )}
          </main>

        </div>
      </div>

      {/* Modal richiesta rimborso */}
      {modalRimborso.aperto && (
        <div
          className="modal d-block modal-backdrop-custom"
          style={{ zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalRimborso({ aperto: false, msg: null, spiegazione: '' }); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-black border border-danger text-white font-monospace shadow-lg">

              <div className="modal-header border-danger">
                <h5 className="modal-title text-uppercase fs-6 fw-bold">
                  <i className="bi bi-arrow-counterclockwise me-2 text-danger" />
                  Richiesta di rimborso
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setModalRimborso({ aperto: false, msg: null, spiegazione: '' })}
                />
              </div>

              <div className="modal-body">
                <p className="text-secondary small mb-2">
                  Spiega il motivo per cui vuoi richiedere il rimborso. Il venditore potrà leggere la tua spiegazione.
                </p>
                <textarea
                  className="form-control bg-dark border-secondary text-white font-monospace"
                  rows={5}
                  placeholder="Es: il prodotto non corrisponde alla descrizione, è arrivato danneggiato..."
                  value={modalRimborso.spiegazione}
                  onChange={(e) => setModalRimborso((s) => ({ ...s, spiegazione: e.target.value }))}
                  style={{ resize: 'none', fontSize: 14 }}
                  autoFocus
                />
              </div>

              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-outline-secondary rounded-1 text-uppercase fw-bold px-3 small"
                  onClick={() => setModalRimborso({ aperto: false, msg: null, spiegazione: '' })}
                >
                  Annulla
                </button>
                <button
                  className="btn btn-danger rounded-1 text-uppercase fw-bold px-3 small"
                  onClick={() => handleRimborso(modalRimborso.msg, modalRimborso.spiegazione)}
                  disabled={!modalRimborso.spiegazione.trim()}
                >
                  <i className="bi bi-send-fill me-1" />Invia richiesta
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
