import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../componenti/Navbar';
import ModalLogin from '../componenti/Login';
import Footer from '../componenti/Footer';

// Dizionario che dà tutte le console "caricabili" in base al marchio scelto
const MODELLI_PER_PIATTAFORMA = {
  PlayStation:  ['PS1', 'PS2', 'PS3', 'PS4', 'PS5', 'PSP', 'PSVita'],
  Xbox:         ['XBOX originale', 'Xbox360', 'XBOX ONE', 'XBOX Series X|S'],
  Nintendo:     ['NES', 'SNES', 'Nintendo64', 'GameCube', 'WII', 'WIIu', 'Switch', 'Switch2', 'GameBoy', 'GameBoy Advance', 'DS', '3DS'],
  Sega:         ['Master System', 'Mega Drive', 'MegaCD', 'GameGear', 'Saturn', 'DreamCast'],
  Commodore:    ['VIC-20', 'Commodore 64', 'Commodore 128'],
  Atari:        ['Atari 2600', 'Atari 5200', 'Atari 7800', 'Atari Lynx', 'Atari Jaguar'],
  Altro:        ['Amiga', 'Arcade / Cabinati'],
};

const MAX_FOTO = 10;

export default function CreaAnnuncio() {
  const navigate = useNavigate();
  const { utente, loading } = useAuth();
  const [foto, setFoto] = useState([]); // [{ url, file }]
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState('');
  const [piattaforma, setPiattaforma] = useState('');

  useEffect(() => {
    if (!loading && !utente) navigate('/');
  }, [utente, loading, navigate]);

  function handleFoto(e) {
    const nuovi = Array.from(e.target.files);
    setFoto((prev) => {
      const disponibili = MAX_FOTO - prev.length;
      const aggiunte = nuovi.slice(0, disponibili).map((f) => ({ url: URL.createObjectURL(f), file: f }));
      return [...prev, ...aggiunte];
    });
    e.target.value = '';
  }

  function rimuoviFoto(i) {
    setFoto((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (foto.length === 0) { setErrore('Carica almeno una foto.'); return; }
    setCaricamento(true);
    setErrore('');

    const fd = new FormData(e.target);

    const datiAnnuncio = {
      nome:             fd.get('nome'),
      prezzo:           parseFloat(fd.get('prezzo')),
      condizione:       fd.get('condizione'),
      piattaforma:      fd.get('piattaforma'),
      modello:          fd.get('modello') || '',
      tipologia:        fd.get('tipologia'),
      utente:           utente.nickname,
      spedizione:       fd.get('spedizione') === 'on',
      prezzo_spedizione: 0,
      presenza:         true,
      posizione:        fd.get('posizione'),
      descrizione:      fd.get('descrizione'),
    };

    try {
      const risposta = await api.creaAnnuncio(datiAnnuncio);
      if (!risposta.ok) {
        const err = await risposta.json();
        const dettaglio = Array.isArray(err.detail)
          ? err.detail.map((e) => e.msg).join(', ')
          : (err.detail || 'Errore nella pubblicazione');
        throw new Error(dettaglio);
      }
      const annuncio = await risposta.json();

      if (foto.length > 0) {
        await api.uploadImmaginiAnnuncio(annuncio.idAnnuncio, foto.map((f) => f.file));
      }

      navigate(`/annunci/${annuncio.idAnnuncio}`);
    } catch (err) {
      setErrore(err.message);
      setCaricamento(false);
    }
  }

  if (loading) return null;

  return (
    <>
    <Navbar />
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
            {foto.length < MAX_FOTO && (
              <div
                className="upload-area border border-dark rounded-4 d-flex flex-column align-items-center justify-content-center position-relative"
                style={{ height: foto.length > 0 ? 180 : 450, backgroundColor: 'rgba(255,255,255,0.02)', transition: 'height 0.3s ease' }}
              >
                <div className="text-center p-4">
                  <i className="bi bi-images fs-1 text-secondary mb-3"></i>
                  <h4 className="text-uppercase fw-bold">
                    {foto.length > 0 ? 'Aggiungi altre foto' : 'Carica le foto'}
                  </h4>
                  <p className="text-secondary small">
                    {foto.length > 0
                      ? `${foto.length} / ${MAX_FOTO} foto caricate`
                      : 'Trascina qui i file o clicca per selezionarli'}
                  </p>
                </div>
                <input
                  type="file"
                  id="inputImmagini"
                  className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                  accept="image/*"
                  multiple
                  style={{ cursor: 'pointer' }}
                  onChange={handleFoto}
                />
              </div>
            )}

            {foto.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {foto.map((f, i) => (
                  <div key={i} className="position-relative border border-secondary rounded-2 overflow-hidden shadow-sm" style={{ width: 80, height: 80 }}>
                    <img src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Anteprima ${i + 1}`} />
                    <button
                      type="button"
                      onClick={() => rimuoviFoto(i)}
                      className="position-absolute top-0 end-0 btn btn-danger btn-sm p-0 d-flex align-items-center justify-content-center"
                      style={{ width: 20, height: 20, fontSize: 10, lineHeight: 1 }}
                      title="Rimuovi foto"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colonna dettagli */}
          <div className="col-lg-5">
            <div className="p-4 rounded-4 border border-secondary shadow-lg box_citta_descrizione">

              <div className="mb-4">
                <label className="small text-secondary text-uppercase mb-2">Prezzo Richiesto</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-transparent border-secondary text-white">€</span>
                  <input type="number" name="prezzo" className="form-control bg-transparent border-secondary text-white shadow-none" placeholder="0.00" step="0.01" required />
                </div>
              </div>

              <div className="mb-4">
                <label className="small text-secondary text-uppercase mb-2">Dettagli Articolo</label>
                <div className="d-flex flex-column gap-3">
                  <select name="condizione" className="form-select border-secondary shadow-none" required defaultValue="">
                    <option value="" disabled>Condizione...</option>
                    <option>Nuovo</option>
                    <option>Come Nuovo</option>
                    <option>Ottime</option>
                    <option>Buone</option>
                    <option>Pezzi di ricambio</option>
                  </select>
                  <select
                    name="piattaforma"
                    className="form-select border-secondary shadow-none"
                    required
                    defaultValue=""
                    onChange={(e) => { setPiattaforma(e.target.value); }}
                  >
                    <option value="" disabled>Piattaforma...</option>
                    {Object.keys(MODELLI_PER_PIATTAFORMA).map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  {piattaforma && (
                    <select name="modello" className="form-select border-secondary shadow-none" required defaultValue="">
                      <option value="" disabled>Modello...</option>
                      {MODELLI_PER_PIATTAFORMA[piattaforma].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  )}
                  <select name="tipologia" className="form-select border-secondary shadow-none" required defaultValue="">
                    <option value="" disabled>Tipologia...</option>
                    <option>Console</option>
                    <option>Gioco</option>
                    <option>Accessorio</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="small text-secondary text-uppercase mb-2">Luogo e Spedizione</label>
                <input type="text" name="posizione" className="form-control bg-transparent border-secondary text-white shadow-none mb-3" placeholder="Località (es. Milano)" required />
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

    </main>
    <ModalLogin />
    <Footer />
    </>
  );
}