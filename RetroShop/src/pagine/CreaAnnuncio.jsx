import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function CreaAnnuncio() {
  const navigate = useNavigate();
  const { utente, loading } = useAuth();
  const [anteprime, setAnteprime] = useState([]);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState('');

  // Reindirizza se non loggato
  useEffect(() => {
    if (!loading && !utente) navigate('/');
  }, [utente, loading, navigate]);

  function handleFoto(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    setAnteprime(files.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCaricamento(true);
    setErrore('');

    const fd = new FormData(e.target);

    const datiAnnuncio = {
      nome:        fd.get('nome'),
      prezzo:      parseFloat(fd.get('prezzo')),
      condizione:  fd.get('condizione'),
      piattaforma: fd.get('piattaforma'),
      modello:     fd.get('modello') || null,
      tipologia:   fd.get('tipologia'),
      spedizione:  fd.get('spedizione') === 'on',
      presenza:    true,
      posizione:   fd.get('posizione'),
      descrizione: fd.get('descrizione'),
    };

    try {
      const risposta = await api.creaAnnuncio(datiAnnuncio);
      if (!risposta.ok) {
        const err = await risposta.json();
        throw new Error(err.detail || 'Errore nella pubblicazione');
      }
      const annuncio = await risposta.json();

      // Carica le immagini
      const files = Array.from(fd.getAll('immagini')).filter((f) => f.size > 0);
      if (files.length > 0) {
        await api.uploadImmaginiAnnuncio(annuncio.idAnnuncio, files);
      }

      navigate(`/annunci/${annuncio.idAnnuncio}`);
    } catch (err) {
      setErrore(err.message);
      setCaricamento(false);
    }
  }

  if (loading) return null;

  return (
    <main className="container my-5 text-white font-monospace">
      <form id="formPubblicazione" onSubmit={handleSubmit}>

        <div className="mb-4">
          <input
            type="text"
            name="nome"
            className="form-control form-control-lg bg-transparent border-0 border-bottom border-secondary rounded-0 px-0 fw-bold text-uppercase"
            placeholder="TITOLO DELL'ANNUNCIO..."
            style={{ fontSize: '2rem' }}
            required
          />
        </div>

        <div className="row g-5">
          {/* Colonna foto */}
          <div className="col-lg-7">
            <div
              className="upload-area border border-dark rounded-4 d-flex flex-column align-items-center justify-content-center position-relative"
              style={{ height: 450, backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
              <div className="text-center p-4">
                <i className="bi bi-images fs-1 text-secondary mb-3"></i>
                <h4 className="text-uppercase fw-bold">Carica le foto</h4>
                <p className="text-secondary small">Trascina qui i file o clicca per selezionarli</p>
              </div>
              <input
                type="file"
                id="inputImmagini"
                name="immagini"
                className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                accept="image/*"
                multiple
                style={{ cursor: 'pointer' }}
                onChange={handleFoto}
                required
              />
            </div>

            <div className="d-flex gap-2 mt-3" style={{ minHeight: 80 }}>
              {anteprime.length > 0
                ? anteprime.map((src, i) => (
                    <div key={i} className="border border-secondary rounded-2 overflow-hidden shadow-sm" style={{ width: 80, height: 80 }}>
                      <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Anteprima ${i + 1}`} />
                    </div>
                  ))
                : [0, 1, 2].map((i) => (
                    <div key={i} className="border border-secondary rounded-2" style={{ width: 80, height: 80, borderStyle: 'dashed' }}></div>
                  ))}
            </div>
          </div>

          {/* Colonna dettagli */}
          <div className="col-lg-5">
            <div className="p-4 rounded-4 border border-secondary shadow-lg box_citta_descrizione">

              <div className="mb-4">
                <label className="small text-secondary text-uppercase mb-2">Prezzo Richiesto</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-transparent border-secondary text-white">€</span>
                  <input type="number" name="prezzo" className="form-control border-secondary" placeholder="0.00" step="0.01" required />
                </div>
              </div>

              <div className="mb-4">
                <label className="small text-secondary text-uppercase mb-2">Dettagli Articolo</label>
                <div className="d-flex flex-column gap-3">
                  <select name="condizione" className="form-select border-secondary" required defaultValue="">
                    <option value="" disabled>Condizione...</option>
                    <option>Nuovo</option>
                    <option>Come Nuovo</option>
                    <option>Ottime</option>
                    <option>Buone</option>
                    <option>Pezzi di ricambio</option>
                  </select>
                  <select name="piattaforma" className="form-select border-secondary" required defaultValue="">
                    <option value="" disabled>Piattaforma...</option>
                    <option>PlayStation</option>
                    <option>Nintendo</option>
                    <option>Xbox</option>
                    <option>Sega</option>
                  </select>
                  <input type="text" name="modello" className="form-control border-secondary" placeholder="Modello (es. PS2 Slim)" />
                  <select name="tipologia" className="form-select border-secondary" required defaultValue="">
                    <option value="" disabled>Tipologia...</option>
                    <option>Console</option>
                    <option>Gioco</option>
                    <option>Accessorio</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="small text-secondary text-uppercase mb-2">Luogo e Spedizione</label>
                <input type="text" name="posizione" className="form-control border-secondary mb-3" placeholder="Località (es. Milano)" required />
                <div className="form-check form-switch p-0 d-flex align-items-center justify-content-between">
                  <label className="form-check-label text-white" htmlFor="spedizioneSwitch">Disponibile a spedire</label>
                  <input className="form-check-input ms-0 mt-0" type="checkbox" role="switch" id="spedizioneSwitch" name="spedizione" />
                </div>
              </div>

              {errore && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>{errore}
                </div>
              )}

              <button type="submit" className="btn bottone_login w-100 py-3 text-uppercase fw-bold rounded-3 shadow mt-2" disabled={caricamento}>
                {caricamento
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Pubblicazione...</>
                  : 'Pubblica ora l\'annuncio'}
              </button>
            </div>
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-12">
            <h3 className="text-uppercase fw-bold border-bottom border-secondary pb-2 mb-4">Descrizione dell'articolo</h3>
            <textarea
              name="descrizione"
              className="box_citta_descrizione form-control border-secondary rounded-3"
              rows="8"
              placeholder="Inserisci qui tutti i dettagli dell'oggetto, graffi, funzionamento, accessori inclusi..."
              required
            ></textarea>
          </div>
        </div>

      </form>

      <style>{`
        .box_citta_descrizione { background-color: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
        .box_citta_descrizione:focus { background-color: rgba(0,0,0,0.5) !important; color: white !important; border-color: rgba(255,255,255,0.3) !important; box-shadow: 0 0 0 0.25rem rgba(255,255,255,0.1) !important; }
        .form-control, .form-select { color: white !important; }
        .form-control::placeholder { color: rgba(255,255,255,0.5) !important; }
        .form-check-input:checked { background-color: #dc3545; border-color: #dc3545; }
        body.tema-chiaro .form-check-input:checked { background-color: #0096D6 !important; border-color: #0096D6 !important; }
      `}</style>
    </main>
  );
}