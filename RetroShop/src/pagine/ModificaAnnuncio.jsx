import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, BASE } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../componenti/Navbar';
import ModalLogin from '../componenti/Login';
import Footer from '../componenti/Footer';

const MODELLI_PER_PIATTAFORMA = {
  PlayStation:  ['PS1', 'PS2', 'PS3', 'PS4', 'PS5', 'PSP', 'PSVita'],
  Xbox:         ['XBOX originale', 'Xbox360', 'XBOX ONE', 'XBOX Series X|S'],
  Nintendo:     ['NES', 'SNES', 'Nintendo64', 'GameCube', 'WII', 'WIIu', 'Switch', 'Switch2', 'GameBoy', 'GameBoy Advance', 'DS', '3DS'],
  Sega:         ['Master System', 'Mega Drive', 'MegaCD', 'GameGear', 'Saturn', 'DreamCast'],
  Commodore:    ['VIC-20', 'Commodore 64', 'Commodore 128'],
  Atari:        ['Atari 2600', 'Atari 5200', 'Atari 7800', 'Atari Lynx', 'Atari Jaguar'],
  Altro:        ['Amiga', 'Arcade / Cabinati'],
};

const CONSOLE_PORTATILI = new Set([
  'PSP', 'PSVita',
  'GameBoy', 'GameBoy Advance', 'DS', '3DS', 'Switch', 'Switch2',
  'GameGear',
  'Atari Lynx',
]);

const MAX_FOTO = 10;

