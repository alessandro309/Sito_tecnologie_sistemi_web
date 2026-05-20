import {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';


// Pulsante sole/luna per cambiare tema — sincronizzato con localStorage
function PulsanteTema() {
  const [tema, setTema] = useState(localStorage.getItem('temaSelezionato') || 'dark');

  useEffect(() => {
    if (tema === 'light') {
      document.body.classList.add('tema-chiaro');
      localStorage.setItem('temaSelezionato', 'light');
    } else {
      document.body.classList.remove('tema-chiaro');
      localStorage.setItem('temaSelezionato', 'dark');
    }
  }, [tema]);

  function toggle() {
    setTema((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <button
      onClick={toggle}
      className="btn bottone_login font-monospace rounded-1 bg-transparent border-0 p-0 m-0 d-flex align-items-center justify-content-center w-100 w-lg-auto px-4 py-2 text-nowrap"
      title={tema === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      style={{minWidth: 44}}
    >
      <i className={`bi bi-${tema === 'dark' ? 'sun-fill' : 'moon-stars-fill'} fs-5`}></i>
    </button>
  );
}

// Menu console: label, marca, icona
const CONSOLE_MENUS = [
  {label: 'PLAYSTATION', marca: 'PlayStation', icon: <i className="bi bi-playstation fs-5" />},
  {label: 'XBOX', marca: 'Xbox', icon: <i className="bi bi-xbox fs-5" />},
  {label: 'NINTENDO', marca: 'Nintendo', icon: <i className="bi bi-nintendo-switch fs-5" />},
  {label: 'SEGA', marca: 'Sega', icon: <img src="/logo_sega.svg" alt="Sega" className="logo-console-svg" />},
  {label: 'COMMODORE', marca: 'Commodore', icon: <img src="/logo_commodore.svg" alt="Commodore" className="logo-console-svg" />},
  {label: 'ATARI', marca: 'Atari', icon: <img src="/logo_atari.svg" alt="Atari" className="logo-console-svg" />},
  {label: 'ALTRO', marca: 'Altro', icon: null},
];

// Link diretto agli annunci filtrati per marca
function ConsoleLink({menu}) {
  // "ALTRO" non ha una marca specifica: porta a tutti gli annunci
  const to = menu.marca ? `/annunci?marca=${encodeURIComponent(menu.marca)}` : '/annunci';

  return (
    <li className="nav-item">
      <Link
        to={to}
        className="nav-link text-white font-monospace d-flex align-items-center gap-2"
      >
        {menu.icon}
        {menu.label}
      </Link>
    </li>
  );
}

function LinkPreferiti() {
  const {utente} = useAuth();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  function handleClick(e) {
    e.preventDefault();
    if (!utente) {
      const el = document.getElementById('modalLogin');
      window.bootstrap?.Modal.getOrCreateInstance(el)?.show();
      return;
    }
    navigate('/profilo#sezionePreferiti');
  }

  return (
    <a
      href="#"
      className="nav-link font-monospace d-flex text-white align-items-center link-preferiti"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <i className={`bi ${hovered ? 'bi-floppy-fill' : 'bi-floppy'} text-danger me-2 fs-5`}></i>
      Preferiti
    </a>
  );
}

// Parte destra della navbar (Accedi oppure utente loggato)
function NavbarDestra() {
  const {utente, logout} = useAuth();
  if (!utente) {
    return (
      <a
        href="#"
        className="btn bottone_login font-monospace text-uppercase rounded-1 d-flex align-items-center ms-lg-4"
        id="pulsante_login"
        data-bs-toggle="modal"
        data-bs-target="#modalLogin"
      >
        <i className="bi bi-person-fill me-2 fs-5"></i>
        Accedi
      </a>
    );
  }

  return (
    <div className="d-flex flex-column flex-lg-row align-items-center gap-1 ms-lg-0 w-100 w-lg-auto">
      {/* Pulsante chat (visibile solo se loggato) */}
      <Link
        to="/chat"
        className="btn bottone_login font-monospace text-uppercase rounded-1 bg-transparent border-0 p-0 m-0 d-flex align-items-center justify-content-center w-100 w-lg-auto px-4 py-2 text-nowrap"
      >
        <i className="bi bi-chat-dots-fill fs-5"></i>
      </Link>

      <Link
        to="/crea-annuncio"
        className="btn bottone_login font-monospace text-uppercase rounded-1 d-flex align-items-center justify-content-center w-100 w-lg-auto px-4 py-2 text-nowrap"
      >
        <i className="bi bi-plus-circle me-2 fs-5"></i> Crea Annuncio
      </Link>

      <div className="nav-item dropdown w-100 w-lg-auto">
        <a
          href="#"
          className="btn bottone_login font-monospace rounded-1 d-flex align-items-center justify-content-center w-100 px-4 py-2 text-nowrap"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className="bi bi-person-circle me-2 fs-5"></i>
          {utente.nickname}
        </a>
        <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end rounded-2 mt-2 shadow-lg border-secondary">
          <li>
            <Link className="dropdown-item font-monospace py-2" to="/profilo">
              <i className="bi bi-person me-2"></i>Il mio Profilo
            </Link>
          </li>
          <li><hr className="dropdown-divider border-secondary" /></li>
          <li>
            <button className="dropdown-item font-monospace text-danger py-2 w-100 text-start" onClick={logout}>
              <i className="bi bi-box-arrow-right me-2"></i>Esci
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function Navbar({children}) {

  return (
    <header>
      {/* Barra principale con logo e pulsanti */}
      <nav className="navbar navbar-expand-lg bg-black border-bottom border-secondary" data-bs-theme="dark">
        <div className="container-fluid">
          <Link className="navbar-brand font-monospace text-uppercase d-flex align-items-center gap-2" to="/">
            <img src="/Arcade_png-removebg-preview.png" alt="Logo Arcade" className="logo-navbar" />
            <span className="brand-text">
              <span className="text-white">RETRO</span>
              <span className="text-danger">SHOP</span>
            </span>
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target=".miei-menu-mobile">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse miei-menu-mobile">
            <div className="navbar-nav ms-auto align-items-center gap-1 mt-4 mt-lg-0 pb-3 pb-lg-0">
              <LinkPreferiti />
              <PulsanteTema />
              <NavbarDestra />
            </div>
          </div>
        </div>
      </nav>

      {/* Barra dei menu console */}
      <div className="collapse d-lg-block miei-menu-mobile">
        <ul className="nav flex-column flex-lg-row bg-black justify-content-center align-items-center bg-opacity-50 p-2 border-bottom border-secondary text-center m-0">
          {CONSOLE_MENUS.map((menu) => (
            <ConsoleLink key={menu.label} menu={menu} />
          ))}
        </ul>
      </div>

      {/* Barra di ricerca + eventuale contenuto aggiuntivo */}
      {children}
    </header>
  );
}
