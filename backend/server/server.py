import os
import shutil
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request, Response
from typing import Annotated, List, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from sqlalchemy import or_
from fastapi import Query


from database import database 
from server import schemi

# 1. Configurazione Cartelle
BASE_DIR_IMMAGINI = "static/annunci" # cartella per le foto annunci
BASE_DIR_UTENTI = "static/utenti" # Cartella per le foto profilo

os.makedirs(BASE_DIR_IMMAGINI, exist_ok=True)
os.makedirs(BASE_DIR_UTENTI, exist_ok=True)

# Crea le tabelle nel database PostgreSQL se non esistono
database.Base.metadata.create_all(bind=database.engine)


#Funzioni che servono per "hashare" e "dehashare" la password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def ottieni_hash_password(password: str):
    return pwd_context.hash(password)

def verifica_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)
#fine funzioni sicurezza

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500", 
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Montiamo la cartella in modo che sia accessibile dal web
app.mount("/static", StaticFiles(directory="static"), name="static")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINT: REGISTRAZIONE UTENTE (Dati Testuali) ---
@app.post("/utenti/registrazione", response_model=schemi.UtenteResponse)
def registra_utente(utente: schemi.UtenteCreate, db: Session = Depends(get_db)):
    db_user_nick = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == utente.nickname).first()
    if db_user_nick:
        raise HTTPException(status_code=400, detail="Nickname già in uso")
    
    db_user_mail = db.query(database.UtenteDB).filter(database.UtenteDB.mail == utente.mail).first()
    if db_user_mail:
        raise HTTPException(status_code=400, detail="Email già registrata")

    #criptiamo la password
    dati_utente = utente.model_dump()
    dati_utente["password"] = ottieni_hash_password(dati_utente["password"])


    nuovo_utente = database.UtenteDB(**dati_utente)
    db.add(nuovo_utente)
    db.commit()
    db.refresh(nuovo_utente)
    return nuovo_utente

# --- ENDPOINT: CARICAMENTO FOTO PROFILO UTENTE ---
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

    percorso_web = f"/static/utenti/{nickname}/{foto.filename}"
    utente.foto_profilo = percorso_web
    
    db.commit()
    db.refresh(utente)
    
    return utente

# --- ENDPOINT: CREAZIONE ANNUNCIO ---
@app.post("/annunci/", response_model=schemi.AnnuncioResponse)
def crea_annuncio(annuncio: schemi.AnnuncioCreate, db: Session = Depends(get_db)):
    utente_esistente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == annuncio.utente).first()
    if not utente_esistente:
        raise HTTPException(status_code=404, detail="Utente non trovato.")

    nuovo_annuncio = database.AnnuncioDB(**annuncio.model_dump())
    db.add(nuovo_annuncio)
    db.commit()
    db.refresh(nuovo_annuncio)

    cartella_annuncio = os.path.join(BASE_DIR_IMMAGINI, str(nuovo_annuncio.idAnnuncio))
    os.makedirs(cartella_annuncio, exist_ok=True)

    return nuovo_annuncio

# --- ENDPOINT: CARICAMENTO IMMAGINI ANNUNCIO ---
@app.post("/annunci/{idAnnuncio}/immagini", response_model=schemi.AnnuncioResponse)
def carica_immagini_annuncio(
    idAnnuncio: int, 
    immagini: Annotated[List[UploadFile], File(...)],
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

        percorso_web = f"/static/annunci/{idAnnuncio}/{immagine.filename}"

        nuova_immagine_db = database.ImmagineAnnuncioDB(
            url_immagine=percorso_web,
            ordine=index,
            annuncio_id=idAnnuncio
        )
        db.add(nuova_immagine_db)

    db.commit()
    db.refresh(annuncio)
    
    return annuncio

# --- ENDPOINT: LETTURA ANNUNCIO ---
@app.get("/annunci/{idAnnuncio}", response_model=schemi.AnnuncioResponse)
def get_annuncio(idAnnuncio: int, db: Session = Depends(get_db)):
    annuncio = db.query(database.AnnuncioDB).filter(database.AnnuncioDB.idAnnuncio == idAnnuncio).first()
    if annuncio is None:
        raise HTTPException(status_code=404, detail="Annuncio non trovato")
    return annuncio


@app.get("/utenti/{nickname}", response_model=schemi.UtenteResponse)
def ottieni_utente(nickname: str, db: Session = Depends(get_db)):
    #Ricerca con nickname come chiave
    utente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == nickname).first()
    
    if not utente:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    return utente


@app.post("/login")
def login(credenziali: schemi.LoginRequest, response: Response, db: Session = Depends(get_db)):
    # 1. Cerca l'utente
    utente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == credenziali.nickname).first()
    
    # NB: Qui dovresti verificare l'hash della password, per ora simuliamo un check base
    if not utente or not verifica_password(credenziali.password, utente.password):
        raise HTTPException(status_code=401, detail="Credenziali non valide")

    # 2. Crea la sessione (valida ad es. per 7 giorni)
    scadenza = datetime.now(timezone.utc) + timedelta(days=7)
    nuova_sessione = database.SessioneDB(
        nickname_utente=utente.nickname,
        data_scadenza=scadenza
    )
    db.add(nuova_sessione)
    db.commit()
    db.refresh(nuova_sessione)

    # 3. Imposta il Cookie sicuro nel browser
    response.set_cookie(
        key="sessione_retroshop",
        value=nuova_sessione.id_sessione,
        httponly=True,  # Impedisce ad altri JS di leggere il cookie (sicurezza)
        samesite="lax",
        expires=scadenza
    )
    
    return {"message": "Login effettuato con successo", "utente": utente.nickname}


