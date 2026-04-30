const http = require("http");
const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const PORT = 3001;
const DATA_FILE = path.join(__dirname, "dati", "chat.json");

// ── Persistenza ──────────────────────────────────────────────────────────────

function caricaDati() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { conversazioni: [], messaggi: [] };
  }
}

function salvaDati() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

let db = caricaDati();

// ── Express ───────────────────────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Conversazioni di un utente
app.get("/api/chat/conversazioni", (req, res) => {
  const { nickname } = req.query;
  if (!nickname) return res.status(400).json({ errore: "nickname richiesto" });

  const risultati = db.conversazioni
    .filter((c) => c.partecipanti.includes(nickname))
    .map((conv) => {
      const msgs = db.messaggi.filter((m) => m.conversazioneId === conv.id);
      const ultimo = msgs[msgs.length - 1] ?? null;
      return {
        ...conv,
        altroUtente: conv.partecipanti.find((p) => p !== nickname),
        ultimoMessaggio: ultimo?.testo ?? null,
        oraUltimo: ultimo?.ora ?? conv.creatoIl,
        nonLetti: msgs.filter((m) => m.mittente !== nickname && !m.letto).length,
      };
    })
    .sort((a, b) => new Date(b.oraUltimo) - new Date(a.oraUltimo));

  res.json(risultati);
});

// Crea o recupera una conversazione
app.post("/api/chat/conversazioni", (req, res) => {
  const { mittente, destinatario, idAnnuncio, titoloAnnuncio, prezzoAnnuncio } = req.body;
  if (!mittente || !destinatario || !idAnnuncio)
    return res.status(400).json({ errore: "Dati mancanti" });

  let conv = db.conversazioni.find(
    (c) =>
      c.partecipanti.includes(mittente) &&
      c.partecipanti.includes(destinatario) &&
      c.idAnnuncio === String(idAnnuncio)
  );

  if (!conv) {
    conv = {
      id: uuidv4(),
      partecipanti: [mittente, destinatario],
      idAnnuncio: String(idAnnuncio),
      titoloAnnuncio: titoloAnnuncio ?? "",
      prezzoAnnuncio: prezzoAnnuncio ?? "",
      creatoIl: new Date().toISOString(),
    };
    db.conversazioni.push(conv);
    salvaDati();
  }

  res.json(conv);
});

// Messaggi di una conversazione (marca come letti)
app.get("/api/chat/messaggi", (req, res) => {
  const { conversazioneId, nickname } = req.query;
  if (!conversazioneId) return res.status(400).json({ errore: "conversazioneId richiesto" });

  let modificato = false;
  db.messaggi.forEach((m) => {
    if (m.conversazioneId === conversazioneId && m.mittente !== nickname && !m.letto) {
      m.letto = true;
      modificato = true;
    }
  });
  if (modificato) salvaDati();

  res.json(db.messaggi.filter((m) => m.conversazioneId === conversazioneId));
});

// ── WebSocket ─────────────────────────────────────────────────────────────────

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// clienti: nickname → Set<WebSocket>
const clienti = new Map();

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws, request));
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws) => {
  let nickname = null;

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    if (msg.tipo === "autentica") {
      nickname = msg.nickname;
      if (!clienti.has(nickname)) clienti.set(nickname, new Set());
      clienti.get(nickname).add(ws);
      ws.send(JSON.stringify({ tipo: "autenticato" }));
      return;
    }

    if (msg.tipo === "messaggio") {
      if (!nickname) {
        ws.send(JSON.stringify({ tipo: "errore", messaggio: "Non autenticato" }));
        return;
      }

      const conv = db.conversazioni.find((c) => c.id === msg.conversazioneId);
      if (!conv || !conv.partecipanti.includes(nickname)) {
        ws.send(JSON.stringify({ tipo: "errore", messaggio: "Conversazione non trovata" }));
        return;
      }

      const nuovoMsg = {
        id: uuidv4(),
        conversazioneId: msg.conversazioneId,
        mittente: nickname,
        testo: String(msg.testo ?? "").trim(),
        ora: new Date().toISOString(),
        letto: false,
      };

      if (!nuovoMsg.testo) return;

      db.messaggi.push(nuovoMsg);
      salvaDati();

      const payload = JSON.stringify({ tipo: "messaggio", messaggio: nuovoMsg });
      conv.partecipanti.forEach((p) => {
        clienti.get(p)?.forEach((client) => {
          if (client.readyState === 1) client.send(payload);
        });
      });
    }
  });

  ws.on("close", () => {
    if (nickname && clienti.has(nickname)) {
      clienti.get(nickname).delete(ws);
      if (clienti.get(nickname).size === 0) clienti.delete(nickname);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chat server in ascolto su http://localhost:${PORT}`);
});
