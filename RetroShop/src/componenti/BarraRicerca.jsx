import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function BarraRicerca() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [ricerca, setRicerca] = useState('');
  const [luogo, setLuogo] = useState('');

  useEffect(() => {
    setRicerca(searchParams.get('ricerca') || '');
    setLuogo(searchParams.get('luogo') || '');
  }, [searchParams]);

  function Cerca(e) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams); 
    if (ricerca) params.set('ricerca', ricerca);
    else params.delete('ricerca');
    if (luogo) params.set('luogo', luogo);
    else params.delete('luogo');
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

        <div className="vr text-secondary d-none d-lg-block mx-1"></div>
        <hr className="text-secondary d-lg-none w-100 my-0" />

        <div className="input-group border-0 w-100">
          <span className="input-group-text bg-transparent border-0 text-secondary">
            <i className="bi bi-geo-alt"></i>
          </span>
          <input
            type="text"
            className="form-control bg-transparent border-0 text-white shadow-none"
            placeholder="Tutta Italia"
            value={luogo}
            onChange={(e) => setLuogo(e.target.value)}
          />
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