import os
import re
import shutil
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request, Response
from fastapi.responses import FileResponse
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from sqlalchemy import or_
from fastapi import Query

from database import database
from server import schemi
from server import chat as chat_router

BASE_DIR_IMMAGINI = "static/annunci"
BASE_DIR_UTENTI = "static/utenti"

os.makedirs(BASE_DIR_IMMAGINI, exist_ok=True)
os.makedirs(BASE_DIR_UTENTI, exist_ok=True)

database.Base.metadata.create_all(bind=database.engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Trasforma la password in un hash sicuro
def ottieni_hash_password(password: str):
    return pwd_context.hash(password)


# Controlla se la password inserita corrisponde all'hash salvato
def verifica_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


# Si assicura che la password abbia almeno 8 caratteri, una maiuscola, un numero e un carattere speciale
def valida_password(password: str):
    errori = []
    if len(password) < 8:
        errori.append("almeno 8 caratteri")
    if not re.search(r'[A-Z]', password):
        errori.append("almeno una lettera maiuscola")
    if not re.search(r'[0-9]', password):
        errori.append("almeno un numero")
    if not re.search(r'[^A-Za-z0-9]', password):
        errori.append("almeno un carattere speciale")
    if errori:
        raise HTTPException(
            status_code=400,
            detail=f"Password non valida. Requisiti mancanti: {', '.join(errori)}."
        )


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(chat_router.router)


# Apre la connessione al database per ogni richiesta e la chiude quando ha finito
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Crea un nuovo account utente controllando che nickname e mail non siano già usati da qualcun altro
@app.post("/utenti/registrazione", response_model=schemi.UtenteResponse)
def registra_utente(utente: schemi.UtenteCreate, db: Session = Depends(get_db)):
    if db.query(database.UtenteDB).filter(database.UtenteDB.nickname == utente.nickname).first():
        raise HTTPException(status_code=400, detail="Nickname già in uso")
    if db.query(database.UtenteDB).filter(database.UtenteDB.mail == utente.mail).first():
        raise HTTPException(status_code=400, detail="Email già registrata")

    dati_utente = utente.model_dump()
    valida_password(dati_utente["password"])
    dati_utente["password"] = ottieni_hash_password(dati_utente["password"])

    nuovo_utente = database.UtenteDB(**dati_utente)
    db.add(nuovo_utente)
    db.commit()
    db.refresh(nuovo_utente)
    return nuovo_utente


# Carica la foto profilo dell'utente nella sua cartella e aggiorna il link nel database
@app.post("/utenti/{nickname}/foto", response_model=schemi.UtenteResponse)
def carica_foto_profilo(
        nickname: str,
        foto: UploadFile = File(...),
        db: Session = Depends(get_db)
    ):
    utente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == nickname).first()
    if not utente:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    cartella_utente = os.path.join(BASE_DIR_UTENTI, nickname)
    os.makedirs(cartella_utente, exist_ok=True)

    file_path = os.path.join(cartella_utente, foto.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(foto.file, buffer)

    utente.foto_profilo = f"/static/utenti/{nickname}/{foto.filename}"
    db.commit()
    db.refresh(utente)
    return utente


# Pubblica un nuovo annuncio e crea subito la cartella dove andranno le sue immagini
@app.post("/annunci/", response_model=schemi.AnnuncioResponse)
def crea_annuncio(annuncio: schemi.AnnuncioCreate, db: Session = Depends(get_db)):
    if not db.query(database.UtenteDB).filter(database.UtenteDB.nickname == annuncio.utente).first():
        raise HTTPException(status_code=404, detail="Utente non trovato.")

    nuovo_annuncio = database.AnnuncioDB(**annuncio.model_dump())
    db.add(nuovo_annuncio)
    db.commit()
    db.refresh(nuovo_annuncio)

    cartella_annuncio = os.path.join(BASE_DIR_IMMAGINI, str(nuovo_annuncio.idAnnuncio))
    os.makedirs(cartella_annuncio, exist_ok=True)
    return nuovo_annuncio


# Salva le immagini di un annuncio sul disco e le registra nel database mantenendo l'ordine di caricamento
@app.post("/annunci/{idAnnuncio}/immagini", response_model=schemi.AnnuncioResponse)
def carica_immagini_annuncio(
        idAnnuncio: int,
        immagini: List[UploadFile] = File(...),
        db: Session = Depends(get_db)
    ):
    annuncio = db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio == idAnnuncio).first()
    if not annuncio:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")

    cartella_annuncio = os.path.join(BASE_DIR_IMMAGINI, str(idAnnuncio))
    os.makedirs(cartella_annuncio, exist_ok=True)

    for index, immagine in enumerate(immagini):
        file_path = os.path.join(cartella_annuncio, immagine.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(immagine.file, buffer)

        db.add(database.ImmagineAnnuncioDB(
            url_immagine=f"/static/annunci/{idAnnuncio}/{immagine.filename}",
            ordine=index,
            annuncio_id=idAnnuncio
        ))

    db.commit()
    db.refresh(annuncio)
    return annuncio


# Restituisce tutti i dettagli di un annuncio dato il suo ID
@app.get("/annunci/{idAnnuncio}", response_model=schemi.AnnuncioResponse)
def get_annuncio(idAnnuncio: int, request: Request, db: Session = Depends(get_db)):
    accept = request.headers.get("accept", "")
    index_html = _FRONTEND_DIR / "index.html"
    # dato che l'endpoint e l'url per mostrare gli annunci sono gli stessi, facciamo delle distinzioni
    # Se un utente fa una richiesta annunci partendo da react il backend riceve una richiesta con campi Accept: "*/*"
    # Se un utente fa una ricerca direttamente da url, il browser fa una richiesta get con campi Accept: "text/html"
    if "text/html" in accept and index_html.exists(): # restituiamo la pagina html che verrà popolata                                      
        return FileResponse(index_html, headers={
            "Cache-Control": "no-store",
            "Vary": "Accept",
        })

    annuncio = db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio == idAnnuncio).first()
    if annuncio is None:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    return annuncio


