from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Annuncio(BaseModel):
    idAnnuncio : int
    nome : str
    prezzo : float
    condizione : str
    piattaforma : str
    modello : str    
    tipologia : str
    utente : str
    spedizione : bool
    prezzo_spedizione : float
    presenza : bool
    posizione : str
    descrizione : str
    data_pubblicazione: Optional[datetime] = None