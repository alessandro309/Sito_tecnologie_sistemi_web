import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Slider a doppio cursore per il range di prezzo
function RangePrezzo({ valore, onChange }) {
  const minGap = 10;

  function handleMin(e) {
    const v = parseInt(e.target.value);
    const max = valore[1];
    onChange([max - v < minGap ? max - minGap : v, max]);
  }

  function handleMax(e) {
    const v = parseInt(e.target.value);
    const min = valore[0];
    onChange([min, v - min < minGap ? min + minGap : v]);
  }

  const percentMin = (valore[0] / 1000) * 100;
  const percentMax = (valore[1] / 1000) * 100;

  return (
    <>
      <div className="d-flex justify-content-between text-white mb-2 font-monospace fw-bold">
        <span>€ {valore[0]}</span>
        <span>€ {valore[1]}</span>
      </div>
      <div className="range-slider-container position-relative">
        <div className="slider-track" style={{ left: `${percentMin}%`, width: `${percentMax - percentMin}%` }} />
        <input type="range" min="0" max="1000" value={valore[0]} onChange={handleMin} className="double-slider" />
        <input type="range" min="0" max="1000" value={valore[1]} onChange={handleMax} className="double-slider" />
      </div>
    </>
  );
}

const CONDIZIONI = [
  { id: 'condizNuovo',         valore: 'nuovo',             label: 'Nuovo' },
  { id: 'condizComeNuovo',     valore: 'come_nuovo',        label: 'Come Nuovo' },
  { id: 'condizBuono',         valore: 'buone',             label: 'Buone' },
  { id: 'condizDiscrete',      valore: 'discrete',          label: 'Discrete' },
  { id: 'condizPezziRicambio', valore: 'pezzi_di_ricambio', label: 'Pezzi di ricambio' },
];

export default function ModalFiltri() {
  const navigate = useNavigate();
  const location = useLocation();

  const [console_, setConsole] = useState('');
  const [condizioni, setCondizioni] = useState([]);
  const [prezzo, setPrezzo] = useState([0, 1000]);
  const [spedizione, setSpedizione] = useState(false);

  const mappaRef = useRef(null);
  const mapRef = useRef(null);
  const modalRef = useRef(null);

  // Inizializza la mappa Leaflet quando il modal si apre
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const onShow = () => {
      if (!mapRef.current && mappaRef.current) {
        mapRef.current = window.L.map(mappaRef.current).setView([41.9032, 12.5113], 13);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(mapRef.current);
        // Filtro scuro per tema retro
        const container = mappaRef.current.querySelector('.leaflet-container');
        if (container) container.style.filter = 'brightness(0.8) contrast(1.2) invert(100%) hue-rotate(180deg) saturate(0.5)';
      } else if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    el.addEventListener('shown.bs.modal', onShow);
    return () => el.removeEventListener('shown.bs.modal', onShow);
  }, []);

  function toggleCondizione(valore) {
    setCondizioni((prev) =>
      prev.includes(valore) ? prev.filter((c) => c !== valore) : [...prev, valore]
    );
  }

  function azzera() {
    setConsole('');
    setCondizioni([]);
    setPrezzo([0, 1000]);
    setSpedizione(false);
    mapRef.current?.setView([41.9032, 12.5113], 13);
  }

  function handleApplica(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search); // mantieni ricerca/luogo
    params.delete('console');
    params.delete('condizioni');
    params.delete('prezzo_min');
    params.delete('prezzo_max');
    params.delete('spedizione');

    if (console_) params.set('console', console_);
    condizioni.forEach((c) => params.append('condizioni', c));
    params.set('prezzo_min', prezzo[0]);
    params.set('prezzo_max', prezzo[1]);
    if (spedizione) params.set('spedizione', 'true');

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
    <div className="modal fade" id="modalFiltri" tabIndex="-1" aria-labelledby="modalFiltriLabel" aria-hidden="true" ref={modalRef}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content bg-black border border-secondary rounded-1 shadow-lg font-monospace text-white">

          <div className="modal-header border-bottom border-secondary mb-4">
            <h5 className="modal-title text-uppercase fw-bold ps-2" id="modalFiltriLabel">Filtri di Ricerca</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div className="modal-body px-4 px-md-5 pb-5 pt-0">
            <div className="row g-5">

              {/* Colonna filtri */}
              <div className="col-lg-5">
                <form id="formFiltri" onSubmit={handleApplica} className="d-flex flex-column h-100">

                  <div className="mb-4">
                    <label className="form-label small text-secondary mb-1">CONSOLE</label>
                    <select
                      className="form-select bg-black text-white border-secondary"
                      value={console_}
                      onChange={(e) => setConsole(e.target.value)}
                    >
                      <option value="" disabled>Seleziona console...</option>
                      <option value="playstation">PlayStation</option>
                      <option value="xbox">Xbox</option>
                      <option value="nintendo">Nintendo</option>
                    </select>
                  </div>

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
                        <label className="form-check-label small" htmlFor={c.id}>{c.label}</label>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="form-label small text-secondary mb-2 d-block">PREZZO</label>
                    <RangePrezzo valore={prezzo} onChange={setPrezzo} />
                  </div>

                  <div className="mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filtroSpedizione"
                        checked={spedizione}
                        onChange={(e) => setSpedizione(e.target.checked)}
                      />
                      <label className="form-check-label small text-secondary" htmlFor="filtroSpedizione">
                        Necessaria spedizione
                      </label>
                    </div>
                  </div>

                  <div className="mt-auto d-flex gap-2 pt-3">
                    <button type="button" onClick={azzera} className="btn btn-outline-secondary w-50 text-uppercase fw-bold py-2">
                      Azzera filtri
                    </button>
                    <button type="submit" className="btn bottone_login w-50 text-uppercase fw-bold py-2">
                      Applica filtri
                    </button>
                  </div>

                </form>
              </div>

              {/* Colonna mappa */}
              <div className="col-lg-7 d-flex flex-column border-start border-secondary ps-lg-5">
                <label className="form-label small text-secondary mb-2 d-block">ZONA DI RICERCA (Trascina per spostare)</label>
                <div
                  className="position-relative flex-grow-1 rounded-2 overflow-hidden border border-secondary"
                  style={{ minHeight: 400, backgroundColor: '#1a1a1a' }}
                >
                  <div ref={mappaRef} className="w-100 h-100 position-absolute top-0 start-0"></div>
                  <div className="mappa-mirino"></div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}