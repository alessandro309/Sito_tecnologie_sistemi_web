from pydantic import BaseModel

class Annuncio(BaseModel):
    idAnnuncio : int
    nome : str
    prezzo : float
    condizione : str
    marca : str
    tipologia : str
    utente : str
    spedizione : bool
    prezzo_spedizione : float
    presenza : bool
    posizione : str
    descrizione : str


