import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Set, Optional, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from pydantic import BaseModel

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dati", "chat.json")

router = APIRouter()

# nickname → set di WebSocket attivi
clienti: Dict[str, Set[WebSocket]] = {}


def carica_dati() -> dict:
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"conversazioni": [], "messaggi": []}


# Persiste il db in memoria su file JSON
def salva_dati() -> None:
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)


db = carica_dati()


# Invia un payload testuale a tutti i WebSocket attivi dei partecipanti
async def _broadcast(partecipanti: list, payload: str) -> None:
    for p in partecipanti:
        for ws in list(clienti.get(p, set())):
            try:
                await ws.send_text(payload)
            except Exception:
                clienti[p].discard(ws)


class NuovaConversazione(BaseModel):
    mittente: str
    destinatario: str
    idAnnuncio: Any
    titoloAnnuncio: Optional[str] = ""
    prezzoAnnuncio: Optional[Any] = ""


class NuovoMessaggio(BaseModel):
    conversazioneId: str
    mittente: str
    testo: str
    tipo: Optional[str] = None
    acquirente: Optional[str] = None
    idAnnuncio: Optional[Any] = None
    datiAcquisto: Optional[Any] = None


# Restituisce le conversazioni dell'utente arricchite con ultimo messaggio e contatore non letti
@router.get("/api/chat/conversazioni")
def get_conversazioni(nickname: str = Query(...)):
    risultati = []
    for conv in db["conversazioni"]:
        if nickname not in conv["partecipanti"]:
            continue
        msgs = [m for m in db["messaggi"] if m["conversazioneId"] == conv["id"]]
        ultimo = msgs[-1] if msgs else None
        risultati.append({
            **conv,
            "altroUtente": next((p for p in conv["partecipanti"] if p != nickname), None),
            "ultimoMessaggio": ultimo["testo"] if ultimo else None,
            "oraUltimo": ultimo["ora"] if ultimo else conv["creatoIl"],
            "nonLetti": sum(1 for m in msgs if m["mittente"] != nickname and not m.get("letto", False)),
        })
    risultati.sort(key=lambda c: c["oraUltimo"], reverse=True)
    return risultati


# Crea una nuova conversazione se non esiste già tra gli stessi partecipanti per lo stesso annuncio
@router.post("/api/chat/conversazioni")
def crea_conversazione(dati: NuovaConversazione):
    id_annuncio = str(dati.idAnnuncio)
    conv = next(
        (c for c in db["conversazioni"]
         if dati.mittente in c["partecipanti"]
         and dati.destinatario in c["partecipanti"]
         and c["idAnnuncio"] == id_annuncio),
        None,
    )
    if not conv:
        conv = {
            "id": str(uuid.uuid4()),
            "partecipanti": [dati.mittente, dati.destinatario],
            "idAnnuncio": id_annuncio,
            "titoloAnnuncio": dati.titoloAnnuncio or "",
            "prezzoAnnuncio": dati.prezzoAnnuncio or "",
            "creatoIl": datetime.now(timezone.utc).isoformat(),
        }
        db["conversazioni"].append(conv)
        salva_dati()
    return conv


# Restituisce i messaggi di una conversazione e marca come letti quelli non ancora letti
@router.get("/api/chat/messaggi")
def get_messaggi(conversazioneId: str = Query(...), nickname: str = Query(None)):
    modificato = False
    for m in db["messaggi"]:
        if m["conversazioneId"] == conversazioneId and m["mittente"] != nickname and not m.get("letto", False):
            m["letto"] = True
            modificato = True
    if modificato:
        salva_dati()
    return [m for m in db["messaggi"] if m["conversazioneId"] == conversazioneId]


# Salva un nuovo messaggio e lo notifica in tempo reale a tutti i partecipanti connessi
@router.post("/api/chat/messaggi", status_code=201)
async def invia_messaggio(dati: NuovoMessaggio):
    conv = next((c for c in db["conversazioni"] if c["id"] == dati.conversazioneId), None)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversazione non trovata")

    nuovo_msg: dict = {
        "id": str(uuid.uuid4()),
        "conversazioneId": dati.conversazioneId,
        "mittente": dati.mittente,
        "testo": dati.testo.strip(),
        "ora": datetime.now(timezone.utc).isoformat(),
        "letto": False,
    }
    if dati.tipo is not None:
        nuovo_msg["tipo"] = dati.tipo
    if dati.acquirente is not None:
        nuovo_msg["acquirente"] = dati.acquirente
    if dati.idAnnuncio is not None:
        nuovo_msg["idAnnuncio"] = str(dati.idAnnuncio)
    if dati.datiAcquisto is not None:
        nuovo_msg["datiAcquisto"] = dati.datiAcquisto

    db["messaggi"].append(nuovo_msg)
    salva_dati()

    await _broadcast(conv["partecipanti"], json.dumps({"tipo": "messaggio", "messaggio": nuovo_msg}))
    return nuovo_msg


# Aggiorna campi arbitrari di un messaggio esistente (es. stato acquisto)
@router.patch("/api/chat/messaggi/{msg_id}")
def aggiorna_messaggio(msg_id: str, body: Dict[str, Any] = Body(...)):
    msg = next((m for m in db["messaggi"] if m["id"] == msg_id), None)
    if not msg:
        raise HTTPException(status_code=404, detail="Messaggio non trovato")
    msg.update(body)
    salva_dati()
    return msg


# Gestisce la connessione WebSocket: autentica l'utente e smista i messaggi in tempo reale
@router.websocket("/ws")
async def websocket_chat(ws: WebSocket):
    await ws.accept()
    nickname = None
    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
            except Exception:
                continue

            if msg.get("tipo") == "autentica":
                nickname = msg.get("nickname")
                if nickname:
                    clienti.setdefault(nickname, set()).add(ws)
                    await ws.send_text(json.dumps({"tipo": "autenticato"}))
                continue

            if msg.get("tipo") == "messaggio":
                if not nickname:
                    await ws.send_text(json.dumps({"tipo": "errore", "messaggio": "Non autenticato"}))
                    continue

                conv = next((c for c in db["conversazioni"] if c["id"] == msg.get("conversazioneId")), None)
                if not conv or nickname not in conv["partecipanti"]:
                    await ws.send_text(json.dumps({"tipo": "errore", "messaggio": "Conversazione non trovata"}))
                    continue

                testo = str(msg.get("testo") or "").strip()
                if not testo:
                    continue

                nuovo_msg = {
                    "id": str(uuid.uuid4()),
                    "conversazioneId": msg["conversazioneId"],
                    "mittente": nickname,
                    "testo": testo,
                    "ora": datetime.now(timezone.utc).isoformat(),
                    "letto": False,
                }
                db["messaggi"].append(nuovo_msg)
                salva_dati()

                await _broadcast(conv["partecipanti"], json.dumps({"tipo": "messaggio", "messaggio": nuovo_msg}))

    except WebSocketDisconnect:
        pass
    finally:
        if nickname and nickname in clienti:
            clienti[nickname].discard(ws)
            if not clienti[nickname]:
                del clienti[nickname]
