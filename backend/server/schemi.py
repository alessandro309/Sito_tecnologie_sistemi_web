from pydantic import BaseModel
from typing import Optional, List

# --- SCHEMI UTENTE ---
class UtenteBase(BaseModel):
    nome: str
    cognome: str
    nickname: str
    nascita: str
    sesso: Optional[str] = None
    citta: Optional[str] = None
    provincia: Optional[str] = None
    mail: str

class UtenteCreate(UtenteBase):
    password: str 

class UtenteResponse(UtenteBase):
    class Config:
        from_attributes = True

# --- SCHEMI IMMAGINI ---
class ImmagineResponse(BaseModel):
    id: int
    url_immagine: str
    ordine: int

    class Config:
        from_attributes = True

# --- SCHEMI ANNUNCIO ---
class AnnuncioBase(BaseModel):
    nome: str
    prezzo: float
    condizione: str
    marca: str
    tipologia: str
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
    immagini: List[ImmagineResponse] = []

    class Config:
        from_attributes = True