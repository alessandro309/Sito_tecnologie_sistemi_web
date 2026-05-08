import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CONDIZIONI = [
  { id: 'condizNuovo',         valore: 'Nuovo',             label: 'Nuovo' },
  { id: 'condizComeNuovo',     valore: 'Come Nuovo',        label: 'Come Nuovo' },
  { id: 'condizOttime',        valore: 'Ottime',            label: 'Ottime' },
  { id: 'condizBuone',         valore: 'Buone',             label: 'Buone' },
  { id: 'condizPezziRicambio', valore: 'Pezzi di ricambio', label: 'Pezzi di ricambio' },
];

export default function ModalFiltri() {
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef(null);

  const [tipologia, setTipologia] = useState('');
  const [marca, setMarca] = useState('');
  const [condizioni, setCondizioni] = useState([]);
  const [prezzoMin, setPrezzoMin] = useState('');
  const [prezzoMax, setPrezzoMax] = useState('');
  const [spedizione, setSpedizione] = useState(false);
  const [consegnaAMano, setConsegnaAMano] = useState(false);

  // Conta i filtri attivi per aggiornare il badge nella barra di ricerca
  const contaFiltri =
    (tipologia ? 1 : 0) +
    (marca ? 1 : 0) +
    condizioni.length +
    (prezzoMin !== '' ? 1 : 0) +
    (prezzoMax !== '' ? 1 : 0) +
    (spedizione ? 1 : 0) +
    (consegnaAMano ? 1 : 0);

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
    setCondizioni([]);
    setPrezzoMin('');
    setPrezzoMax('');
    setSpedizione(false);
    setConsegnaAMano(false);
  }

  function handleApplica(e) {
    e.preventDefault();

    // Manteniamo i parametri di ricerca testuale già presenti nell'URL (ricerca, citta)
    const params = new URLSearchParams(window.location.search);

    // Puliamo solo i parametri dei filtri, lasciando intatti ricerca e citta
    ['tipologia', 'marca', 'condizioni', 'prezzo_min', 'prezzo_max', 'spedizione', 'presenza']
      .forEach((k) => params.delete(k));

    if (tipologia) params.set('tipologia',  tipologia);
    if (marca) params.set('marca', marca);
    condizioni.forEach((c) => params.append('condizioni', c));
    if (prezzoMin !== '') params.set('prezzo_min', prezzoMin);
    if (prezzoMax !== '') params.set('prezzo_max', prezzoMax);
    if (spedizione) params.set('spedizione', 'true');
    if (consegnaAMano) params.set('presenza', 'true');

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
                  <option value="Altro">Altro</option>
                </select>
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

              {/* SPEDIZIONE + CONSEGNA A MANO */}
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
                    id="filtroConsegnaAMano"
                    checked={consegnaAMano}
                    onChange={(e) => setConsegnaAMano(e.target.checked)}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="filtroConsegnaAMano">
                    Consegna a mano
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
