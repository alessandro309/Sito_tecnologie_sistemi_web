import Navbar from '../componenti/Navbar';
import BarraRicerca from '../componenti/BarraRicerca';
import ModalLogin from '../componenti/Login';
import ModalFiltri from '../componenti/Filtri';
import Footer from '../componenti/Footer';

// Dati dei 4 box categoria nella home
const CATEGORIE = [
  {
    id: 'box_fisse',
    titolo: 'Console\nFisse',
    align: 'left', // testo a sinistra
  },
  {
    id: 'box_portatili',
    titolo: 'Console\nPortatili',
    align: 'right',
  },
  {
    id: 'box_accessori',
    titolo: 'Accessori',
    align: 'left',
  },
  {
    id: 'box_giochi',
    titolo: 'Giochi',
    align: 'right',
  },
];

function BoxCategoria({ id, titolo, align }) {
  const isRight = align === 'right';

  return (
    <a
      href="#"
      className="box_categoria rounded-4 d-flex align-items-center text-decoration-none shadow"
      id={id}
    >
      <div
        className={`${isRight ? 'ms-auto me-4 me-md-5 text-end' : 'ms-4 ms-md-5'} d-flex flex-column justify-content-center`}
        style={{ zIndex: 2 }}
      >
        <h2 className="text-white fw-bold text-uppercase font-monospace m-0 titolo_box">
          {titolo.split('\n').map((riga, i) => (
            <span key={i}>{riga}{i < titolo.split('\n').length - 1 && <br />}</span>
          ))}
        </h2>
        <span
          className={`font-monospace mt-3 text-uppercase d-flex align-items-center gap-2 text-danger fw-bold scopri_di_piu ${isRight ? 'justify-content-end' : ''}`}
          style={{ fontSize: '0.9rem' }}
        >
          Esplora il catalogo <i className="bi bi-arrow-right fs-5"></i>
        </span>
      </div>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <Navbar>
        <BarraRicerca />
      </Navbar>

      <main>
        <div className="container mt-5 d-flex flex-column align-items-center gap-4">
          {CATEGORIE.map((cat) => (
            <BoxCategoria key={cat.id} {...cat} />
          ))}
        </div>
      </main>

      <Footer />

      {/* Modali sempre presenti nel DOM */}
      <ModalLogin />
      <ModalFiltri />
    </>
  );
}