import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CITTA = [
  'Agrigento', 'Alessandria', 'Ancona', 'Andria', 'Aosta', 'Arezzo',
  'Ascoli Piceno', 'Asti', 'Avellino',
  'Bari', 'Barletta', 'Belluno', 'Benevento', 'Bergamo', 'Biella',
  'Bologna', 'Bolzano', 'Brescia', 'Brindisi', 'Busto Arsizio',
  'Cagliari', 'Caltanissetta', 'Campobasso', 'Caserta', 'Catania',
  'Catanzaro', 'Cesena', 'Chieti', 'Como', 'Cosenza', 'Cremona',
  'Crotone', 'Cuneo',
  'Enna',
  'Ferrara', 'Firenze', 'Foggia', 'Forlì', 'Frosinone',
  'Genova', 'Gorizia', 'Grosseto',
  'Imperia', 'Isernia',
  "L'Aquila", 'La Spezia', 'Latina', 'Lecce', 'Lecco', 'Livorno',
  'Lodi', 'Lucca',
  'Macerata', 'Mantova', 'Massa', 'Matera', 'Messina', 'Milano',
  'Modena', 'Monza',
  'Napoli', 'Novara', 'Nuoro',
  'Oristano',
  'Padova', 'Palermo', 'Parma', 'Pavia', 'Perugia', 'Pesaro',
  'Pescara', 'Piacenza', 'Pisa', 'Pistoia', 'Pordenone', 'Potenza', 'Prato',
  'Ragusa', 'Ravenna', 'Reggio Calabria', 'Reggio Emilia', 'Rieti',
  'Rimini', 'Roma', 'Rovigo',
  'Salerno', 'Sassari', 'Savona', 'Siena', 'Siracusa', 'Sondrio',
  'Taranto', 'Terni', 'Torino', 'Trapani', 'Trento', 'Treviso', 'Trieste',
  'Udine',
  'Varese', 'Venezia', 'Verbania', 'Vercelli', 'Verona', 'Vibo Valentia',
  'Vicenza', 'Viterbo',
];

export default function BarraRicerca() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const containerRef = useRef(null);

  const [ricerca, setRicerca] = useState('');
  const [citta, setCitta] = useState('');
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [aperto, setAperto] = useState(false);

  useEffect(() => {
    setRicerca(searchParams.get('ricerca') || '');
    setCitta(searchParams.get('citta') || '');
  }, [searchParams]);

  // Chiude il dropdown se si clicca fuori dall'input città
  useEffect(() => {
    function handleClickFuori(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAperto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFuori);
    return () => document.removeEventListener('mousedown', handleClickFuori);
  }, []);

  function handleCittaInput(e) {
    const testo = e.target.value;
    setCitta(testo);
    if (!testo) { 
      setSuggerimenti([]); 
      setAperto(false); 
      return; 
    }
    const trovati = CITTA.filter((c) => c.toLowerCase().startsWith(testo.toLowerCase()));
    setSuggerimenti(trovati);
    setAperto(trovati.length > 0);
  }

  function selezionaCitta(nome) {
    setCitta(nome);
    setSuggerimenti([]);
    setAperto(false);
  }

  function Cerca(e) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (ricerca) params.set('ricerca', ricerca);
    else params.delete('ricerca');
    if (citta) params.set('citta', citta);
    else params.delete('citta');
    navigate(`/annunci?${params}`);
  }

  return (
    <div className="container my-4">
      <form
        onSubmit={Cerca}
        className="search_bar p-2 rounded-2 shadow border border-secondary d-flex flex-column flex-lg-row align-items-center gap-2"
      >
        <div className="input-group border-0 w-100">
          <span className="input-group-text bg-transparent border-0 text-secondary">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control bg-transparent border-0 text-white shadow-none"
            placeholder="Cerca"
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
          />
        </div>

        {/* separatore verticale su desktop, orizzontale su mobile */}
        <div className="vr text-secondary d-none d-lg-block mx-1"></div>
        <hr className="text-secondary d-lg-none w-100 my-0" />

        {/* Input città con autocomplete */}
        <div className="position-relative w-100" ref={containerRef}>
          <div className="input-group border-0">
            <span className="input-group-text bg-transparent border-0 text-secondary">
              <i className="bi bi-geo-alt"></i>
            </span>
            <input
              type="text"
              className="form-control bg-transparent border-0 text-white shadow-none"
              placeholder="Città"
              value={citta}
              onChange={handleCittaInput}
              autoComplete="off"
            />
          </div>
          {aperto && (
            <ul
              className="list-group position-absolute w-100 shadow-lg suggerimenti-autocomplete"
              style={{ top: '100%', zIndex: 1051 }}
            >
              {suggerimenti.map((nome) => (
                <li
                  key={nome}
                  className="list-group-item list-group-item-action bg-black text-white border-secondary suggerimento-item"
                  onMouseDown={() => selezionaCitta(nome)}
                >
                  {nome}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="vr text-secondary d-none d-lg-block mx-1"></div>
        <hr className="text-secondary d-lg-none w-100 my-0" />

        <button
          type="button"
          className="btn btn-dark bg-transparent border-0 text-white d-flex align-items-center gap-2 px-3 w-100 w-lg-auto justify-content-center text-nowrap"
          data-bs-toggle="modal"
          data-bs-target="#modalFiltri"
        >
          <i className="bi bi-sliders"></i> Filtri
          <span id="badgeFiltri" className="badge rounded-pill d-none">0</span>
        </button>

        <button type="submit" className="btn bottone_login rounded-3 px-4 py-2 w-100 w-lg-auto text-nowrap fw-bold">
          Cerca
        </button>
      </form>
    </div>
  );
}
