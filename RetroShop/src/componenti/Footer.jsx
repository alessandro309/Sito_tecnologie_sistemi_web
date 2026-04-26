export default function Footer() {
  return (
    <footer className="bg-black text-white border-top border-secondary mt-auto py-2">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <h5 className="font-monospace text-uppercase">RetroShop</h5>
            <p className="small text-secondary mb-0">
              &copy;2026 (by Alessandro Bogdan &amp; Luca Montefusco) Tutti i diritti riservati.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end mt-3 mt-md-0">
            <a href="https://youtu.be/QDia3e12czc?si=flfCdFpj-f2wJr3u" className="text-secondary me-3">
              <i className="bi bi-youtube fs-5"></i>
            </a>
            <a href="#" className="text-secondary me-3">
              <i className="bi bi-instagram fs-5"></i>
            </a>
            <a href="#" className="text-secondary">
              <i className="bi bi-envelope-fill fs-5"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}