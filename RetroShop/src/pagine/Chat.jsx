import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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

// Piccolo componente per l'avatar circolare con le iniziali
function Avatar({ nickname, size = 38 }) {
  return (
    <div
      className="chat-avatar flex-shrink-0"
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.34 }}
    >
      {inizialiDa(nickname)}
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

  const wsRef = useRef(null);      // riferimento alla connessione WebSocket
  const endRef = useRef(null);     // elemento in fondo alla lista messaggi per lo scroll automatico

  // Questo ref serve perché il handler onmessage del WebSocket è una closure:
  // se usassimo direttamente lo state `selezionata`, vedrebbe sempre il valore
  // iniziale (null). Con il ref aggiorniamo sempre il valore corrente.
  const selezionataRef = useRef(null);

  // Evitiamo di aprire/creare due volte la stessa chat se l'effetto si ri-esegue
  const nuovaChatProcessata = useRef(false);

  // Teniamo aggiornato il ref ogni volta che cambia la conversazione selezionata
  useEffect(() => {
    selezionataRef.current = selezionata;
  }, [selezionata]);

  // Ogni volta che arriva un nuovo messaggio, scrolliamo automaticamente in fondo
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messaggi]);


  // Carica dal server la lista di tutte le conversazioni dell'utente
  async function fetchConversazioni() {
    if (!utente) return [];
    setCaricandoConv(true);
    try {
      const r = await fetch(`/api/chat/conversazioni?nickname=${utente.nickname}`);
      const data = await r.json();
      setConversazioni(data);
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

    const ws = new WebSocket(`ws://${window.location.host}/ws`);
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
      {/* Usiamo 100dvh per occupare tutto lo schermo, con la navbar fissa in cima */}
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ flexShrink: 0 }}>
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
                    <span
                      className="ms-2 badge"
                      style={{ background: "#000", border: "2px solid #dc3545", color: "#dc3545", fontSize: 11 }}
                    >
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
                    style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: connesso ? "#2ecc71" : "#6c757d",
                      display: "inline-block",
                    }}
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
                  style={{ paddingLeft: 30 }}
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
                      <Avatar nickname={conv.altroUtente} />
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="font-monospace fw-bold text-white" style={{ fontSize: 13 }}>
                            {conv.altroUtente}
                          </span>
                          <span className="font-monospace text-secondary" style={{ fontSize: 11 }}>
                            {formattaOra(conv.oraUltimo)}
                          </span>
                        </div>
                        <div className="text-danger font-monospace text-truncate" style={{ fontSize: 11 }}>
                          {conv.titoloAnnuncio}
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          <span
                            className="font-monospace text-truncate"
                            style={{
                              fontSize: 12,
                              color: conv.nonLetti > 0 ? "#ddd" : "#666",
                              fontWeight: conv.nonLetti > 0 ? "bold" : "normal",
                              maxWidth: "85%",
                            }}
                          >
                            {conv.ultimoMessaggio ?? "Inizia la conversazione"}
                          </span>
                          {conv.nonLetti > 0 && (
                            <span className="badge rounded-pill bg-danger" style={{ fontSize: 10, minWidth: 18 }}>
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
                  <Avatar nickname={selezionata.altroUtente} size={42} />
                  <div style={{ minWidth: 0 }}>
                    <div className="font-monospace fw-bold text-white" style={{ fontSize: 14 }}>
                      {selezionata.altroUtente}
                    </div>
                    <div
                      className="font-monospace text-truncate"
                      style={{ fontSize: 11, color: "var(--colore-accento)", maxWidth: 300 }}
                    >
                      <i className="bi bi-tag me-1" />
                      {selezionata.titoloAnnuncio}
                      {selezionata.prezzoAnnuncio && (
                        <span className="text-secondary ms-2">· € {selezionata.prezzoAnnuncio}</span>
                      )}
                    </div>
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
                              style={{ fontSize: 10, marginTop: 3, textAlign: mio ? "right" : "left" }}
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
                    placeholder={connesso ? "Scrivi un messaggio... (Invio per inviare)" : "In attesa di connessione..."}
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

      <ModalLogin />
      <ModalFiltri />

      <style>{`
        .chat-wrapper {
          flex: 1;
          min-height: 0;
          display: flex;
          overflow: hidden;
          background: #0a0a0a;
        }

        .chat-sidebar {
          width: 300px;
          min-width: 260px;
          max-width: 320px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: #000;
          border-right: 1px solid #1e1e1e;
        }

        .chat-sidebar-header {
          padding: 14px 16px 12px;
          flex-shrink: 0;
        }

        .chat-search {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid #333 !important;
          color: #fff !important;
          border-radius: 4px !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .chat-search:focus {
          border-color: var(--colore-accento) !important;
          box-shadow: 0 0 0 0.15rem rgba(255,17,0,0.2) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        .chat-search::placeholder { color: rgba(255,255,255,0.25) !important; }

        .chat-conv-list {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }
        .chat-conv-list::-webkit-scrollbar { width: 3px; }
        .chat-conv-list::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }

        .chat-conv-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 13px 16px;
          cursor: pointer;
          border-bottom: 1px solid #111;
          border-left: 3px solid transparent;
          transition: background 0.15s, border-color 0.15s;
        }
        .chat-conv-item:hover {
          background: rgba(255,17,0,0.05);
        }
        .chat-conv-item.attiva {
          background: rgba(255,17,0,0.08);
          border-left-color: var(--colore-accento);
        }

        .chat-avatar {
          border-radius: 50%;
          background: #1a1a1a;
          border: 1.5px solid var(--colore-accento);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          font-weight: bold;
          color: var(--colore-accento);
          letter-spacing: 1px;
        }

        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #0d0d0d;
        }

        .chat-panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: #000;
          flex-shrink: 0;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .chat-messages::-webkit-scrollbar { width: 3px; }
        .chat-messages::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }

        .chat-bubble {
          padding: 9px 14px;
          font-size: 13px;
          line-height: 1.5;
          color: #fff;
          word-break: break-word;
        }
        .chat-bubble.mia {
          background: var(--colore-accento);
          border-radius: 14px 14px 4px 14px;
        }
        .chat-bubble.altrui {
          background: rgba(255,255,255,0.04);
          border: 1px solid #2a2a2a;
          border-radius: 14px 14px 14px 4px;
        }

        .chat-input-bar {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          padding: 12px 16px;
          background: #000;
          flex-shrink: 0;
        }
        .chat-textarea {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid #333;
          border-radius: 8px;
          color: #fff;
          padding: 9px 12px;
          font-size: 13px;
          resize: none;
          outline: none;
          line-height: 1.5;
          max-height: 120px;
          overflow: auto;
          transition: border-color 0.2s;
        }
        .chat-textarea:focus { border-color: var(--colore-accento); }
        .chat-textarea::placeholder { color: rgba(255,255,255,0.25); }
        .chat-textarea:disabled { opacity: 0.35; }

        .chat-send-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px !important;
          flex-shrink: 0;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          font-size: 15px;
        }

        /* Su mobile mostriamo o la sidebar o la chat, mai entrambe */
        @media (max-width: 767px) {
          .chat-sidebar {
            width: 100%;
            min-width: 100%;
            max-width: 100%;
            border-right: none;
          }
          .chat-main { width: 100%; }
          .chat-nascosta-mobile { display: none !important; }
          .chat-messages { padding: 14px 12px; }
          .chat-input-bar { padding: 10px 12px; }
          .chat-panel-header { padding: 10px 12px; }
        }
      `}</style>
    </>
  );
}
