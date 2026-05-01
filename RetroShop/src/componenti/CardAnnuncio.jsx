import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BASE } from '../api';

// Componente riutilizzabile per mostrare un annuncio come card.
// - mostraElimina: true nella pagina profilo, false ovunque altro
// - onTogglePreferito: se passato, gestisce i preferiti dall'esterno; altrimenti usiamo uno state locale
export default function CardAnnuncio({ annuncio, mostraElimina = false, onElimina, preferito = false, onTogglePreferito }) {
  const [salvato, setSalvato] = useState(false);

  // Se c'è un gestore esterno usiamo il suo stato, altrimenti quello locale
  const isSalvato = onTogglePreferito ? preferito : salvato;

  // Se l'annuncio ha immagini le mostriamo, altrimenti un placeholder
  const immagineUrl = annuncio.immagini?.length > 0
    ? `${BASE}${annuncio.immagini[0].url_immagine}`
    : 'https://placehold.co/600x400/1a1a1a/FFF?text=No+Foto';

  // Formattiamo la data in italiano (es. "23 apr 2025")
  const dataPub = new Date(annuncio.data_pubblicazione).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="card card-annuncio bg-black border-secondary h-100 text-white shadow overflow-hidden">

      <div className="position-relative">
        <Link to={`/annunci/${annuncio.idAnnuncio}`}>
          <img src={immagineUrl} className="card-img-top img-annuncio" alt={annuncio.nome} />
        </Link>

        {/* Bottone rosso in alto a destra: cestino se siamo nel profilo, cuore se siamo nella ricerca */}
        {mostraElimina ? (
          <button
            className="btn btn-elimina-card position-absolute top-0 end-0 m-2 rounded-circle border-secondary d-flex align-items-center justify-content-center p-0"
            style={{ width: 40, height: 40, zIndex: 10 }}
            onClick={() => onElimina?.(annuncio)}
          >
            <i className="bi bi-trash text-danger fs-5"></i>
          </button>
        ) : (
          <button
            className="btn btn-salva position-absolute top-0 end-0 m-2 rounded-circle border-secondary d-flex align-items-center justify-content-center p-0"
            style={{ width: 40, height: 40, zIndex: 10 }}
            onClick={() => onTogglePreferito ? onTogglePreferito(annuncio, !preferito) : setSalvato(!salvato)}
          >
            <i className={`bi ${isSalvato ? 'bi-floppy-fill' : 'bi-floppy'} text-danger fs-5`}></i>
          </button>
        )}
      </div>

      <div className="card-body d-flex flex-column p-3">
        <Link to={`/annunci/${annuncio.idAnnuncio}`} className="text-decoration-none">
          <h5 className="card-title font-monospace mb-1 fs-6 fw-bold text-white">
            {annuncio.nome}
          </h5>
        </Link>
        <p className="text-secondary small font-monospace mb-2">
          Condizioni: {annuncio.condizione.replace(/_/g, ' ')}
        </p>
        <h4 className="text-danger fw-bold font-monospace mb-3 mt-auto">
          € {annuncio.prezzo.toFixed(2)}
        </h4>
        <div className="d-flex justify-content-between align-items-center font-monospace small text-secondary">
          <span><i className="bi bi-geo-alt"></i> {annuncio.posizione}</span>
          <span>{dataPub}</span>
        </div>
      </div>

    </div>
  );
}
