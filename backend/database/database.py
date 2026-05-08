from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, Date, DateTime, func
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import uuid

# Sostituire "biar" con la password del proprio server PostgreSQL locale
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:biar@localhost:5432/retroshop_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Tabella degli utenti registrati — il nickname fa da chiave primaria invece dell'ID
class UtenteDB(Base):
    __tablename__ = "utenti"

    nickname = Column(String, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cognome = Column(String, nullable=False)
    nascita = Column(Date, nullable=False)
    sesso = Column(String, nullable=True)
    citta = Column(String, nullable=True)
    provincia = Column(String, nullable=True)
    mail = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    foto_profilo = Column(String, nullable=True)

    # Quando si cancella un utente, vengono eliminati automaticamente anche tutti i suoi annunci
    annunci = relationship("AnnuncioDB", foreign_keys="[AnnuncioDB.utente]", back_populates="proprietario", cascade="all, delete-orphan")


# Tabella degli annunci pubblicati dagli utenti
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
    portatile = Column(Boolean, nullable=True)
    spedizione = Column(Boolean, default=False)
    prezzo_spedizione = Column(Float, default=0.0)
    presenza = Column(Boolean, default=True)
    posizione = Column(String, nullable=False)
    descrizione = Column(String, nullable=False)
    data_pubblicazione = Column(DateTime, server_default=func.now())
    venduto = Column(Boolean, default=False, nullable=False)
    # Se l'acquirente cancella il suo account, questo campo diventa NULL invece di bloccare tutto
    acquirente = Column(String, ForeignKey("utenti.nickname", ondelete="SET NULL"), nullable=True)

    proprietario = relationship("UtenteDB", foreign_keys=[utente], back_populates="annunci")
    # Le immagini vengono restituite già ordinate e cancellate insieme all'annuncio
    immagini = relationship(
        "ImmagineAnnuncioDB",
        back_populates="annuncio",
        cascade="all, delete-orphan",
        order_by="ImmagineAnnuncioDB.ordine"
    )


# Tabella delle immagini collegate a un annuncio
class ImmagineAnnuncioDB(Base):
    __tablename__ = "immagini_annuncio"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    url_immagine = Column(String, nullable=False)
    # Serve a mantenere l'ordine con cui le immagini sono state caricate
    ordine = Column(Integer, default=0)
    annuncio_id = Column(Integer, ForeignKey("annunci.idAnnuncio"))

    annuncio = relationship("AnnuncioDB", back_populates="immagini")


# Tabella delle sessioni attive — ogni login crea una riga qui
class SessioneDB(Base):
    __tablename__ = "sessioni"

    # uuid4 garantisce unicità senza collisioni, sicuro da usare come token di sessione
    id_sessione = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    nickname_utente = Column(String, ForeignKey("utenti.nickname", ondelete="CASCADE"), nullable=False)
    data_scadenza = Column(DateTime, nullable=False)

    utente = relationship("UtenteDB")


# Tabella dei preferiti — coppia (utente, annuncio) come chiave primaria per evitare duplicati
class PreferitiDB(Base):
    __tablename__ = "preferiti"

    nickname_utente = Column(String, ForeignKey("utenti.nickname", ondelete="CASCADE"), primary_key=True)
    idAnnuncio = Column(Integer, ForeignKey("annunci.idAnnuncio", ondelete="CASCADE"), primary_key=True)
