import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BASE } from '../api';

//mostraElimina permette di distinguere se la scheda venga mostrata come risultato di una ricerca o "annuncio pubblicato" nella pagina principale
//nel secondo caso viene implementata la possibilità di eliminare l'annuncio
export default function CardAnnuncio({ annuncio, mostraElimina = false, onElimina }) {
  const [salvato, setSalvato] = useState(false);

  const immagineUrl = annuncio.immagini?.length > 0 //Se è presente l'immagine dell'annuncio mostrala, sennò placeholder
    ? `${BASE}${annuncio.immagini[0].url_immagine}`
    : 'https://placehold.co/600x400/1a1a1a/FFF?text=No+Foto';

  const dataPub = new Date(annuncio.data_pubblicazione).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  }); //Data di pubblicazione 

  return (
    <div className="card card-annuncio bg-black border-secondary h-100 text-white shadow overflow-hidden">

      <div className="position-relative">
        <Link to={`/annunci/${annuncio.idAnnuncio}`}>
          <img src={immagineUrl} className="card-img-top img-annuncio" alt={annuncio.nome} />
        </Link>

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
            onClick={() => setSalvato(!salvato)}
          >
            <i className={`bi ${salvato ? 'bi-floppy-fill' : 'bi-floppy'} text-danger fs-5`}></i>
          </button>
        )}
      </div>

      <div className="card-body d-flex flex-column p-3">
        <Link to={`/annunci/${annuncio.idAnnuncio}`} className="text-decoration-none">
          <h5 className="card-title font-monospace text-uppercase mb-1 fs-6 fw-bold text-white">
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