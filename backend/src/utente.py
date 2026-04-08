from pydantic import BaseModel
from typing import Optional
from datetime import date

class Utente(BaseModel):
    nome: str
    cognome: str
    nickname: str
    nascita: date
    sesso: Optional[str] = None
    citta: Optional[str] = None
    provincia: Optional[str] = None
    mail: str
    password: str
    foto_profilo: Optional[str] = None