# Restituisce il profilo pubblico di un utente dato il suo nickname
@app.get("/utenti/{nickname}", response_model=schemi.UtenteResponse)
def ottieni_utente(nickname: str, db: Session = Depends(get_db)):
    utente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == nickname).first()
    if not utente:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    return utente


# Controlla le credenziali, crea una sessione e imposta un cookie che dura 7 giorni
@app.post("/login")
def login(credenziali: schemi.LoginRequest, response: Response, db: Session = Depends(get_db)):
    utente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == credenziali.nickname).first()
    if not utente or not verifica_password(credenziali.password, utente.password):
        raise HTTPException(status_code=401, detail="Credenziali non valide")

    scadenza = datetime.now(timezone.utc) + timedelta(days=7)
    nuova_sessione = database.SessioneDB(
        nickname_utente=utente.nickname,
        data_scadenza=scadenza
    )
    db.add(nuova_sessione)
    db.commit()
    db.refresh(nuova_sessione)

    # httponly impedisce la lettura del cookie da JavaScript (protezione XSS)
    response.set_cookie(
        key="sessione_retroshop",
        value=nuova_sessione.id_sessione,
        httponly=True,
        samesite="lax",
        expires=scadenza
    )
    return {"message": "Login effettuato con successo", "utente": utente.nickname}


# Usata dagli endpoint protetti: legge il cookie, trova la sessione e restituisce chi è loggato
def ottieni_utente_loggato(request: Request, db: Session = Depends(get_db)):
    sessione_id = request.cookies.get("sessione_retroshop")
    if not sessione_id:
        raise HTTPException(status_code=401, detail="Non autenticato")

    sessione = db.query(database.SessioneDB).filter(database.SessioneDB.id_sessione == sessione_id).first()
    if not sessione or sessione.data_scadenza < datetime.now():
        raise HTTPException(status_code=401, detail="Sessione scaduta o non valida")
    return sessione.nickname_utente


