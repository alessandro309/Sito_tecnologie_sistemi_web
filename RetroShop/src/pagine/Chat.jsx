import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// ── Dati mock ──────────────────────────────────────────────────────────────────
const MOCK_CONVERSAZIONI = [
  {
    id: 1,
    utente: { nome: "Mario Rossi", avatar: "MR" },
    annuncio: { titolo: "PlayStation 2 Fat – ottimo stato", prezzo: "€ 85,00" },
    ultimoMessaggio: "Va bene, possiamo vederci domani in centro!",
    ora: "14:32",
    nonLetti: 2,
    attiva: true,
    messaggi: [
      { id: 1, testo: "Ciao! È ancora disponibile la PS2?", mio: false, ora: "14:10" },
      { id: 2, testo: "Sì, perfettamente funzionante, ho anche tutti i cavi originali.", mio: true, ora: "14:15" },
      { id: 3, testo: "Perfetto! Accetti 75€? Sono disposto a venirti a prendere.", mio: false, ora: "14:20" },
      { id: 4, testo: "Il prezzo è fisso a 85€, ma posso lasciarti un paio di giochi inclusi.", mio: true, ora: "14:25" },
      { id: 5, testo: "Affare fatto! Quali giochi hai?", mio: false, ora: "14:28" },
      { id: 6, testo: "Va bene, possiamo vederci domani in centro!", mio: false, ora: "14:32" },
    ],
  },
  {
    id: 2,
    utente: { nome: "Giulia Verdi", avatar: "GV" },
    annuncio: { titolo: "Game Boy Color – funzionante", prezzo: "€ 45,00" },
    ultimoMessaggio: "Ok, capisco. Grazie mille comunque!",
    ora: "Ieri",
    nonLetti: 0,
    attiva: false,
    messaggi: [
      { id: 1, testo: "Ciao, il Game Boy ha ancora le viti originali?", mio: false, ora: "Ieri 10:05" },
      { id: 2, testo: "Purtroppo no, una è stata sostituita, ma funziona perfettamente.", mio: true, ora: "Ieri 10:30" },
      { id: 3, testo: "Ok, capisco. Grazie mille comunque!", mio: false, ora: "Ieri 10:45" },
    ],
  },
  {
    id: 3,
    utente: { nome: "Luca Bianchi", avatar: "LB" },
    annuncio: { titolo: "Nintendo 64 + 3 giochi", prezzo: "€ 120,00" },
    ultimoMessaggio: "Ottimo! Ti mando la foto della console.",
    ora: "Lun",
    nonLetti: 0,
    attiva: false,
    messaggi: [
      { id: 1, testo: "È possibile spedire in Sicilia?", mio: false, ora: "Lun 09:00" },
      { id: 2, testo: "Certo, spedisco con corriere tracciato. Costi circa 8€.", mio: true, ora: "Lun 09:20" },
      { id: 3, testo: "Ottimo! Ti mando la foto della console.", mio: false, ora: "Lun 09:25" },
    ],
  },
  {
    id: 4,
    utente: { nome: "Sara Neri", avatar: "SN" },
    annuncio: { titolo: "Controller PS1 originale – nuovo", prezzo: "€ 22,00" },
    ultimoMessaggio: "Hai già venduto? Non vedo più l'annuncio.",
    ora: "Dom",
    nonLetti: 1,
    attiva: false,
    messaggi: [
      { id: 1, testo: "Hai già venduto? Non vedo più l'annuncio.", mio: false, ora: "Dom 20:15" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function Iniziali({ testo, size = 38 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        background: "#1a1a1a",
        border: "1.5px solid #dc3545",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        fontSize: size * 0.34,
        fontWeight: "bold",
        color: "#dc3545",
        letterSpacing: 1,
      }}
    >
      {testo}
    </div>
  );
}

// Ricava le iniziali da un nome completo o da un nickname
function inizialiDa(nome = "") {
  const parti = nome.trim().split(" ");
  if (parti.length >= 2) return (parti[0][0] + parti[1][0]).toUpperCase();
  return nome.slice(0, 2).toUpperCase();
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function Chat() {
  const location = useLocation();

  // Se arriviamo da PaginaAnnuncio, location.state contiene il contesto
  const nuovaChat = location.state ?? null;

  const [conversazioni, setConversazioni] = useState(() => {
    // Se c'è un contesto di navigazione, aggiungi in cima una nuova conversazione
    // (solo se non esiste già una con lo stesso venditore e annuncio)
    if (!nuovaChat) return MOCK_CONVERSAZIONI;

    const esiste = MOCK_CONVERSAZIONI.some(
      (c) =>
        c.utente.nome === nuovaChat.venditore &&
        c.annuncio.titolo === nuovaChat.titoloAnnuncio
    );
    if (esiste) return MOCK_CONVERSAZIONI;

    const nuova = {
      id: Date.now(),
      utente: { nome: nuovaChat.venditore, avatar: inizialiDa(nuovaChat.venditore) },
      annuncio: {
        titolo: nuovaChat.titoloAnnuncio,
        prezzo: `€ ${nuovaChat.prezzoAnnuncio}`,
      },
      ultimoMessaggio: "Nuova conversazione",
      ora: "Adesso",
      nonLetti: 0,
      attiva: false,
      messaggi: [],
    };
    return [nuova, ...MOCK_CONVERSAZIONI];
  });

  const [selezionata, setSelezionata] = useState(() => {
    // Apre automaticamente la nuova conversazione se arriviamo dall'annuncio
    if (!nuovaChat) return null;
    return conversazioni[0].utente.nome === nuovaChat.venditore
      ? conversazioni[0]
      : null;
  });

  const [testo, setTesto] = useState("");
  const [ricerca, setRicerca] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [selezionata?.messaggi]);

  function apriChat(conv) {
    setConversazioni((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, nonLetti: 0 } : c))
    );
    setSelezionata({ ...conv, nonLetti: 0 });
  }

  function invia() {
    if (!testo.trim() || !selezionata) return;
    const nuovo = {
      id: Date.now(),
      testo: testo.trim(),
      mio: true,
      ora: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    };
    const aggiornata = {
      ...selezionata,
      messaggi: [...selezionata.messaggi, nuovo],
      ultimoMessaggio: nuovo.testo,
      ora: "Adesso",
    };
    setSelezionata(aggiornata);
    setConversazioni((prev) =>
      prev.map((c) => (c.id === aggiornata.id ? aggiornata : c))
    );
    setTesto("");
  }

  const filtrate = conversazioni.filter(
    (c) =>
      c.utente.nome.toLowerCase().includes(ricerca.toLowerCase()) ||
      c.annuncio.titolo.toLowerCase().includes(ricerca.toLowerCase())
  );

  const totNonLetti = conversazioni.reduce((s, c) => s + c.nonLetti, 0);

  return (
    <div
      style={{
        background: "#141414",
        minHeight: "100vh",
        fontFamily: "monospace",
        color: "#fff",
      }}
    >
      {/* ── Navbar ── */}
      <nav
        style={{
          background: "#000",
          borderBottom: "1px solid #333",
          padding: "0 1.5rem",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: "bold", fontSize: 18, letterSpacing: 2, color: "#fff" }}>
            RETRO<span style={{ color: "#dc3545" }}>SHOP</span>
          </span>
        </a>
        <span
          style={{
            background: "#141414",
            border: "1px solid #333",
            borderRadius: 4,
            padding: "2px 10px",
            fontSize: 13,
            color: "#aaa",
          }}
        >
          Messaggi
        </span>
        {totNonLetti > 0 && (
          <span
            style={{
              background: "#000",
              border: "2px solid #dc3545",
              color: "#dc3545",
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {totNonLetti}
          </span>
        )}
      </nav>

      {/* ── Layout principale ── */}
      <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>

        {/* ── Sidebar lista conversazioni ── */}
        <aside
          style={{
            width: 320,
            minWidth: 260,
            maxWidth: 340,
            borderRight: "1px solid #222",
            background: "#0a0a0a",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Ricerca */}
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1f1f1f" }}>
            <div style={{ position: "relative" }}>
              <i
                className="bi bi-search"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#555",
                  fontSize: 14,
                }}
              />
              <input
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                placeholder="Cerca conversazione..."
                style={{
                  background: "#141414",
                  border: "1px solid #333",
                  borderRadius: 4,
                  color: "#fff",
                  padding: "7px 10px 7px 32px",
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Lista */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtrate.length === 0 && (
              <div style={{ padding: 24, color: "#555", fontSize: 13, textAlign: "center" }}>
                Nessuna conversazione trovata
              </div>
            )}
            {filtrate.map((conv) => {
              const attiva = selezionata?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => apriChat(conv)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #1a1a1a",
                    background: attiva ? "#1a0a0a" : "transparent",
                    borderLeft: attiva ? "3px solid #dc3545" : "3px solid transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <Iniziali testo={conv.utente.avatar} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "bold", fontSize: 13, color: "#fff" }}>
                        {conv.utente.nome}
                      </span>
                      <span style={{ fontSize: 11, color: "#555" }}>{conv.ora}</span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#dc3545",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginTop: 1,
                      }}
                    >
                      {conv.annuncio.titolo}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: conv.nonLetti > 0 ? "#ddd" : "#666",
                          fontWeight: conv.nonLetti > 0 ? "bold" : "normal",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "85%",
                        }}
                      >
                        {conv.ultimoMessaggio}
                      </span>
                      {conv.nonLetti > 0 && (
                        <span
                          style={{
                            background: "#dc3545",
                            color: "#fff",
                            borderRadius: "50%",
                            width: 18,
                            height: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: "bold",
                            minWidth: 18,
                          }}
                        >
                          {conv.nonLetti}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Pannello chat ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {!selezionata ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#333",
                gap: 12,
              }}
            >
              <i className="bi bi-chat-dots" style={{ fontSize: 52, color: "#222" }} />
              <p style={{ fontFamily: "monospace", fontSize: 13, color: "#444", letterSpacing: 1 }}>
                Seleziona una conversazione per iniziare
              </p>
            </div>
          ) : (
            <>
              {/* Header chat */}
              <div
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid #222",
                  background: "#000",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Iniziali testo={selezionata.utente.avatar} />
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 14 }}>
                    {selezionata.utente.nome}
                  </div>
                  <div style={{ fontSize: 11, color: "#dc3545" }}>
                    <i className="bi bi-tag me-1" />
                    {selezionata.annuncio.titolo}
                    <span style={{ color: "#555", marginLeft: 6 }}>·</span>
                    <span style={{ color: "#888", marginLeft: 6 }}>{selezionata.annuncio.prezzo}</span>
                  </div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  {selezionata.attiva ? (
                    <span style={{ fontSize: 11, color: "#2ecc71", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2ecc71", display: "inline-block" }} />
                      Online
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: "#555" }}>Offline</span>
                  )}
                </div>
              </div>

              {/* Messaggi */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {selezionata.messaggi.length === 0 && (
                  <div style={{ textAlign: "center", color: "#444", fontSize: 13, marginTop: 40 }}>
                    Inizia la conversazione con <strong style={{ color: "#dc3545" }}>{selezionata.utente.nome}</strong>
                  </div>
                )}
                {selezionata.messaggi.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: msg.mio ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={{ maxWidth: "68%" }}>
                      <div
                        style={{
                          padding: "9px 14px",
                          borderRadius: msg.mio ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          background: msg.mio ? "#dc3545" : "#1a1a1a",
                          border: msg.mio ? "none" : "1px solid #2a2a2a",
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "#fff",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.testo}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#444",
                          marginTop: 3,
                          textAlign: msg.mio ? "right" : "left",
                        }}
                      >
                        {msg.ora}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  borderTop: "1px solid #222",
                  padding: "12px 16px",
                  background: "#000",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-end",
                }}
              >
                <textarea
                  value={testo}
                  onChange={(e) => setTesto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      invia();
                    }
                  }}
                  placeholder="Scrivi un messaggio..."
                  rows={1}
                  style={{
                    flex: 1,
                    background: "#141414",
                    border: "1px solid #333",
                    borderRadius: 8,
                    color: "#fff",
                    padding: "9px 12px",
                    fontFamily: "monospace",
                    fontSize: 13,
                    resize: "none",
                    outline: "none",
                    lineHeight: 1.5,
                    maxHeight: 120,
                    overflow: "auto",
                  }}
                />
                <button
                  onClick={invia}
                  disabled={!testo.trim()}
                  style={{
                    background: testo.trim() ? "#dc3545" : "#2a2a2a",
                    border: "none",
                    borderRadius: 8,
                    color: testo.trim() ? "#fff" : "#555",
                    width: 40,
                    height: 40,
                    cursor: testo.trim() ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <i className="bi bi-send-fill" />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
