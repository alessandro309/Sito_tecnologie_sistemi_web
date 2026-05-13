import {useState, useEffect, useRef} from "react";
import {useLocation, Link} from "react-router-dom";
import {useAuth} from "../contexts/AuthContext";
import {api, BASE} from "../api";
import Navbar from "../componenti/Navbar";
import ModalLogin from "../componenti/Login";
import ModalFiltri from "../componenti/Filtri";



// Converte un timestamp ISO in una stringa leggibile per l'utente:
// - oggi  → "14:32"
// - ieri  → "Ieri 14:32"
// - prima → "23/04"
function formattaOra(iso) {
  if (!iso) return "";

  const data = new Date(iso);
  const oggi = new Date();
  const ieri = new Date();
  ieri.setDate(oggi.getDate() - 1);

  const formatOra  = {hour: "2-digit", minute: "2-digit"};
  const formatData = {day:  "2-digit", month:  "2-digit"};

  if (data.toDateString() === oggi.toDateString())
    return data.toLocaleTimeString("it-IT", formatOra);

  if (data.toDateString() === ieri.toDateString())
    return "Ieri " + data.toLocaleTimeString("it-IT", formatOra);

  return data.toLocaleDateString("it-IT", formatData);
}

// Restituisce le prime due iniziali di un nickname
// "Mario Rossi" → "MR",  "mario" → "MA"
function inizialiDa(nome = "") {
  const parole = nome.trim().split(" ");
  if (parole.length >= 2)
    return (parole[0][0] + parole[1][0]).toUpperCase();
  return nome.slice(0, 2).toUpperCase();
}