# Aggiorna i dati personali dell'utente (solo l'utente stesso può farlo)
@app.patch("/utenti/{nickname}/dati", response_model=schemi.UtenteResponse)
def aggiorna_dati_utente(
        nickname: str,
        dati: schemi.AggiornaDatiUtente,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    if utente_corrente != nickname:
        raise HTTPException(status_code=403, detail="Non autorizzato")

    utente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == nickname).first()
    if not utente:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    if dati.nome is not None:
        utente.nome = dati.nome
    if dati.cognome is not None:
        utente.cognome = dati.cognome
    if dati.mail is not None:
        # Verifica che la nuova email non sia già usata da un altro utente
        esistente = db.query(database.UtenteDB).filter(
            database.UtenteDB.mail == dati.mail,
            database.UtenteDB.nickname != nickname
        ).first()
        if esistente:
            raise HTTPException(status_code=400, detail="Email già in uso da un altro account")
        utente.mail = dati.mail
    if dati.citta is not None:
        utente.citta = dati.citta

    db.commit()
    db.refresh(utente)
    return utente


# Cambia la password verificando prima quella vecchia (solo l'utente stesso può farlo)
@app.patch("/utenti/{nickname}/password", status_code=204)
def aggiorna_password(
        nickname: str,
        dati: schemi.AggiornaPassword,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    if utente_corrente != nickname:
        raise HTTPException(status_code=403, detail="Non autorizzato")

    utente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == nickname).first()
    if not utente:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    if not verifica_password(dati.password_attuale, utente.password):
        raise HTTPException(status_code=400, detail="Password attuale non corretta")

    valida_password(dati.nuova_password)
    utente.password = ottieni_hash_password(dati.nuova_password)
    db.commit()


# Modifica i dati di un annuncio (solo chi l'ha pubblicato può modificarlo)
@app.patch("/annunci/{idAnnuncio}", response_model=schemi.AnnuncioResponse)
def aggiorna_annuncio(
        idAnnuncio: int,
        dati: schemi.AggiornaAnnuncio,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    annuncio = db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio == idAnnuncio).first()
    if not annuncio:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    if annuncio.utente != utente_corrente:
        raise HTTPException(status_code=403, detail="Non sei autorizzato a modificare questo annuncio")

    for campo, valore in dati.model_dump().items():
        setattr(annuncio, campo, valore)

    db.commit()
    db.refresh(annuncio)
    return annuncio


# Cancella una foto dall'annuncio, sia dal disco che dal database (solo il proprietario dell'annuncio)
@app.delete("/immagini/{immagine_id}", status_code=204)
def elimina_immagine(
        immagine_id: int,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    immagine = db.query(database.ImmagineAnnuncioDB).filter(database.ImmagineAnnuncioDB.id == immagine_id).first()
    if not immagine:
        raise HTTPException(status_code=404, detail="Immagine non trovata")

    annuncio = db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio == immagine.annuncio_id).first()
    if not annuncio or annuncio.utente != utente_corrente:
        raise HTTPException(status_code=403, detail="Non sei autorizzato")

    file_path = immagine.url_immagine.lstrip('/')
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(immagine)
    db.commit()


# Acquista un annuncio: segna come venduto e registra chi ha comprato (non puoi comprare il tuo stesso annuncio)
@app.post("/annunci/{idAnnuncio}/acquista", status_code=204)
def acquista_annuncio(
        idAnnuncio: int,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    annuncio = db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio == idAnnuncio).first()
    if not annuncio:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    if annuncio.utente == utente_corrente:
        raise HTTPException(status_code=400, detail="Non puoi acquistare il tuo stesso annuncio")
    if annuncio.venduto:
        raise HTTPException(status_code=400, detail="Annuncio già venduto")

    annuncio.venduto = True
    annuncio.acquirente = utente_corrente
    db.commit()


