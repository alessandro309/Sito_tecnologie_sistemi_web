import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Struttura dati dei menu console — evita 400 righe di JSX ripetuto
const CONSOLE_MENUS = [
  {
    label: 'PLAYSTATION',
    icon: <i className="bi bi-playstation fs-5" />,
    items: [
      { name: 'PS1' }, { name: 'PS2' }, { name: 'PS3' }, { name: 'PS4' },
      { name: 'PS5' }, { name: 'PSP' }, { name: 'PSVita' },
    ],
    subs: ['Console', 'Giochi', 'Accessori'],
    tutto: 'Tutto PlayStation',
  },
  {
    label: 'XBOX',
    icon: <i className="bi bi-xbox fs-5" />,
    items: [
      { name: 'XBOX originale' }, { name: 'Xbox360' },
      { name: 'XBOX ONE' }, { name: 'XBOX Series X|S' },
    ],
    subs: ['Console', 'Giochi', 'Accessori'],
    tutto: 'Tutto XBOX',
  },
  {
    label: 'NINTENDO',
    icon: <i className="bi bi-nintendo-switch fs-5" />,
    items: [
      { name: 'NES' }, { name: 'SNES' }, { name: 'Nintendo64' }, { name: 'GameCube' },
      { name: 'WII' }, { name: 'WIIu' }, { name: 'Switch' }, { name: 'Switch2' },
      { name: 'GameBoy' }, { name: 'GameBoy Advance' }, { name: 'DS' }, { name: '3DS' },
    ],
    subs: ['Console', 'Giochi', 'Accessori'],
    tutto: 'Tutto Nintendo',
  },
  {
    label: 'SEGA',
    icon: <img src="/logo_sega.svg" alt="Sega" style={{ height: 20, filter: 'invert(1)' }} />,
    items: [
      { name: 'Master System' }, { name: 'Mega Drive' }, { name: 'MegaCD' },
      { name: 'GameGear' }, { name: 'Saturn' }, { name: 'DreamCast' },
    ],
    subs: ['Console', 'Giochi', 'Accessori'],
    tutto: 'Tutto SEGA',
  },
  {
    label: 'COMMODORE',
    icon: <img src="/logo_commodore.svg" alt="Commodore" style={{ height: 20, filter: 'brightness(0) invert(1)' }} />,
    items: [
      { name: 'VIC-20' },
      { name: 'Commodore 64' },
      { name: 'Commodore 128', subs: ['Console / PC', 'Giochi', 'Accessori'] },
    ],
    subs: ['Console', 'Giochi', 'Accessori'],
    tutto: 'Tutto Commodore',
  },
  {
    label: 'ATARI',
    icon: <img src="/logo_atari.svg" alt="Atari" style={{ height: 20, filter: 'invert(1)' }} />,
    items: [
      { name: 'Atari 2600' }, { name: 'Atari 5200' }, { name: 'Atari 7800' },
      { name: 'Atari Lynx' }, { name: 'Atari Jaguar' },
    ],
    subs: ['Console', 'Giochi', 'Accessori'],
    tutto: 'Tutto Atari',
  },
  {
    label: 'ALTRO',
    icon: null,
    items: [
      { name: 'Amiga', subs: ['Console', 'Giochi', 'Accessori'] },
      { name: 'Arcade / Cabinati', subs: ['Cabinati', 'Accessori'] },
    ],
    subs: [],
    tutto: 'Esplora Tutto',
  },
];

// Singolo elemento del menu con eventuali sottomenu
function ConsoleMenuItem({ item, menuSubs, openKey, onToggle, isMobile }) {
  const subs = item.subs ?? menuSubs;
  const key = item.name;
  const isOpen = openKey === key;

  function handleClick(e) {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      onToggle(isOpen ? null : key);
    }
  }

  return (
    <li className="dropdown-submenu">
      <a className="dropdown-item dropdown-toggle font-monospace" href="#" onClick={handleClick}>
        {item.name}
      </a>
      <ul className={`dropdown-menu dropdown-menu-dark submenu-retro rounded-2 ${isMobile && isOpen ? 'show' : ''}`}>
        {subs.map((sub) => (
          <li key={sub}><a className="dropdown-item font-monospace" href="#">{sub}</a></li>
        ))}
      </ul>
    </li>
  );
}