// Cerchio con la foto dell'annuncio; se manca, mostra le iniziali del nickname
function Avatar({nickname, foto, size = 48}) {
  return (
    <div
      className="chat-avatar flex-shrink-0"
      style={{width: size, height: size, minWidth: size, fontSize: size * 0.34}}
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
  const {utente, loading: authLoading} = useAuth();

  // Se arriviamo cliccando "Contatta venditore" in PaginaAnnuncio,
  // location.state contiene i dati dell'annuncio; altrimenti è null
  const nuovaChat = location.state ?? null;


  const [conversazioni, setConversazioni] = useState([]);   // lista di tutte le chat
  const [selezionata, setSelezionata] = useState(null); // chat attualmente aperta
  const [messaggi, setMessaggi] = useState([]);   // messaggi della chat aperta

  const [testo, setTesto] = useState(""); // testo nel campo di scrittura
  const [ricerca, setRicerca] = useState(""); // testo nella barra di ricerca sidebar

  const [connesso, setConnesso] = useState(false);
  const [caricandoConv, setCaricandoConv] = useState(false);
  const [caricandoMsg, setCaricandoMsg] = useState(false);

  const [mostraSidebar, setMostraSidebar] = useState(true);  // su mobile: sidebar o chat
  const [fotoAnnunci, setFotoAnnunci] = useState({});    // mappa { idAnnuncio → urlFoto }

  const [rimborsoInCorso, setRimborsoInCorso] = useState(null); // idAnnuncio in elaborazione
  const [consegnaInCorso, setConsegnaInCorso] = useState(null); // idAnnuncio in elaborazione
  const [modalRimborso, setModalRimborso] = useState({aperto: false, msg: null, spiegazione: ""});



  const wsRef  = useRef(null); // connessione WebSocket attiva
  const endRef = useRef(null); // <div> invisibile in fondo ai messaggi, usato per lo scroll

  // I handler del WebSocket vengono creati una sola volta e "vedono" solo il valore
  // iniziale dello state. Per avere sempre il valore aggiornato usiamo un ref,
  // che aggiorniamo ad ogni render tramite l'useEffect dedicato qui sotto.
  const selezionataRef = useRef(null);

  // Flag che impedisce di aprire la stessa nuovaChat due volte
  // (in React StrictMode gli effetti vengono eseguiti due volte in sviluppo)
  const nuovaChatProcessata = useRef(false);



  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    selezionataRef.current = selezionata;
  }, [selezionata]);

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messaggi]);

  useEffect(() => {
    if (utente) fetchConversazioni();
  }, [utente?.nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!utente) return;

    // Usa wss:// su HTTPS, ws:// su HTTP
    const protocollo = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocollo}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({tipo: "autentica", nickname: utente.nickname}));
      setConnesso(true);
    };

    // Messaggio ricevuto dal server in tempo reale
    ws.onmessage = (event) => {
      let pacchetto;
      try {
        pacchetto = JSON.parse(event.data);
      } catch {
        return; // dati non validi
      }

      if (pacchetto.tipo !== "messaggio") return;

      const nuovoMsg = pacchetto.messaggio;
      const chatAperta = selezionataRef.current;

      if (chatAperta?.id === nuovoMsg.conversazioneId) {
        setMessaggi((prev) => [...prev, nuovoMsg]);
      }

      setConversazioni((prev) =>
        prev.map((conv) => {
          if (conv.id !== nuovoMsg.conversazioneId) return conv;

          // Incrementiamo il badge solo se il messaggio viene dall'altro utente
          // e la chat non è quella attualmente aperta
          const devoIncrementare =
            nuovoMsg.mittente !== utente.nickname &&
            chatAperta?.id !== nuovoMsg.conversazioneId;

          return {
            ...conv,
            ultimoMessaggio: nuovoMsg.testo,
            oraUltimo: nuovoMsg.ora,
            nonLetti: devoIncrementare ? (conv.nonLetti || 0) + 1 : conv.nonLetti,
          };
        })
      );
    };

    ws.onclose = () => setConnesso(false);
    ws.onerror = () => setConnesso(false);

    return () => ws.close();
  }, [utente?.nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!nuovaChat || !utente || nuovaChatProcessata.current) return;
    nuovaChatProcessata.current = true; // segniamo che abbiamo già gestito questa richiesta


    fetch("/api/chat/conversazioni", {
      method:  "POST",
      headers: {"Content-Type": "application/json"},
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
        // Ricarichiamo la lista e cerchiamo la conversazione appena creata/trovata
        const lista   = await fetchConversazioni();
        const trovata = lista.find((c) => c.id === conv.id) ?? {
          ...conv,
          altroUtente:     nuovaChat.venditore,
          ultimoMessaggio: null,
          oraUltimo:       conv.creatoIl,
          nonLetti:        0,
        };
        apriChat(trovata);
      })
      .catch(console.error);
  }, [utente?.nickname]); // eslint-disable-line react-hooks/exhaustive-deps



  // Scarica tutte le conversazioni dell'utente e, in parallelo, le foto degli annunci
  async function fetchConversazioni() {
    if (!utente) return [];
    setCaricandoConv(true);

    try {
      const risposta = await fetch(`/api/chat/conversazioni?nickname=${utente.nickname}`);
      const lista = await risposta.json();
      setConversazioni(lista);

      const ids = [...new Set(lista.map((c) => c.idAnnuncio).filter(Boolean))];

      // Scarichiamo le foto in background senza bloccare il return:
      // Promise.allSettled prosegue anche se alcune chiamate falliscono
      Promise.allSettled(
        ids.map((id) => api.annuncio(id).then((r) => (r.ok ? r.json() : null)))
      ).then((risultati) => {
        const mappa = {};
        risultati.forEach((res, i) => {
          const annuncio  = res.status === "fulfilled" ? res.value : null;
          const primaFoto = annuncio?.immagini?.[0]?.url_immagine;
          mappa[ids[i]]   = primaFoto ? `${BASE}${primaFoto}` : null;
        });
        // Aggiornamento additivo: non sovrascriviamo le foto già caricate
        setFotoAnnunci((prev) => ({...prev, ...mappa}));
      });

      return lista;
    } catch {
      return [];
    } finally {
      setCaricandoConv(false);
    }
  }

  // Apre una conversazione: carica i messaggi e azzera il badge
  function apriChat(conv) {
    setSelezionata(conv);
    setMostraSidebar(false); // su mobile nascondiamo la sidebar e mostriamo la chat
    setMessaggi([]);
    setCaricandoMsg(true);
    setConversazioni((prev) =>
      prev.map((c) => (c.id === conv.id ? {...c, nonLetti: 0} : c))
    );

    fetch(`/api/chat/messaggi?conversazioneId=${conv.id}&nickname=${utente.nickname}`)
      .then((r) => r.json())
      .then(setMessaggi)
      .catch(console.error)
      .finally(() => setCaricandoMsg(false));
  }

  // Invia un messaggio tramite WebSocket
  function invia() {
    const wsAperto = wsRef.current?.readyState === WebSocket.OPEN;
    if (!testo.trim() || !selezionata || !wsAperto) return;

    wsRef.current.send(
      JSON.stringify({tipo: "messaggio", conversazioneId: selezionata.id, testo: testo.trim()})
    );
    setTesto("");
  }

  // Avvia la procedura di rimborso per un acquisto
  async function handleRimborso(msg, spiegazione) {
    setModalRimborso({aperto: false, msg: null, spiegazione: ""});
    setRimborsoInCorso(msg.idAnnuncio);

    try {
      // Comunichiamo il rimborso al sistema di pagamento
      const res = await api.rimborsaAnnuncio(msg.idAnnuncio);
      // 404 = annuncio già eliminato → non blocchiamo, procediamo comunque
      const errore = !res.ok && res.status !== 204 && res.status !== 404;
      if (errore) {
        const dettaglio = await res.json().catch(() => ({}));
        throw new Error(dettaglio.detail || "Errore rimborso");
      }

      // Aggiorniamo il database e lo state locale
      await api.aggiornaMessaggioChat(msg.id, {rimborsato: true});
      setMessaggi((prev) =>
        prev.map((m) => (m.id === msg.id ? {...m, rimborsato: true} : m))
      );

      // Inseriamo un messaggio di sistema visibile in chat con la spiegazione
      await api.inviaMessaggioAcquisto({
        conversazioneId: msg.conversazioneId,
        mittente:"sistema",
        testo: spiegazione.trim(),
        tipo: "rimborso",
        acquirente: utente.nickname,
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setRimborsoInCorso(null);
    }
  }

  // Conferma che l'acquirente ha ricevuto l'articolo
  async function handleConfermaRicezione(msg) {
    setConsegnaInCorso(msg.idAnnuncio);

    try {
      // Aggiorniamo il database e lo state locale
      await api.aggiornaMessaggioChat(msg.id, {consegnaConfermata: true});
      setMessaggi((prev) =>
        prev.map((m) => (m.id === msg.id ? {...m, consegnaConfermata: true} : m))
      );

      // Inseriamo un messaggio di sistema visibile in chat
      await api.inviaMessaggioAcquisto({
        conversazioneId: msg.conversazioneId,
        mittente: "sistema",
        testo: `${utente.nickname} ha confermato la ricezione dell'articolo`,
        tipo: "consegna",
        acquirente: utente.nickname,
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setConsegnaInCorso(null);
    }
  }



  // Conversazioni filtrate in base al testo digitato nella barra di ricerca
  const filtrate = conversazioni.filter(
    (c) =>
      c.altroUtente?.toLowerCase().includes(ricerca.toLowerCase()) ||
      c.titoloAnnuncio?.toLowerCase().includes(ricerca.toLowerCase())
  );

  // Totale messaggi non letti (mostrato nel badge dell'header sidebar)
  const totNonLetti = conversazioni.reduce((somma, c) => somma + (c.nonLetti || 0), 0);


  // Mentre il context verifica la sessione, mostriamo uno spinner
  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="d-flex align-items-center justify-content-center" style={{minHeight: "50vh"}}>
          <div className="spinner-border text-danger" role="status" />
        </div>
      </>
    );
  }

  // Utente non loggato: mostriamo la schermata di accesso
  if (!utente) {
    return (
      <>
        <Navbar />
        <ModalLogin />
        <ModalFiltri />
        <div className="d-flex flex-column align-items-center justify-content-center gap-3 font-monospace text-center" style={{minHeight: "55vh"}}>
          <i className="bi bi-chat-lock-fill text-danger" style={{fontSize: 52}} />
          <h5 className="text-white mb-0 text-uppercase" style={{letterSpacing: 2}}>
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
      <div className="chat-container">
        <div className="flex-shrink-0">
          <Navbar />
        </div>

        <div className="chat-wrapper">

          {/* ── SIDEBAR: lista delle conversazioni ── */}
          <aside className={`chat-sidebar${!mostraSidebar ? " chat-nascosta-mobile" : ""}`}>

            {/* Header sidebar */}
            <div className="chat-sidebar-header border-bottom border-dark">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="font-monospace fw-bold text-white text-uppercase" style={{letterSpacing: 1}}>
                  <i className="bi bi-chat-dots-fill text-danger me-2" />
                  Messaggi
                  {totNonLetti > 0 && (
                    <span className="ms-2 badge badge-nonletti">{totNonLetti}</span>
                  )}
                </span>
                {/* Pallino verde = WebSocket connesso, grigio = disconnesso */}
                <span
                  className="font-monospace d-flex align-items-center gap-1"
                  style={{fontSize: 11, color: connesso ? "#2ecc71" : "#6c757d"}}
                >
                  <span
                    className="dot-connessione"
                    style={{background: connesso ? "#2ecc71" : "#6c757d"}}
                  />
                  {connesso ? "connesso" : "disconnesso"}
                </span>
              </div>

              {/* Barra di ricerca */}
              <div className="position-relative">
                <i
                  className="bi bi-search position-absolute text-secondary"
                  style={{left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13}}
                />
                <input
                  value={ricerca}
                  onChange={(e) => setRicerca(e.target.value)}
                  placeholder="Cerca..."
                  className="form-control form-control-sm font-monospace chat-search"
                />
              </div>
            </div>

            {/* Lista conversazioni: spinner / vuota / lista */}
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
                      <div className="flex-grow-1" style={{minWidth: 0}}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="font-monospace fw-bold text-white" style={{fontSize: 16}}>
                            {conv.altroUtente}
                          </span>
                          <span className="font-monospace text-secondary" style={{fontSize: 13}}>
                            {formattaOra(conv.oraUltimo)}
                          </span>
                        </div>
                        <div className="text-danger font-monospace text-truncate" style={{fontSize: 14}}>
                          {conv.titoloAnnuncio}
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          <span
                            className="font-monospace text-truncate"
                            style={{
                              fontSize:   14,
                              color: conv.nonLetti > 0 ? "#ddd" : "#666",
                              fontWeight: conv.nonLetti > 0 ? "bold" : "normal",
                              maxWidth: "85%",
                            }}
                          >
                            {conv.ultimoMessaggio ?? "Inizia la conversazione"}
                          </span>
                          {conv.nonLetti > 0 && (
                            <span className="badge rounded-pill bg-danger" style={{fontSize: 12, minWidth: 20}}>
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

          {/* ── PANNELLO PRINCIPALE: chat ── */}
          <main className={`chat-main${mostraSidebar ? " chat-nascosta-mobile" : ""}`}>
            {!selezionata ? (
              // Placeholder quando nessuna chat è aperta
              <div className="d-flex flex-column align-items-center justify-content-center h-100 gap-3">
                <i className="bi bi-chat-square-dots" style={{fontSize: 52, color: "#2a2a2a"}} />
                <p className="font-monospace text-secondary small text-uppercase mb-0" style={{letterSpacing: 1}}>
                  Seleziona una conversazione
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column h-100">

                {/* Header chat: avatar, nome utente, link all'annuncio */}
                <div className="chat-panel-header border-bottom border-dark">
                  {/* Freccia "indietro" visibile solo su mobile (d-md-none) */}
                  <button
                    className="btn btn-link text-white d-md-none p-0 me-1 flex-shrink-0"
                    onClick={() => setMostraSidebar(true)}
                    aria-label="Torna alle conversazioni"
                  >
                    <i className="bi bi-arrow-left fs-5" />
                  </button>
                  <Avatar nickname={selezionata.altroUtente} foto={fotoAnnunci[selezionata.idAnnuncio]} size={56} />
                  <div style={{minWidth: 0, flex: 1}}>
                    <div className="font-monospace fw-bold text-white" style={{fontSize: 19}}>
                      {selezionata.altroUtente}
                    </div>
                    <Link
                      to={`/annunci/${selezionata.idAnnuncio}`}
                      className="d-flex align-items-center gap-2 text-decoration-none mt-1"
                      style={{color: "var(--colore-accento)"}}
                    >
                      <span className="font-monospace text-truncate" style={{fontSize: 15}}>
                        <i className="bi bi-tag me-1" />
                        {selezionata.titoloAnnuncio}
                        {selezionata.prezzoAnnuncio && (
                          <span className="text-secondary ms-2">· € {selezionata.prezzoAnnuncio}</span>
                        )}
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Area messaggi: spinner / vuota / lista */}
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

                      // ── Notifica di rimborso richiesto ──
                      if (msg.tipo === "rimborso") {
                        const sonoAcquirente = msg.acquirente === utente.nickname;
                        return (
                          <div key={msg.id} className="d-flex justify-content-center mb-3">
                            <div
                              className="font-monospace text-center px-3 py-2 rounded-3"
                              style={{
                                background: sonoAcquirente ? "rgba(255,17,0,0.05)"  : "rgba(255,17,0,0.12)",
                                border: `1px solid ${sonoAcquirente ? "rgba(255,17,0,0.3)" : "rgba(255,17,0,0.7)"}`,
                                color: sonoAcquirente ? "rgb(255,130,130)"     : "rgb(255,80,80)",
                                fontSize: 13,
                                maxWidth: "85%",
                              }}
                            >
                              <div className="fw-bold mb-1">
                                <i className="bi bi-arrow-counterclockwise me-2" />
                                {sonoAcquirente
                                  ? "Hai richiesto un rimborso"
                                  : `${msg.acquirente} ha richiesto un rimborso`
                                }
                              </div>
                              <div style={{whiteSpace: "pre-wrap", textAlign: "left", background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "6px 10px", marginTop: 4}}>
                                {msg.testo}
                              </div>
                              <div className="text-secondary mt-1" style={{fontSize: 11}}>
                                {formattaOra(msg.ora)}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // ── Notifica di consegna confermata ──
                      if (msg.tipo === "consegna") {
                        const sonoAcquirente = msg.acquirente === utente.nickname;
                        return (
                          <div key={msg.id} className="d-flex justify-content-center mb-3">
                            <div
                              className="font-monospace text-center px-3 py-2 rounded-3"
                              style={{
                                background: "rgba(3,235,72,0.07)",
                                border: "1px solid rgba(3,235,72,0.3)",
                                color: "rgb(100,220,100)",
                                fontSize: 13,
                                maxWidth: "85%",
                              }}
                            >
                              <div className="fw-bold mb-1">
                                <i className="bi bi-check-circle-fill me-2" style={{color: "rgb(3,235,72)"}} />
                                {sonoAcquirente
                                  ? "Hai confermato la ricezione"
                                  : `${msg.acquirente} ha confermato la ricezione`
                                }
                              </div>
                              <div className="text-secondary mt-1" style={{fontSize: 11}}>
                                {formattaOra(msg.ora)}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // ── Card acquisto completato ──
                      if (msg.tipo === "sistema") {
                        const dati = msg.datiAcquisto;

                        // I bottoni sono visibili solo all'acquirente,
                        // e solo se non ha già eseguito un'azione su questo acquisto
                        const azioniDisponibili =
                          msg.acquirente === utente.nickname &&
                          msg.idAnnuncio &&
                          !msg.rimborsato &&
                          !msg.consegnaConfermata;

                        const rimborsoAttivo = rimborsoInCorso === msg.idAnnuncio;
                        const consegnaAttiva = consegnaInCorso === msg.idAnnuncio;

                        return (
                          <div key={msg.id} className="d-flex justify-content-center mb-4">
                            <div className="font-monospace rounded-3 overflow-hidden" style={{maxWidth: "92%", minWidth: 320, border: "1px solid rgba(3,235,72,0.35)", background: "#080808"}}>

                              {/* Header verde */}
                              <div className="d-flex align-items-center gap-2 px-4 py-3" style={{background: "rgba(3,235,72,0.13)", borderBottom: "1px solid rgba(3,235,72,0.2)"}}>
                                <i className="bi bi-bag-check-fill" style={{color: "rgb(3,235,72)", fontSize: 20}} />
                                <span className="fw-bold text-uppercase" style={{color: "rgb(3,235,72)", fontSize: 14, letterSpacing: 1}}>Acquisto completato</span>
                              </div>

                              {/* Dettagli acquisto */}
                              {dati ? (
                                <div className="px-4 pt-3 pb-2" style={{fontSize: 15}}>
                                  {[
                                    ["Articolo", <span className="fw-bold text-white">{dati.nomeAnnuncio}</span>],
                                    ["Acquirente", dati.acquirente],
                                    ["Venditore", dati.venditore],
                                    ["Prezzo", `€ ${dati.prezzoArticolo.toFixed(2)}`],
                                    ["Spedizione", `€ ${dati.prezzoSpedizione.toFixed(2)}`],
                                  ].map(([label, valore]) => (
                                    <div key={label} className="d-flex justify-content-between gap-3 mb-2">
                                      <span className="text-secondary">{label}</span>
                                      <span className="text-end" style={{color: "#ccc"}}>{valore}</span>
                                    </div>
                                  ))}
                                  <div className="d-flex justify-content-between gap-3 pt-2 mt-2" style={{borderTop: "1px solid rgba(3,235,72,0.25)", fontSize: 17}}>
                                    <span className="fw-bold" style={{color: "rgb(3,235,72)"}}>Totale</span>
                                    <span className="fw-bold" style={{color: "rgb(3,235,72)"}}>€ {(dati.prezzoArticolo + dati.prezzoSpedizione).toFixed(2)}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="px-4 py-3 text-center" style={{fontSize: 15, color: "rgb(3,235,72)"}}>
                                  {msg.testo}
                                </div>
                              )}

                              {/* Footer: timestamp + bottoni azione */}
                              <div className="d-flex justify-content-between align-items-center gap-2 px-4 py-3" style={{borderTop: "1px solid rgba(255,255,255,0.05)"}}>
                                <span className="text-secondary" style={{fontSize: 12}}>{formattaOra(msg.ora)}</span>
                                {azioniDisponibili && (
                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-sm font-monospace d-flex align-items-center gap-1"
                                      style={{background: "rgba(3,235,72,0.12)", border: "1px solid rgba(3,235,72,0.5)", color: "rgb(100,220,100)", fontSize: 13, padding: "6px 16px", borderRadius: 6, transition: "all 0.2s"}}
                                      onClick={() => handleConfermaRicezione(msg)}
                                      disabled={consegnaAttiva || rimborsoAttivo}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(3,235,72,0.25)"; e.currentTarget.style.color = "rgb(3,235,72)"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(3,235,72,0.12)"; e.currentTarget.style.color = "rgb(100,220,100)"; }}
                                    >
                                      {consegnaAttiva
                                        ? <><span className="spinner-border" style={{width: 12, height: 12, borderWidth: 2}} />Elaborazione...</>
                                        : <><i className="bi bi-check-circle" />Ricevuto</>
                                      }
                                    </button>
                                    <button
                                      className="btn btn-sm font-monospace d-flex align-items-center gap-1"
                                      style={{background: "rgba(220,53,69,0.12)", border: "1px solid rgba(220,53,69,0.5)", color: "#f08080", fontSize: 13, padding: "6px 16px", borderRadius: 6, transition: "all 0.2s"}}
                                      onClick={() => setModalRimborso({aperto: true, msg, spiegazione: ""})}
                                      disabled={rimborsoAttivo || consegnaAttiva}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,53,69,0.25)"; e.currentTarget.style.color = "#ff8080"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,53,69,0.12)"; e.currentTarget.style.color = "#f08080"; }}
                                    >
                                      {rimborsoAttivo
                                        ? <><span className="spinner-border" style={{width: 12, height: 12, borderWidth: 2}} />Elaborazione...</>
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

                      // ── Messaggio normale (bolla) ──
                      const mio = msg.mittente === utente.nickname;
                      return (
                        <div
                          key={msg.id}
                          className={`d-flex mb-2 ${mio ? "justify-content-end" : "justify-content-start"}`}
                        >
                          <div style={{maxWidth: "68%"}}>
                            <div className={`chat-bubble ${mio ? "mia" : "altrui"} font-monospace`}>
                              {msg.testo}
                            </div>
                            <div
                              className="font-monospace text-secondary"
                              style={{fontSize: 11, marginTop: 3, textAlign: mio ? "right" : "left"}}
                            >
                              {formattaOra(msg.ora)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Div invisibile su cui chiamiamo scrollIntoView per andare in fondo */}
                  <div ref={endRef} />
                </div>

                {/* Barra di input: textarea + bottone invio */}
                <div className="chat-input-bar border-top border-dark">
                  <textarea
                    value={testo}
                    onChange={(e) => setTesto(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter invia, Shift+Enter va a capo
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        invia();
                      }
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
                      color: testo.trim() && connesso ? "#fff"                  : "#555",
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

      {/* ── MODAL: richiesta di rimborso ── */}
      {modalRimborso.aperto && (
        <div
          className="modal d-block modal-backdrop-custom"
          style={{zIndex: 9999}}
          onClick={(e) => {
            // Chiude il modal solo se si clicca sul backdrop, non sul contenuto
            if (e.target === e.currentTarget)
              setModalRimborso({aperto: false, msg: null, spiegazione: ""});
          }}
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
                  onClick={() => setModalRimborso({aperto: false, msg: null, spiegazione: ""})}
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
                  onChange={(e) => setModalRimborso((s) => ({...s, spiegazione: e.target.value}))}
                  style={{resize: "none", fontSize: 14}}
                  autoFocus
                />
              </div>

              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-outline-secondary rounded-1 text-uppercase fw-bold px-3 small"
                  onClick={() => setModalRimborso({aperto: false, msg: null, spiegazione: ""})}
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