# Annulla un acquisto ed elimina l'annuncio (solo chi ha comprato può farlo)
@app.post("/annunci/{idAnnuncio}/rimborso", status_code=204)
def rimborsa_annuncio(
        idAnnuncio: int,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    annuncio = db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio == idAnnuncio).first()
    # Se l'annuncio è stato eliminato, il rimborso viene gestito solo lato chat
    if not annuncio or not annuncio.venduto:
        return
    if annuncio.acquirente != utente_corrente:
        raise HTTPException(status_code=403, detail="Solo l'acquirente può richiedere il rimborso")

    cartella_annuncio = os.path.join(BASE_DIR_IMMAGINI, str(idAnnuncio))
    if os.path.exists(cartella_annuncio):
        shutil.rmtree(cartella_annuncio)

    db.delete(annuncio)
    db.commit()


# Cancella un annuncio e tutte le sue immagini dal disco (solo chi l'ha pubblicato può farlo)
@app.delete("/annunci/{idAnnuncio}", status_code=204)
def elimina_annuncio(
        idAnnuncio: int,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    annuncio = db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio == idAnnuncio).first()
    if not annuncio:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    if annuncio.utente != utente_corrente:
        raise HTTPException(status_code=403, detail="Non sei autorizzato a eliminare questo annuncio")

    cartella_annuncio = os.path.join(BASE_DIR_IMMAGINI, str(idAnnuncio))
    if os.path.exists(cartella_annuncio):
        shutil.rmtree(cartella_annuncio)

    db.delete(annuncio)
    db.commit()


# Restituisce tutti gli annunci che l'utente ha messo tra i preferiti
@app.get("/preferiti", response_model=List[schemi.AnnuncioResponse])
def get_preferiti(
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    preferiti = db.query(database.PreferitiDB).filter(database.PreferitiDB.nickname_utente == utente_corrente).all()
    if not preferiti:
        return []
    ids = [p.idAnnuncio for p in preferiti]
    return db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio.in_(ids)).all()


# Aggiunge un annuncio ai preferiti (se è già salvato non fa nulla)
@app.post("/preferiti/{idAnnuncio}", status_code=201)
def aggiungi_preferito(
        idAnnuncio: int,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    if not db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio == idAnnuncio).first():
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    esistente = db.query(database.PreferitiDB).filter(
        database.PreferitiDB.nickname_utente == utente_corrente,
        database.PreferitiDB.idAnnuncio == idAnnuncio
    ).first()
    if not esistente:
        db.add(database.PreferitiDB(nickname_utente=utente_corrente, idAnnuncio=idAnnuncio))
        db.commit()
    return {"message": "ok"}


# Toglie un annuncio dai preferiti dell'utente
@app.delete("/preferiti/{idAnnuncio}", status_code=204)
def rimuovi_preferito(
        idAnnuncio: int,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    preferito = db.query(database.PreferitiDB).filter(
        database.PreferitiDB.nickname_utente == utente_corrente,
        database.PreferitiDB.idAnnuncio == idAnnuncio
    ).first()
    if not preferito:
        raise HTTPException(status_code=404, detail="Preferito non trovato")
    db.delete(preferito)
    db.commit()


# Disconnette l'utente: cancella la sessione dal database e rimuove il cookie
@app.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    sessione_id = request.cookies.get("sessione_retroshop")
    if sessione_id:
        db.query(database.SessioneDB).filter(database.SessioneDB.id_sessione == sessione_id).delete()
        db.commit()
    response.delete_cookie("sessione_retroshop")
    return {"message": "Logout effettuato"}


# Dice al frontend se l'utente è ancora loggato e chi è
@app.get("/utente/me")
def controlla_sessione(utente_corrente: str = Depends(ottieni_utente_loggato)):
    return {"nickname": utente_corrente, "loggato": True}


# Cancella completamente l'account: profilo, foto, annunci e immagini (solo l'utente stesso può farlo)
@app.delete("/utenti/{nickname}", status_code=204)
def elimina_account(
        nickname: str,
        dati: schemi.EliminaAccount,
        request: Request,
        response: Response,
        utente_corrente: str = Depends(ottieni_utente_loggato),
        db: Session = Depends(get_db)
    ):
    if utente_corrente != nickname:
        raise HTTPException(status_code=403, detail="Non sei autorizzato a eliminare questo account")

    utente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == nickname).first()
    if not utente:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    if not verifica_password(dati.password, utente.password):
        raise HTTPException(status_code=400, detail="Password non corretta")

    cartella_utente = os.path.join(BASE_DIR_UTENTI, nickname)
    if os.path.exists(cartella_utente):
        shutil.rmtree(cartella_utente)

    for annuncio in utente.annunci:
        cartella_annuncio = os.path.join(BASE_DIR_IMMAGINI, str(annuncio.idAnnuncio))
        if os.path.exists(cartella_annuncio):
            shutil.rmtree(cartella_annuncio)

    # Le relazioni con CASCADE nel database eliminano automaticamente sessioni,
    # preferiti e annunci collegati all'utente
    db.delete(utente)
    db.commit()
    response.delete_cookie("sessione_retroshop")


