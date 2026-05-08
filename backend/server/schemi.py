from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class UtenteBase(BaseModel):
    nome: str
    cognome: str
    nickname: str
    nascita: date
    sesso: Optional[str] = None
    citta: Optional[str] = None
    provincia: Optional[str] = None
    mail: str
    foto_profilo: Optional[str] = None


class UtenteCreate(UtenteBase):
    password: str


class UtenteResponse(UtenteBase):
    class Config:
        from_attributes = True


class ImmagineResponse(BaseModel):
    id: int
    url_immagine: str
    ordine: int

    class Config:
        from_attributes = True


class AnnuncioBase(BaseModel):
    nome: str
    prezzo: float
    condizione: str
    piattaforma: str
    modello: str
    tipologia: str
    portatile: Optional[bool] = None
    utente: str
    spedizione: bool
    prezzo_spedizione: float
    presenza: bool
    posizione: str
    descrizione: str


class AnnuncioCreate(AnnuncioBase):
    pass


class AnnuncioResponse(AnnuncioBase):
    idAnnuncio: int
    data_pubblicazione: datetime
    venduto: bool = False
    acquirente: Optional[str] = None
    immagini: List[ImmagineResponse] = []

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    nickname: str
    password: str


class AggiornaDatiUtente(BaseModel):
    nome: Optional[str] = None
    cognome: Optional[str] = None
    mail: Optional[str] = None
    citta: Optional[str] = None


class AggiornaPassword(BaseModel):
    password_attuale: str
    nuova_password: str


class EliminaAccount(BaseModel):
    password: str


class AggiornaAnnuncio(BaseModel):
    nome: str
    prezzo: float
    condizione: str
    piattaforma: str
    modello: str
    tipologia: str
    portatile: Optional[bool] = None
    spedizione: bool
    prezzo_spedizione: float
    presenza: bool
    posizione: str
    descrizione: str
