import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── Dati statici ───────────────────────────────────────────────────────────────

const CONDIZIONI = [
  { id: 'condizNuovo',         valore: 'nuovo',             label: 'Nuovo' },
  { id: 'condizComeNuovo',     valore: 'come_nuovo',        label: 'Come Nuovo' },
  { id: 'condizBuono',         valore: 'buone',             label: 'Buone' },
  { id: 'condizDiscrete',      valore: 'discrete',          label: 'Discrete' },
  { id: 'condizPezziRicambio', valore: 'pezzi_di_ricambio', label: 'Pezzi di ricambio' },
];

const REGIONI = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto',
];

const CITTA = [
  'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna',
  'Firenze', 'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova',
  'Trieste', 'Brescia', 'Parma', 'Taranto', 'Prato', 'Modena', 'Rovigo',
  'Rimini', 'Reggio Emilia', 'Perugia', 'Livorno', 'Ravenna', 'Cagliari',
];

// ── Input con autocomplete ─────────────────────────────────────────────────────

function InputAutocompletamento({ id, placeholder, database, value, onChange }) {
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [aperto, setAperto] = useState(false);
  const containerRef = useRef(null);

  function handleInput(e) {
    const testo = e.target.value;
    onChange(testo);
    if (!testo) { setSuggerimenti([]); setAperto(false); return; }
    const trovati = database.filter((el) =>
      el.toLowerCase().startsWith(testo.toLowerCase())
    );
    setSuggerimenti(trovati);
    setAperto(trovati.length > 0);
  }

  function seleziona(voce) {
    onChange(voce);
    setSuggerimenti([]);
    setAperto(false);
  }

  useEffect(() => {
    function handleClickFuori(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAperto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFuori);
    return () => document.removeEventListener('mousedown', handleClickFuori);
  }, []);

  return (
    <div className="position-relative mt-2" ref={containerRef}>
      <input
        id={id}
        type="text"
        className="form-control bg-transparent text-white border-secondary shadow-none"
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={handleInput}
      />
      {aperto && (
        <ul
          className="list-group position-absolute w-100 mt-1 shadow-lg"
          style={{ zIndex: 1050, maxHeight: 150, overflowY: 'auto' }}
        >
          {suggerimenti.map((voce) => (
            <li
              key={voce}
              className="list-group-item list-group-item-action bg-black text-white border-secondary"
              style={{ cursor: 'pointer' }}
              onMouseDown={() => seleziona(voce)}
            >
              {voce}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Componente principale ──────────────────────────────────────────────────────

export default function ModalFiltri() {
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef(null);

  const [tipologia,    setTipologia]    = useState('');
  const [marca,        setMarca]        = useState('');
  const [zonaModalita, setZonaModalita] = useState('italia'); // 'italia' | 'regione' | 'citta'
  const [regione,      setRegione]      = useState('');
  const [citta,        setCitta]        = useState('');
  const [condizioni,   setCondizioni]   = useState([]);
  const [prezzoMin,    setPrezzoMin]    = useState('');
  const [prezzoMax,    setPrezzoMax]    = useState('');
  const [spedizione,   setSpedizione]   = useState(false);
  const [scambioMano,  setScambioMano]  = useState(false);

  // Conta i filtri attivi per aggiornare il badge nella barra di ricerca
  const contaFiltri =
    (tipologia ? 1 : 0) +
    (marca ? 1 : 0) +
    (zonaModalita !== 'italia' && (regione || citta) ? 1 : 0) +
    condizioni.length +
    (prezzoMin !== '' ? 1 : 0) +
    (prezzoMax !== '' ? 1 : 0) +
    (spedizione ? 1 : 0) +
    (scambioMano ? 1 : 0);

  useEffect(() => {
    const badge = document.getElementById('badgeFiltri');
    if (!badge) return;
    if (contaFiltri > 0) {
      badge.textContent = contaFiltri;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  }, [contaFiltri]);

  function toggleCondizione(valore) {
    setCondizioni((prev) =>
      prev.includes(valore) ? prev.filter((c) => c !== valore) : [...prev, valore]
    );
  }

  function azzera() {
    setTipologia('');
    setMarca('');
    setZonaModalita('italia');
    setRegione('');
    setCitta('');
    setCondizioni([]);
    setPrezzoMin('');
    setPrezzoMax('');
    setSpedizione(false);
    setScambioMano(false);
  }

  function handleApplica(e) {
    e.preventDefault();

    // Manteniamo i parametri di ricerca testuale già presenti nell'URL (ricerca, luogo)
    const params = new URLSearchParams(window.location.search);

    // Puliamo i filtri precedenti prima di aggiungere quelli nuovi
    ['tipologia', 'marca', 'regione', 'citta', 'condizioni',
     'prezzo_min', 'prezzo_max', 'spedizione', 'scambio'].forEach((k) => params.delete(k));

    if (tipologia)                             params.set('tipologia',  tipologia);
    if (marca)                                 params.set('marca',      marca);
    if (zonaModalita === 'regione' && regione) params.set('regione',    regione);
    if (zonaModalita === 'citta'   && citta)   params.set('citta',      citta);
    condizioni.forEach((c)                  => params.append('condizioni', c));
    if (prezzoMin !== '')                      params.set('prezzo_min', prezzoMin);
    if (prezzoMax !== '')                      params.set('prezzo_max', prezzoMax);
    if (spedizione)                            params.set('spedizione', 'true');
    if (scambioMano)                           params.set('scambio',    'true');

    // Chiude il modal Bootstrap
    const el = document.getElementById('modalFiltri');
    window.bootstrap?.Modal.getInstance(el)?.hide();

    if (location.pathname === '/annunci') {
      navigate(`/annunci?${params}`, { replace: true });
    } else {
      navigate(`/annunci?${params}`);
    }
  }

  return (
    <div
      className="modal fade"
      id="modalFiltri"
      tabIndex="-1"
      aria-labelledby="modalFiltriLabel"
      aria-hidden="true"
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-black border border-secondary rounded-1 shadow-lg font-monospace text-white">

          {/* Header */}
          <div className="modal-header border-bottom border-secondary mb-4">
            <h5 className="modal-title text-uppercase fw-bold ps-2" id="modalFiltriLabel">
              Filtri di Ricerca
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>

          {/* Body */}
          <div className="modal-body px-4 px-md-5 pb-5 pt-0">
            <form id="formFiltri" className="d-flex flex-column h-100" onSubmit={handleApplica}>

              {/* TIPOLOGIA */}
              <div className="mb-4">
                <label htmlFor="filtroTipologia" className="form-label small text-secondary mb-1">
                  TIPOLOGIA
                </label>
                <select
                  id="filtroTipologia"
                  className="form-select bg-black text-white border-secondary shadow-none"
                  value={tipologia}
                  onChange={(e) => setTipologia(e.target.value)}
                >
                  <option value="">Tutte le categorie</option>
                  <option value="console_fisse">Console Fisse</option>
                  <option value="console_portatili">Console Portatili</option>
                  <option value="giochi">Giochi</option>
                  <option value="accessori">Accessori</option>
                </select>
              </div>

              {/* MARCA */}
              <div className="mb-4">
                <label htmlFor="filtroMarca" className="form-label small text-secondary mb-1">
                  MARCA
                </label>
                <select
                  id="filtroMarca"
                  className="form-select bg-black text-white border-secondary shadow-none"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                >
                  <option value="">Qualsiasi marca</option>
                  <option value="playstation">PlayStation</option>
                  <option value="xbox">Xbox</option>
                  <option value="nintendo">Nintendo</option>
                  <option value="sega">Sega</option>
                  <option value="commodore">Commodore</option>
                  <option value="atari">Atari</option>
                </select>
              </div>

              {/* ZONA */}
              <div className="mb-4">
                <label htmlFor="filtroZonaSeleziona" className="form-label small text-secondary mb-1">
                  ZONA
                </label>
                <select
                  id="filtroZonaSeleziona"
                  className="form-select bg-black text-white border-secondary shadow-none"
                  value={zonaModalita}
                  onChange={(e) => {
                    setZonaModalita(e.target.value);
                    setRegione('');
                    setCitta('');
                  }}
                >
                  <option value="italia">Tutta Italia</option>
                  <option value="regione">Regione</option>
                  <option value="citta">Città</option>
                </select>

                {zonaModalita === 'regione' && (
                  <InputAutocompletamento
                    id="inputRegione"
                    placeholder="Es. Lazio, Lombardia..."
                    database={REGIONI}
                    value={regione}
                    onChange={setRegione}
                  />
                )}

                {zonaModalita === 'citta' && (
                  <InputAutocompletamento
                    id="inputCitta"
                    placeholder="Es. Roma, Milano..."
                    database={CITTA}
                    value={citta}
                    onChange={setCitta}
                  />
                )}
              </div>

              {/* CONDIZIONI */}
              <div className="mb-4">
                <label className="form-label small text-secondary mb-1 d-block">CONDIZIONI</label>
                {CONDIZIONI.map((c) => (
                  <div className="form-check form-check-inline" key={c.id}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={c.id}
                      checked={condizioni.includes(c.valore)}
                      onChange={() => toggleCondizione(c.valore)}
                    />
                    <label className="form-check-label small" htmlFor={c.id}>
                      {c.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* PREZZO */}
              <div className="mb-4">
                <label className="form-label small text-secondary mb-2 d-block">PREZZO (€)</label>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="number"
                      id="prezzoMin"
                      className="form-control bg-transparent text-white border-secondary shadow-none"
                      placeholder="Da"
                      min="0"
                      value={prezzoMin}
                      onChange={(e) => setPrezzoMin(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="number"
                      id="prezzoMax"
                      className="form-control bg-transparent text-white border-secondary shadow-none"
                      placeholder="A"
                      min="0"
                      value={prezzoMax}
                      onChange={(e) => setPrezzoMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SPEDIZIONE + SCAMBIO A MANO */}
              <div className="mb-4">
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="filtroSpedizione"
                    checked={spedizione}
                    onChange={(e) => setSpedizione(e.target.checked)}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="filtroSpedizione">
                    Spedizione disponibile
                  </label>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="filtroScambioMano"
                    checked={scambioMano}
                    onChange={(e) => setScambioMano(e.target.checked)}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="filtroScambioMano">
                    Scambio a mano
                  </label>
                </div>
              </div>

              {/* Pulsanti */}
              <div className="mt-auto d-flex gap-2 pt-3 border-top border-secondary">
                <button
                  type="button"
                  onClick={azzera}
                  className="btn btn-outline-secondary w-50 text-uppercase fw-bold py-2"
                >
                  Azzera
                </button>
                <button
                  type="submit"
                  className="btn bottone_login w-50 text-uppercase fw-bold py-2"
                >
                  Applica
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
