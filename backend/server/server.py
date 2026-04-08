import os
import shutil
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from typing import Annotated, List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

# Importazioni
from database import database 
from server import schemi

# 1. Configurazione Cartelle
BASE_DIR_IMMAGINI = "static/annunci"
BASE_DIR_UTENTI = "static/utenti" # Cartella per le foto profilo

os.makedirs(BASE_DIR_IMMAGINI, exist_ok=True)
os.makedirs(BASE_DIR_UTENTI, exist_ok=True)

# Crea le tabelle nel database SQLite se non esistono
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

    nuovo_utente = database.UtenteDB(**utente.model_dump())
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