# Cerca annunci applicando tutti i filtri passati (testo, categoria, prezzo, condizione, luogo, ecc.)
@app.get("/annunci/ricerca/", response_model=List[schemi.AnnuncioResponse])
def ricerca_annunci(
        ricerca: Optional[str] = None,
        tipologia: Optional[str] = None,
        marca: Optional[str] = None,
        condizioni: Optional[List[str]] = Query(None),
        prezzo_min: Optional[float] = None,
        prezzo_max: Optional[float] = None,
        spedizione: Optional[bool] = None,
        presenza: Optional[bool] = None,
        regione: Optional[str] = None,
        citta: Optional[str] = None,
        db: Session = Depends(get_db)
    ):
    query = db.query(database.AnnuncioDB)

    if ricerca:
        query = query.filter(
            or_(
                database.AnnuncioDB.nome.ilike(f"%{ricerca}%"),
                database.AnnuncioDB.descrizione.ilike(f"%{ricerca}%")
            )
        )

    if tipologia == 'console_fisse':
        query = query.filter(database.AnnuncioDB.tipologia == 'console',
                             database.AnnuncioDB.portatile == False)
    elif tipologia == 'console_portatili':
        query = query.filter(database.AnnuncioDB.tipologia == 'console',
                             database.AnnuncioDB.portatile == True)
    elif tipologia:
        query = query.filter(database.AnnuncioDB.tipologia == tipologia)

    if marca:
        query = query.filter(database.AnnuncioDB.piattaforma.ilike(f"%{marca}%"))

    if condizioni:
        query = query.filter(database.AnnuncioDB.condizione.in_(condizioni))

    if prezzo_min is not None:
        query = query.filter(database.AnnuncioDB.prezzo >= prezzo_min)
    if prezzo_max is not None:
        query = query.filter(database.AnnuncioDB.prezzo <= prezzo_max)

    if spedizione:
        query = query.filter(database.AnnuncioDB.spedizione == True)
    if presenza:
        query = query.filter(database.AnnuncioDB.presenza == True)

    if citta:
        query = query.filter(database.AnnuncioDB.posizione.ilike(f"%{citta}%"))
    elif regione:
        query = query.filter(database.AnnuncioDB.posizione.ilike(f"%{regione}%"))

    return query.order_by(database.AnnuncioDB.data_pubblicazione.desc()).all()


# Invio della pagina react
_FRONTEND_DIR = Path(__file__).parent.parent.parent / "RetroShop" / "dist"

if _FRONTEND_DIR.exists():
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file = _FRONTEND_DIR / full_path
        if file.exists() and file.is_file():
            return FileResponse(file)
        return FileResponse(_FRONTEND_DIR / "index.html")