// Menu principale di una console (PlayStation, Xbox, ecc.)
function ConsoleMenu({ menu, isMobile }) {
  const [openSubmenu, setOpenSubmenu] = useState(null);

  return (
    <li className="nav-item dropdown">
      <a
        className="nav-link dropdown-toggle text-white font-monospace d-flex align-items-center gap-2"
        data-bs-toggle="dropdown"
        href="#"
      >
        {menu.icon}
        {menu.label}
      </a>
      <ul className="dropdown-menu dropdown-menu-dark rounded-2">
        {menu.items.map((item) => (
          <ConsoleMenuItem
            key={item.name}
            item={item}
            menuSubs={menu.subs}
            openKey={openSubmenu}
            onToggle={setOpenSubmenu}
            isMobile={isMobile}
          />
        ))}
        <li><hr className="dropdown-divider border-secondary" /></li>
        <li><a className="dropdown-item font-monospace" href="#">{menu.tutto}</a></li>
      </ul>
    </li>
  );
}

// Parte destra della navbar (Accedi oppure utente loggato)
function NavbarDestra() {
  const { utente, logout } = useAuth();

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
    <div className="d-flex flex-column flex-lg-row align-items-center gap-3 ms-lg-4 mt-3 mt-lg-0">
      <Link
        to="/crea-annuncio"
        className="btn bottone_login font-monospace text-uppercase rounded-1 d-flex align-items-center justify-content-center w-100 w-lg-auto px-4 py-2 text-nowrap"
      >
        <i className="bi bi-plus-circle me-2 fs-5"></i> Crea Annuncio
      </Link>

      <div className="nav-item dropdown w-100 w-lg-auto">
        <a
          href="#"
          className="btn bottone_login font-monospace text-uppercase rounded-1 d-flex align-items-center justify-content-center w-100 px-4 py-2 text-nowrap"
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

export default function Navbar({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <header>
      {/* Barra principale con logo e pulsanti */}
      <nav className="navbar navbar-expand-lg bg-black border-bottom border-secondary" data-bs-theme="dark">
        <div className="container-fluid">
          <Link className="navbar-brand font-monospace text-uppercase d-flex align-items-center gap-2" to="/">
            <img
              src="/Arcade_png-removebg-preview.png"
              alt="Logo Arcade"
              style={{
                height: 54,
                filter: 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(220, 53, 69, 0.9))',
              }}
            />
            <span style={{ letterSpacing: '3px', fontSize: '1.1rem', lineHeight: 1 }}>
              <span className="text-white">RETRO</span>
              <span className="text-danger">SHOP</span>
            </span>
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target=".miei-menu-mobile">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse miei-menu-mobile">
            <div className="navbar-nav ms-auto align-items-center gap-3 mt-4 mt-lg-0 pb-3 pb-lg-0">
              <a className="nav-link font-monospace d-flex text-white align-items-center link-preferiti" href="#">
                <i className="bi bi-floppy text-danger me-2 fs-5 icona-vuota"></i>
                <i className="bi bi-floppy-fill text-danger me-2 fs-5 icona-piena d-none"></i>
                Preferiti
              </a>
              <NavbarDestra />
            </div>
          </div>
        </div>
      </nav>

      {/* Barra dei menu console */}
      <div className="collapse d-lg-block miei-menu-mobile">
        <ul className="nav flex-column flex-lg-row bg-black justify-content-center align-items-center bg-opacity-50 p-2 border-bottom border-secondary text-center m-0">
          {CONSOLE_MENUS.map((menu) => (
            <ConsoleMenu key={menu.label} menu={menu} isMobile={isMobile} />
          ))}
        </ul>
      </div>

      {/* Barra di ricerca + eventuale contenuto aggiuntivo (es. filtri) */}
      {children}
    </header>
  );
}