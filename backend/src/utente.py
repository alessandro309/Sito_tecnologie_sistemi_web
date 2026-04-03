from pydantic import BaseModel
from typing import Optional

class Utente(BaseModel):
    nome: str
    cognome: str
    nickname: str
    nascita: str
    sesso: Optional[str] = None
    citta: Optional[str] = None
    provincia: Optional[str] = None
    mail: str
    password: str

