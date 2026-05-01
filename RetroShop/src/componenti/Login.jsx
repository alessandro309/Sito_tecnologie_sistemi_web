import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

// Modal Bootstrap per il login, mostrato ovunque nell'app tramite data-bs-target="#modalLogin"
export default function ModalLogin() {
  const { setUtente } = useAuth();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setCaricamento(true);
    setErrore('');

    try {
      const risposta = await api.login({ nickname, password });

      if (risposta.ok) {
        // Login riuscito: recuperiamo i dati della sessione e aggiorniamo il context
        const me = await api.utenteMe();
        const dati = await me.json();
        setUtente(dati.loggato ? dati : null);

        // Chiudiamo il modal tramite l'API Bootstrap
        const el = document.getElementById('modalLogin');
        window.bootstrap?.Modal.getInstance(el)?.hide();
      } else {
        const err = await risposta.json();
        setErrore(err.detail || 'Credenziali errate');
      }
    } catch {
      setErrore('Errore di connessione al server.');
    }

    setCaricamento(false);
  }

  return (
    <div className="modal fade" id="modalLogin" tabIndex="-1" aria-labelledby="modalLoginLabel" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-black border border-secondary shadow-lg">

          <div className="modal-header border-0">
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div className="modal-body px-5 pb-5">
            <div className="text-center mb-4">
              <img src="/Arcade_png-removebg-preview.png" alt="Logo" style={{ height: 60 }} className="mb-2" />
              <h3 className="modal-title font-monospace text-white text-uppercase" id="modalLoginLabel">Accedi</h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="loginNickname" className="form-label font-monospace text-secondary small">NICKNAME</label>
                <input
                  type="text"
                  className="form-control bg-transparent border-secondary text-white shadow-none font-monospace"
                  id="loginNickname"
                  placeholder="Inserisci il tuo nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="loginPassword" className="form-label font-monospace text-secondary small">PASSWORD</label>
                <input
                  type="password"
                  className="form-control bg-transparent border-secondary text-white shadow-none font-monospace"
                  id="loginPassword"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Messaggio di errore (credenziali sbagliate, server down, ecc.) */}
              {errore && (
                <div className="alert alert-danger py-2 font-monospace small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>{errore}
                </div>
              )}

              <button type="submit" className="btn bottone_login w-100 font-monospace text-uppercase fw-bold py-2 mb-3" disabled={caricamento}>
                {caricamento
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Accesso...</>
                  : 'Entra'}
              </button>
            </form>

            <div className="text-center mt-3">
              <p className="font-monospace text-secondary small">
                Non sei registrato? <br />
                <Link
                  to="/registrazione"
                  className="text-danger text-decoration-none fw-bold"
                  onClick={() => {
                    // Chiudiamo il modal prima di navigare alla pagina di registrazione
                    const el = document.getElementById('modalLogin');
                    window.bootstrap?.Modal.getInstance(el)?.hide();
                  }}
                >
                  REGISTRATI ORA!
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
