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

export default function MostraAnnunci() {
  const [searchParams] = useSearchParams();
  const { utente } = useAuth();
  const [annunci, setAnnunci] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(false);
  const [preferitiIds, setPreferitiIds] = useState(new Set());

  useEffect(() => {
    if (!utente) { setPreferitiIds(new Set()); return; }
    api.getPreferiti()
      .then((r) => r.ok ? r.json() : [])
      .then((dati) => setPreferitiIds(new Set(dati.map((a) => a.idAnnuncio))))
      .catch(() => {});
  }, [utente]);

  async function handleTogglePreferito(annuncio, nuovoStato) {
    if (!utente) {
      const el = document.getElementById('modalLogin');
      window.bootstrap?.Modal.getOrCreateInstance(el)?.show();
      return;
    }

    // Aggiornamento ottimistico: cambia l'icona subito
    if (nuovoStato) {
      setPreferitiIds((prev) => new Set([...prev, annuncio.idAnnuncio]));
    } else {
      setPreferitiIds((prev) => { const n = new Set(prev); n.delete(annuncio.idAnnuncio); return n; });
    }

    try {
      const res = nuovoStato
        ? await api.aggiungiPreferito(annuncio.idAnnuncio)
        : await api.rimuoviPreferito(annuncio.idAnnuncio);
      if (!res.ok && res.status !== 204 && res.status !== 201) throw new Error();
    } catch {
      // Ripristina lo stato precedente se la chiamata fallisce
      if (nuovoStato) {
        setPreferitiIds((prev) => { const n = new Set(prev); n.delete(annuncio.idAnnuncio); return n; });
      } else {
        setPreferitiIds((prev) => new Set([...prev, annuncio.idAnnuncio]));
      }
    }
  }

  useEffect(() => {
    setCaricamento(true);
    setErrore(false);

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
  }, [searchParams]); // Ri-esegue ogni volta che i parametri URL cambiano (nuova ricerca o filtri)

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
    return annunci.map((a) => (
      <div key={a.idAnnuncio} className="col-12 col-md-6 col-lg-4 col-xl-3">
        <CardAnnuncio
          annuncio={a}
          preferito={preferitiIds.has(a.idAnnuncio)}
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
          <h2 className="font-monospace text-uppercase fw-bold m-0">Risultati della ricerca</h2>
          <span className="text-secondary font-monospace small">
            {caricamento ? 'Ricerca in corso...' : `Trovati ${annunci.length} annunci`}
          </span>
        </div>

        <div className="row g-4">
          {renderContenuto()}
        </div>
      </main>

      <Footer />
      <ModalLogin />
      <ModalFiltri />
    </>
  );
}