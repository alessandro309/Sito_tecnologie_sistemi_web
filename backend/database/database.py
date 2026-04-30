from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, Date, DateTime, func
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import uuid

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:biar@localhost:5432/retroshop_db"
# al posto di "biar" inserire la password del server sql sul vostro pc 

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
class UtenteDB(Base):
    __tablename__ = "utenti"

    nickname = Column(String, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cognome = Column(String, nullable=False)
    nascita = Column(Date, nullable=False) # Ora è un tipo Date
    sesso = Column(String, nullable=True)
    citta = Column(String, nullable=True)
    provincia = Column(String, nullable=True)
    mail = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False) 
    foto_profilo = Column(String, nullable=True) 

    annunci = relationship("AnnuncioDB", back_populates="proprietario")

class AnnuncioDB(Base):
    __tablename__ = "annunci"

    idAnnuncio = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String, nullable=False)
    prezzo = Column(Float, nullable=False)
    condizione = Column(String, nullable=False)
    piattaforma = Column(String, nullable=False)
    modello = Column(String, nullable=False)    
    tipologia = Column(String, nullable=False)
    utente = Column(String, ForeignKey("utenti.nickname"))
    spedizione = Column(Boolean, default=False)
    prezzo_spedizione = Column(Float, default=0.0)
    presenza = Column(Boolean, default=True)
    posizione = Column(String, nullable=False)
    descrizione = Column(String, nullable=False)
    data_pubblicazione = Column(DateTime, server_default=func.now())
    proprietario = relationship("UtenteDB", back_populates="annunci")
    immagini = relationship(
        "ImmagineAnnuncioDB", 
        back_populates="annuncio", 
        cascade="all, delete-orphan",
        order_by="ImmagineAnnuncioDB.ordine"
    )

class ImmagineAnnuncioDB(Base):
    __tablename__ = "immagini_annuncio"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    url_immagine = Column(String, nullable=False)
    ordine = Column(Integer, default=0)
    annuncio_id = Column(Integer, ForeignKey("annunci.idAnnuncio"))

    annuncio = relationship("AnnuncioDB", back_populates="immagini")

class SessioneDB(Base):
    __tablename__ = "sessioni"

    # Genera automaticamente un ID univoco casuale 
    id_sessione = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    nickname_utente = Column(String, ForeignKey("utenti.nickname", ondelete="CASCADE"), nullable=False)
    data_scadenza = Column(DateTime, nullable=False)

    # Relazione con l'utente
    utente = relationship("UtenteDB")

class PreferitiDB(Base):
    __tablename__ = "preferiti"

    nickname_utente = Column(String, ForeignKey("utenti.nickname", ondelete="CASCADE"), primary_key=True)
    idAnnuncio = Column(Integer, ForeignKey("annunci.idAnnuncio", ondelete="CASCADE"), primary_key=True)