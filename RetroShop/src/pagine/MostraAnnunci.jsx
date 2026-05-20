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
  const [searchParams, setSearchParams] = useSearchParams();
  const { utente } = useAuth();

  const [annunci, setAnnunci] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(false);
  const [ordinamento, setOrdinamento] = useState('');

  const pagina = Math.max(1, parseInt(searchParams.get('pagina') ?? '1', 10));

  // Query senza il param pagina: usata per il fetch e come dipendenza dell'effect
  // così cambiare pagina non scatena un nuovo fetch
  const qs = (() => { 
    const p = new URLSearchParams(searchParams); 
    p.delete('pagina'); 
    return p.toString(); 
  })();
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

  // Ri-esegue la ricerca solo quando cambia la query (non quando cambia pagina)
  useEffect(() => {
    setCaricamento(true);
    setErrore(false);

    api.ricercaAnnunci(qs)
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
  }, [qs]);

  const annunciOrdinati = ordinamento
    ? [...annunci].sort((a, b) => ordinamento === 'asc' ? a.prezzo - b.prezzo : b.prezzo - a.prezzo)
    : annunci;

  const totPagine = Math.ceil(annunciOrdinati.length / PER_PAGINA);
  const annunciPagina = annunciOrdinati.slice((pagina - 1) * PER_PAGINA, pagina * PER_PAGINA);

  function cambiaPagina(n) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (n === 1) next.delete('pagina');
      else next.set('pagina', String(n));
      return next;
    });
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
        <div className="mb-4 border-bottom border-secondary pb-2">
          {/* desktop */}
          <div className="d-none d-sm-flex justify-content-between align-items-center">
            <h2 className="font-monospace text-uppercase text-white fw-bold m-0">Risultati della ricerca</h2>
            <div className="d-flex align-items-center gap-3">
              <div className="input-group input-group-sm select-ordina rounded-3 overflow-hidden" style={{ width: 'auto' }}>
                <span className="input-group-text border-0 text-secondary select-ordina-addon">
                  <i className="bi bi-sort-down-alt"></i>
                </span>
                <select className="form-select form-select-sm border-0 text-white shadow-none font-monospace select-ordina-select" value={ordinamento} onChange={(e) => { setOrdinamento(e.target.value); setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('pagina'); return next; }); }}>
                  <option value="" style={{ background: '#2a2828', color: '#fff' }}>Ordine predefinito</option>
                  <option value="asc" style={{ background: '#2a2828', color: '#fff' }}>Prezzo ↑ crescente</option>
                  <option value="desc"style={{ background: '#2a2828', color: '#fff' }}>Prezzo ↓ decrescente</option>
                </select>
              </div>
              <span className="text-white font-monospace small text-nowrap opacity-75">
                {caricamento ? 'Ricerca in corso...' : totPagine > 1 ? `${annunci.length} annunci · pagina ${pagina} di ${totPagine}` : `Trovati ${annunci.length} annunci`}
              </span>
            </div>
          </div>
          {/* mobile */}
          <div className="d-sm-none">
            <h2 className="font-monospace text-uppercase text-white fw-bold m-0 mb-2">Risultati della ricerca</h2>
            <div className="input-group input-group-sm select-ordina rounded-3 overflow-hidden w-100">
              <span className="input-group-text border-0 text-secondary select-ordina-addon">
                <i className="bi bi-sort-down-alt"></i>
              </span>
              <select className="form-select form-select-sm border-0 text-white shadow-none font-monospace select-ordina-select" value={ordinamento} onChange={(e) => { setOrdinamento(e.target.value); setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('pagina'); return next; }); }}>
                <option value=""    style={{ background: '#2a2828', color: '#fff' }}>Ordine predefinito</option>
                <option value="asc" style={{ background: '#2a2828', color: '#fff' }}>Prezzo ↑ crescente</option>
                <option value="desc"style={{ background: '#2a2828', color: '#fff' }}>Prezzo ↓ decrescente</option>
              </select>
            </div>
            {!caricamento && (
              <div className="d-flex justify-content-between mt-2 px-2 text-white font-monospace small opacity-75">
                <span>{annunci.length} annunci</span>
                {totPagine > 1 && <span>pagina {pagina} di {totPagine}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="row g-4">
          {renderContenuto()}
        </div>

        {totPagine > 1 && !caricamento && !errore && (
          <nav className="mt-5 d-flex justify-content-center" aria-label="Paginazione risultati">
            <ul className="pagination font-monospace gap-1">
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