export default function ModificaAnnuncio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { utente, loading: authLoading } = useAuth();

  const [loadingDati, setLoadingDati] = useState(true);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState('');
  const [presenza, setPresenza] = useState(true);

  // Foto esistenti e nuove
  const [immaginiEsistenti, setImmaginiEsistenti] = useState([]);
  const [immaginiDaRimuovere, setImmaginiDaRimuovere] = useState(new Set());
  const [nuoveFoto, setNuoveFoto] = useState([]);

  // Campi form
  const [nome, setNome] = useState('');
  const [prezzo, setPrezzo] = useState('');
  const [condizione, setCondizione] = useState('');
  const [piattaforma, setPiattaforma] = useState('');
  const [modello, setModello] = useState('');
  const [tipologiaBase, setTipologiaBase] = useState('');
  const [spedizione, setSpedizione] = useState(false);
  const [prezzoSpedizione, setPrezzoSpedizione] = useState('');
  const [posizione, setPosizione] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [propOwner, setPropOwner] = useState(null);

  const portatile = tipologiaBase === 'console' && modello
    ? CONSOLE_PORTATILI.has(modello)
    : null;

  const fotoEsistentiVisibili = immaginiEsistenti.filter(img => !immaginiDaRimuovere.has(img.id));
  const totaleFoto = fotoEsistentiVisibili.length + nuoveFoto.length;

  useEffect(() => {
    if (!authLoading && !utente) navigate('/');
  }, [utente, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && utente && propOwner && utente.nickname !== propOwner) {
      navigate(`/annunci/${id}`);
    }
  }, [utente, authLoading, propOwner, id, navigate]);

  useEffect(() => {
    api.annuncio(id)
      .then(r => r.json())
      .then(dati => {
        setPropOwner(dati.utente);
        setNome(dati.nome);
        setPrezzo(String(dati.prezzo));
        setCondizione(dati.condizione);
        setPiattaforma(dati.piattaforma);
        setModello(dati.modello);
        setTipologiaBase(dati.tipologia);
        setSpedizione(dati.spedizione);
        setPrezzoSpedizione(String(dati.prezzo_spedizione));
        setPosizione(dati.posizione);
        setDescrizione(dati.descrizione);
        setPresenza(dati.presenza);
        setImmaginiEsistenti(dati.immagini ?? []);
        setLoadingDati(false);
      })
      .catch(() => navigate('/'));
  }, [id]);

  function toggleRimozione(imgId) {
    setImmaginiDaRimuovere(prev => {
      const next = new Set(prev);
      if (next.has(imgId)) next.delete(imgId);
      else next.add(imgId);
      return next;
    });
  }

  function handleNuoveFoto(e) {
    const disponibili = MAX_FOTO - totaleFoto;
    if (disponibili <= 0) return;
    const aggiunte = Array.from(e.target.files)
      .slice(0, disponibili)
      .map(f => ({ url: URL.createObjectURL(f), file: f }));
    setNuoveFoto(prev => [...prev, ...aggiunte]);
    e.target.value = '';
  }

  function rimuoviNuovaFoto(i) {
    setNuoveFoto(prev => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (totaleFoto === 0) { setErrore("L'annuncio deve avere almeno una foto."); return; }
    if (!spedizione && !presenza) { setErrore('Seleziona almeno una modalità di consegna.'); return; }
    setCaricamento(true);
    setErrore('');

    const dati = {
      nome,
      prezzo: parseFloat(prezzo),
      condizione,
      piattaforma,
      modello,
      tipologia: tipologiaBase,
      portatile: tipologiaBase === 'console' ? portatile : null,
      spedizione,
      prezzo_spedizione: spedizione ? parseFloat(prezzoSpedizione || 0) : 0,
      presenza,
      posizione,
      descrizione,
    };

    try {
      const risposta = await api.modificaAnnuncio(id, dati);
      if (!risposta.ok) {
        const err = await risposta.json();
        throw new Error(err.detail || 'Errore nella modifica');
      }

      for (const imgId of immaginiDaRimuovere) {
        await api.eliminaImmagine(imgId);
      }

      if (nuoveFoto.length > 0) {
        await api.uploadImmaginiAnnuncio(parseInt(id), nuoveFoto.map(f => f.file));
      }

      navigate(`/annunci/${id}`);
    } catch (err) {
      setErrore(err.message);
      setCaricamento(false);
    }
  }

  if (authLoading || loadingDati) return null;

  return (
    <>
      <Navbar />
      <main className="container my-5 text-white font-monospace">
        <form onSubmit={handleSubmit}>

          <div className="mb-4">
            <input
              type="text"
              className="form-control form-control-lg bg-transparent border-0 border-bottom border-light rounded-0 px-0 fw-bold text-white shadow-none"
              placeholder="Titolo dell'annuncio..."
              style={{ fontSize: '2rem', caretColor: '#fff' }}
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>

          <div className="row g-5">
            {/* Colonna foto */}
            <div className="col-lg-7">

              {/* Foto esistenti */}
              {fotoEsistentiVisibili.length > 0 && (
                <div className="mb-3">
                  <p className="small text-secondary text-uppercase mb-2">Foto attuali — clicca × per rimuovere</p>
                  <div className="d-flex flex-wrap gap-2">
                    {immaginiEsistenti.map(img =>
                      !immaginiDaRimuovere.has(img.id) ? (
                        <div key={img.id} className="position-relative border border-secondary rounded-2 overflow-hidden shadow-sm" style={{ width: 80, height: 80 }}>
                          <img src={`${BASE}${img.url_immagine}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          <button
                            type="button"
                            onClick={() => toggleRimozione(img.id)}
                            className="position-absolute top-0 end-0 btn btn-danger btn-sm p-0 d-flex align-items-center justify-content-center"
                            style={{ width: 20, height: 20, fontSize: 10 }}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Upload nuove foto */}
              {totaleFoto < MAX_FOTO && (
                <div
                  className="upload-area border border-dark rounded-4 d-flex flex-column align-items-center justify-content-center position-relative"
                  style={{ height: totaleFoto > 0 ? 180 : 450, backgroundColor: 'rgba(255,255,255,0.02)', transition: 'height 0.3s ease' }}
                >
                  <div className="text-center p-4">
                    <i className="bi bi-images fs-1 text-secondary mb-3"></i>
                    <h4 className="text-uppercase fw-bold">
                      {totaleFoto > 0 ? 'Aggiungi altre foto' : 'Carica le foto'}
                    </h4>
                    <p className="text-secondary small">{totaleFoto} / {MAX_FOTO} foto</p>
                  </div>
                  <input
                    type="file"
                    className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                    accept="image/*"
                    multiple
                    style={{ cursor: 'pointer' }}
                    onChange={handleNuoveFoto}
                  />
                </div>
              )}

              {/* Nuove foto aggiunte */}
              {nuoveFoto.length > 0 && (
                <div className="mt-3">
                  <p className="small text-secondary text-uppercase mb-2">Nuove foto da aggiungere</p>
                  <div className="d-flex flex-wrap gap-2">
                    {nuoveFoto.map((f, i) => (
                      <div key={i} className="position-relative border border-info rounded-2 overflow-hidden shadow-sm" style={{ width: 80, height: 80 }}>
                        <img src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Nuova ${i + 1}`} />
                        <button
                          type="button"
                          onClick={() => rimuoviNuovaFoto(i)}
                          className="position-absolute top-0 end-0 btn btn-danger btn-sm p-0 d-flex align-items-center justify-content-center"
                          style={{ width: 20, height: 20, fontSize: 10 }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
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
                    <input
                      type="number"
                      className="form-control bg-transparent border-secondary text-white shadow-none"
                      placeholder="0.00"
                      step="0.01"
                      value={prezzo}
                      onChange={e => setPrezzo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="small text-secondary text-uppercase mb-2">Dettagli Articolo</label>
                  <div className="d-flex flex-column gap-3">
                    <select className="form-select border-secondary shadow-none" required value={condizione} onChange={e => setCondizione(e.target.value)}>
                      <option value="" disabled>Condizione...</option>
                      <option>Nuovo</option>
                      <option>Come Nuovo</option>
                      <option>Ottime</option>
                      <option>Buone</option>
                      <option>Pezzi di ricambio</option>
                    </select>
                    <select
                      className="form-select border-secondary shadow-none"
                      required
                      value={piattaforma}
                      onChange={e => { setPiattaforma(e.target.value); setModello(''); }}
                    >
                      <option value="" disabled>Piattaforma...</option>
                      {Object.keys(MODELLI_PER_PIATTAFORMA).map(p => <option key={p}>{p}</option>)}
                    </select>
                    {piattaforma && (
                      <select className="form-select border-secondary shadow-none" required value={modello} onChange={e => setModello(e.target.value)}>
                        <option value="" disabled>Modello...</option>
                        {MODELLI_PER_PIATTAFORMA[piattaforma].map(m => <option key={m}>{m}</option>)}
                      </select>
                    )}
                    <select className="form-select border-secondary shadow-none" required value={tipologiaBase} onChange={e => setTipologiaBase(e.target.value)}>
                      <option value="" disabled>Tipologia...</option>
                      <option value="console">Console</option>
                      <option value="giochi">Gioco</option>
                      <option value="accessori">Accessorio</option>
                    </select>
                    {tipologiaBase === 'console' && modello && (
                      <div className="d-flex align-items-center gap-2 small text-secondary">
                        <i className={`bi ${portatile ? 'bi-handbag' : 'bi-tv'}`}></i>
                        <span>{portatile ? 'Console portatile' : 'Console fissa'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="small text-secondary text-uppercase mb-2">Luogo e Consegna</label>
                  <input
                    type="text"
                    className="form-control bg-transparent border-secondary text-white shadow-none mb-3"
                    placeholder="Località (es. Milano)"
                    value={posizione}
                    onChange={e => setPosizione(e.target.value)}
                    required
                  />
                  <div className="form-check form-switch p-0 d-flex align-items-center justify-content-between mb-3">
                    <label className="form-check-label text-white">Consegna a mano</label>
                    <input
                      className="form-check-input ms-0 mt-0"
                      type="checkbox"
                      role="switch"
                      checked={presenza}
                      onChange={e => setPresenza(e.target.checked)}
                    />
                  </div>
                  <div className="form-check form-switch p-0 d-flex align-items-center justify-content-between mb-3">
                    <label className="form-check-label text-white">Disponibile a spedire</label>
                    <input
                      className="form-check-input ms-0 mt-0"
                      type="checkbox"
                      role="switch"
                      checked={spedizione}
                      onChange={e => setSpedizione(e.target.checked)}
                    />
                  </div>
                  <div className="input-group">
                    <span className={`input-group-text border-secondary ${spedizione ? 'text-white bg-transparent' : 'text-secondary'}`} style={{ transition: 'color 0.2s' }}>€</span>
                    <input
                      type="number"
                      className="form-control bg-transparent border-secondary shadow-none"
                      style={{ color: spedizione ? '#fff' : '#6c757d', transition: 'color 0.2s' }}
                      placeholder="Costo spedizione"
                      step="0.01"
                      min="0"
                      disabled={!spedizione}
                      value={spedizione ? prezzoSpedizione : ''}
                      onChange={e => setPrezzoSpedizione(e.target.value)}
                    />
                  </div>
                </div>

                {errore && (
                  <div className="alert alert-danger py-2 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>{errore}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn bottone_login w-100 py-3 text-uppercase fw-bold rounded-3 shadow mt-2"
                  disabled={caricamento}
                >
                  {caricamento
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvataggio...</>
                    : 'Salva modifiche'}
                </button>
              </div>
            </div>
          </div>

          <div className="row mt-5 mb-5">
            <div className="col-12">
              <h3 className="text-uppercase fw-bold border-bottom border-secondary pb-2 mb-4">Descrizione dell'articolo</h3>
              <textarea
                className="box_citta_descrizione form-control border-secondary rounded-3"
                rows="8"
                placeholder="Inserisci qui tutti i dettagli dell'oggetto..."
                value={descrizione}
                onChange={e => setDescrizione(e.target.value)}
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
