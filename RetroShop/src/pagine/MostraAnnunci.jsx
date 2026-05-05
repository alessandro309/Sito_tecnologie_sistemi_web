import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../componenti/Navbar';
import BarraRicerca from '../componenti/BarraRicerca';
import CardAnnuncio from '../componenti/CardAnnuncio';
import ModalLogin from '../componenti/Login';
import ModalFiltri from '../componenti/Filtri';
import Footer from '../componenti/Footer';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

const PER_PAGINA = 16;

// Genera la sequenza di numeri/ellissi da mostrare nella paginazione
function pagineDaMostrare(pagina, totPagine) {
  if (totPagine <= 7) return Array.from({ length: totPagine }, (_, i) => i + 1);
  const set = new Set([1, 2, totPagine - 1, totPagine, pagina - 1, pagina, pagina + 1]
    .filter((n) => n >= 1 && n <= totPagine));
  const sorted = [...set].sort((a, b) => a - b);
  const result = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) result.push('...');
    result.push(n);
  });
  return result;
}

export default function MostraAnnunci() {
  const [searchParams] = useSearchParams();
  const { utente } = useAuth();

  const [annunci, setAnnunci] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(false);
  const [pagina, setPagina] = useState(1);
  // Teniamo la lista degli id dei preferiti per sapere quali card evidenziare
  const [preferitiIds, setPreferitiIds] = useState([]);

  // Carica i preferiti dell'utente quando si logga (o li svuota al logout)
  useEffect(() => {
    if (!utente) {
      setPreferitiIds([]);
      return;
    }
    api.getPreferiti()
      .then((r) => r.ok ? r.json() : [])
      .then((dati) => setPreferitiIds(dati.map((a) => a.idAnnuncio)))
      .catch(() => {});
  }, [utente]);

  // Aggiunge o rimuove un annuncio dai preferiti
  async function handleTogglePreferito(annuncio, nuovoStato) {
    // Se non loggato apriamo il modal di login
    if (!utente) {
      const el = document.getElementById('modalLogin');
      window.bootstrap?.Modal.getOrCreateInstance(el)?.show();
      return;
    }

    // Aggiornamento ottimistico: cambiamo l'icona subito senza aspettare il server
    if (nuovoStato) {
      setPreferitiIds((prev) => [...prev, annuncio.idAnnuncio]);
    } else {
      setPreferitiIds((prev) => prev.filter((id) => id !== annuncio.idAnnuncio));
    }

    try {
      const res = nuovoStato
        ? await api.aggiungiPreferito(annuncio.idAnnuncio)
        : await api.rimuoviPreferito(annuncio.idAnnuncio);
      if (!res.ok && res.status !== 204 && res.status !== 201) throw new Error();
    } catch {
      // Se la richiesta fallisce, ripristiniamo lo stato precedente
      if (nuovoStato) {
        setPreferitiIds((prev) => prev.filter((id) => id !== annuncio.idAnnuncio));
      } else {
        setPreferitiIds((prev) => [...prev, annuncio.idAnnuncio]);
      }
    }
  }

  // Ri-esegue la ricerca ogni volta che cambiano i parametri nell'URL
  useEffect(() => {
    setCaricamento(true);
    setErrore(false);
    setPagina(1);

    api.ricercaAnnunci(searchParams.toString())
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((dati) => {
        setAnnunci(dati);
        setCaricamento(false);
      })
      .catch(() => {
        setErrore(true);
        setCaricamento(false);
      });
  }, [searchParams]);

  const totPagine = Math.ceil(annunci.length / PER_PAGINA);
  const annunciPagina = annunci.slice((pagina - 1) * PER_PAGINA, pagina * PER_PAGINA);

  function cambiaPagina(n) {
    setPagina(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Gestisce i tre stati possibili: caricamento, errore, risultati
  function renderContenuto() {
    if (caricamento) {
      return (
        <div className="col-12 text-center text-white py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-2 font-monospace">Ricerca annunci...</p>
        </div>
      );
    }
    if (errore) {
      return <p className="text-danger text-center col-12">Errore di connessione al server.</p>;
    }
    if (annunci.length === 0) {
      return (
        <div className="col-12 text-center text-secondary py-5">
          <h4 className="font-monospace">Nessun risultato trovato</h4>
        </div>
      );
    }
    return annunciPagina.map((a, i) => (
      <div key={a.idAnnuncio} className="col-12 col-md-6 col-lg-4 col-xl-3 card_annuncio_col" style={{ animationDelay: `${i * 0.05}s` }}>
        <CardAnnuncio
          annuncio={a}
          preferito={preferitiIds.includes(a.idAnnuncio)}
          onTogglePreferito={handleTogglePreferito}
        />
      </div>
    ));
  }

  return (
    <>
      <Navbar>
        <BarraRicerca />
      </Navbar>

      <main className="container mb-5">
        <div className="d-flex justify-content-between align-items-end mb-4 border-bottom border-secondary pb-2">
          <h2 className="font-monospace text-uppercase text-white fw-bold m-0">Risultati della ricerca</h2>
          <span className="text-secondary font-monospace small">
            {caricamento
              ? 'Ricerca in corso...'
              : totPagine > 1
                ? `${annunci.length} annunci · pagina ${pagina} di ${totPagine}`
                : `Trovati ${annunci.length} annunci`}
          </span>
        </div>

        <div className="row g-4">
          {renderContenuto()}
        </div>

        {totPagine > 1 && !caricamento && !errore && (
          <nav className="mt-5 d-flex justify-content-center" aria-label="Paginazione risultati">
            <ul className="pagination font-monospace">
              <li className={`page-item ${pagina === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => cambiaPagina(pagina - 1)}>‹</button>
              </li>
              {pagineDaMostrare(pagina, totPagine).map((n, i) =>
                n === '...'
                  ? <li key={`e${i}`} className="page-item disabled"><span className="page-link">…</span></li>
                  : <li key={n} className={`page-item ${n === pagina ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => cambiaPagina(n)}>{n}</button>
                    </li>
              )}
              <li className={`page-item ${pagina === totPagine ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => cambiaPagina(pagina + 1)}>›</button>
              </li>
            </ul>
          </nav>
        )}
      </main>

      <Footer />
      <ModalLogin />
      <ModalFiltri />
    </>
  );
}