def ottieni_utente_loggato(request: Request, db: Session = Depends(get_db)):
    sessione_id = request.cookies.get("sessione_retroshop")
    
    if not sessione_id:
        raise HTTPException(status_code=401, detail="Non autenticato")

    sessione = db.query(database.SessioneDB).filter(database.SessioneDB.id_sessione == sessione_id).first()
    
    if not sessione or sessione.data_scadenza < datetime.now():
        raise HTTPException(status_code=401, detail="Sessione scaduta o non valida")
        
    return sessione.nickname_utente


# --- ENDPOINT: MODIFICA DATI PERSONALI UTENTE ---
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

    # Aggiorniamo solo i campi forniti (quelli non None)
    if dati.nome is not None:
        utente.nome = dati.nome
    if dati.cognome is not None:
        utente.cognome = dati.cognome
    if dati.mail is not None:
        # Verifichiamo che la nuova email non sia già usata da un altro utente
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


# --- ENDPOINT: MODIFICA PASSWORD UTENTE ---
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

    utente.password = ottieni_hash_password(dati.nuova_password)
    db.commit()

# --- ENDPOINT: ELIMINAZIONE ANNUNCIO ---
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

# --- ENDPOINT: PREFERITI ---
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

@app.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    sessione_id = request.cookies.get("sessione_retroshop")
    
    if sessione_id:
        # Elimina la sessione dal database
        db.query(database.SessioneDB).filter(database.SessioneDB.id_sessione == sessione_id).delete()
        db.commit()
        
    # Cancella il cookie dal browser
    response.delete_cookie("sessione_retroshop")
    return {"message": "Logout effettuato"}


@app.get("/utente/me")
def controlla_sessione(utente_corrente: str = Depends(ottieni_utente_loggato)):
    return {"nickname": utente_corrente, "loggato": True}


# --- ENDPOINT: ELIMINAZIONE ACCOUNT UTENTE ---
@app.delete("/utenti/{nickname}", status_code=204)
def elimina_account(
    nickname: str,
    request: Request,
    response: Response,
    utente_corrente: str = Depends(ottieni_utente_loggato),
    db: Session = Depends(get_db)
):
    # Verifica che l'utente stia eliminando solo il proprio account
    if utente_corrente != nickname:
        raise HTTPException(status_code=403, detail="Non sei autorizzato a eliminare questo account")

    utente = db.query(database.UtenteDB).filter(database.UtenteDB.nickname == nickname).first()
    if not utente:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    # Elimina la cartella con la foto profilo dal filesystem, se presente
    cartella_utente = os.path.join(BASE_DIR_UTENTI, nickname)
    if os.path.exists(cartella_utente):
        shutil.rmtree(cartella_utente)

    # Elimina le cartelle delle immagini di tutti gli annunci dell'utente
    for annuncio in utente.annunci:
        cartella_annuncio = os.path.join(BASE_DIR_IMMAGINI, str(annuncio.idAnnuncio))
        if os.path.exists(cartella_annuncio):
            shutil.rmtree(cartella_annuncio)

    # Elimina l'utente dal database.
    # Grazie alle relazioni con ondelete="CASCADE" nel database, vengono eliminati
    # automaticamente anche: sessioni, preferiti e annunci collegati.
    db.delete(utente)
    db.commit()

    # Cancella il cookie di sessione dal browser
    response.delete_cookie("sessione_retroshop")


@app.get("/annunci/ricerca/", response_model=List[schemi.AnnuncioResponse])
def ricerca_annunci(
    ricerca: Optional[str] = None,
    tipologia: Optional[str] = None,
    marca: Optional[str] = None,
    condizioni: Optional[List[str]] = Query(None),
    prezzo_min: Optional[float] = None,
    prezzo_max: Optional[float] = None,
    spedizione: Optional[bool] = None,
    scambio: Optional[bool] = None,
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

    if condizioni and len(condizioni) > 0:
        query = query.filter(database.AnnuncioDB.condizione.in_(condizioni))

    if prezzo_min is not None:
        query = query.filter(database.AnnuncioDB.prezzo >= prezzo_min)
    if prezzo_max is not None:
        query = query.filter(database.AnnuncioDB.prezzo <= prezzo_max)

    if spedizione:
        query = query.filter(database.AnnuncioDB.spedizione == True)

    if scambio:
        query = query.filter(database.AnnuncioDB.presenza == True)

    if citta:
        query = query.filter(database.AnnuncioDB.posizione.ilike(f"%{citta}%"))
    elif regione:
        query = query.filter(database.AnnuncioDB.posizione.ilike(f"%{regione}%"))

    annunci_filtrati = query.order_by(database.AnnuncioDB.data_pubblicazione.desc()).all()
    return annunci_filtrati