from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.annuncio import Annuncio
from fastapi.middleware.cors import CORSMiddleware

class AnnuncioResponse(BaseModel):
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


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione metterai l'URL esatto del tuo sito, "*" va bene per i test
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 1. Istanza di una console
annuncio_console = Annuncio(
    idAnnuncio=1,
    nome="Sega Mega Drive 16-bit + 1 Pad",
    prezzo=120.00,
    condizione="Ottima, testata e funzionante",
    marca="Sega",
    tipologia="Console",
    utente="sonic_fan_92",
    spedizione=True,
    prezzo_spedizione=9.90,
    presenza=True,
    posizione="Roma",
    descrizione="bella Sega"
)

# 2. Istanza di un videogioco
annuncio_gioco = Annuncio(
    idAnnuncio=2,
    nome="Pokémon Versione Rossa (Game Boy)",
    prezzo=55.50,
    condizione="Buona, batteria salvataggio da sostituire",
    marca="Nintendo",
    tipologia="Videogioco",
    utente="pallet_town_kid",
    spedizione=True,
    prezzo_spedizione=5.00,
    presenza=True,
    posizione="Milano",
    descrizione="Bel Gameboy"
)

# 3. Istanza di un accessorio (senza spedizione, solo ritiro a mano)
annuncio_accessorio = Annuncio(
    idAnnuncio=3,
    nome="Memory Card PS1 Originale",
    prezzo=15.00,
    condizione="Come nuova",
    marca="Sony",
    tipologia="Accessorio",
    utente="psx_collector",
    spedizione=False,
    prezzo_spedizione=0.0,
    presenza=True,
    posizione="Napoli",
    descrizione="Tennis"
)


diz_annunci = {annuncio_console.idAnnuncio : annuncio_console, annuncio_accessorio.idAnnuncio : annuncio_accessorio, annuncio_gioco.idAnnuncio : annuncio_gioco}

@app.get("/annunci/{idAnnuncio}", response_model=AnnuncioResponse)
def get_Annuncio(idAnnuncio : int):
    if idAnnuncio in diz_annunci:
        return diz_annunci[idAnnuncio]
    raise HTTPException(status_code=404, detail="Item not found")



