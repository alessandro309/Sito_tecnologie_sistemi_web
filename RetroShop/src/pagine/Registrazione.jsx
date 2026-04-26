import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Registrazione() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '', cognome: '', nickname: '', dataNascita: '',
    sesso: '', citta: '', provincia: '', email: '', confermaEmail: '',
    password: '', confermaPassword: '',
  });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [mostraPassword, setMostraPassword] = useState(false);
  const [mostraConferma, setMostraConferma] = useState(false);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState('');

  const oggiMeno18 = (() => {
    const d = new Date();
    return `${d.getFullYear() - 18}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  function aggiorna(campo) {
    return (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  }

  function handleFoto(e) {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    } else {
      setFoto(null);
      setFotoPreview(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore('');

    if (form.email !== form.confermaEmail) return setErrore('Le email non corrispondono!');
    if (form.password !== form.confermaPassword) return setErrore('Le password non corrispondono!');

    setCaricamento(true);
    try {
      const datiUtente = {
        nome: form.nome, cognome: form.cognome, nickname: form.nickname,
        nascita: form.dataNascita, sesso: form.sesso || null,
        citta: form.citta || null, provincia: form.provincia || null,
        mail: form.email, password: form.password,
      };

      const risposta = await api.registrazione(datiUtente);
      if (!risposta.ok) {
        const err = await risposta.json();
        throw new Error(err.detail || 'Errore durante la registrazione');
      }

      if (foto) await api.uploadFotoProfilo(datiUtente.nickname, foto);

      // Successo: vai al profilo dopo 1.5s
      setTimeout(() => navigate('/profilo'), 1500);
    } catch (err) {
      setErrore(err.message);
      setCaricamento(false);
    }
  }

  return (
    <>
      <header className="mb-5">
        <nav className="navbar bg-black border-bottom border-secondary p-3">
          <div className="container">
            <Link className="text-white text-decoration-none d-flex align-items-center" to="/">
              <i className="bi bi-arrow-left fs-4 me-2"></i> Torna al negozio
            </Link>
            <img src="/Arcade_png-removebg-preview.png" alt="Logo" style={{ height: 40 }} />
          </div>
        </nav>
      </header>

      <main className="container mb-5">
        <div className="bg-black p-4 p-md-5 rounded-4 shadow border border-secondary mx-auto" style={{ maxWidth: 900 }}>
          <h2 className="text-uppercase fw-bold mb-4 text-center border-bottom border-secondary pb-3">Registrazione account</h2>

          <form id="formRegistrazione" onSubmit={handleSubmit}>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Nome*</label>
                <input type="text" className="form-control rounded-1" value={form.nome} onChange={aggiorna('nome')} required />
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Cognome*</label>
                <input type="text" className="form-control rounded-1" value={form.cognome} onChange={aggiorna('cognome')} required />
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Nickname*</label>
                <input type="text" className="form-control rounded-1" value={form.nickname} onChange={aggiorna('nickname')} required />
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">
                  Data di nascita* <span className="text-danger" style={{ fontSize: '0.7rem' }}>(Solo &gt; 18 anni)</span>
                </label>
                <input type="date" className="form-control rounded-1" max={oggiMeno18} value={form.dataNascita} onChange={aggiorna('dataNascita')} required />
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Sesso</label>
                <select className="form-select rounded-1" value={form.sesso} onChange={aggiorna('sesso')}>
                  <option value="" disabled>Seleziona...</option>
                  <option value="M">Uomo</option>
                  <option value="F">Donna</option>
                  <option value="A">Altro</option>
                  <option value="ND">Preferisco non specificare</option>
                </select>
              </div>
              <div className="col-md-4">
                <div className="row g-2">
                  <div className="col-8">
                    <label className="form-label small text-secondary mb-1">Città</label>
                    <input type="text" className="form-control rounded-1" value={form.citta} onChange={aggiorna('citta')} />
                  </div>
                  <div className="col-4">
                    <label className="form-label small text-secondary mb-1">Prov.</label>
                    <input type="text" className="form-control rounded-1 text-uppercase" maxLength={2} placeholder="RM" value={form.provincia} onChange={aggiorna('provincia')} />
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small text-secondary mb-1">Mail*</label>
                <input type="email" className="form-control rounded-1" value={form.email} onChange={aggiorna('email')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-secondary mb-1">Conferma mail*</label>
                <input type="email" className="form-control rounded-1" value={form.confermaEmail} onChange={aggiorna('confermaEmail')} required />
              </div>
            </div>

            <div className="row g-3 mb-4 align-items-center">
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Password*</label>
                <div className="input-group">
                  <input type={mostraPassword ? 'text' : 'password'} className="form-control" value={form.password} onChange={aggiorna('password')} required />
                  <button type="button" className="btn btn-outline-secondary border-secondary text-white bg-transparent" onClick={() => setMostraPassword(!mostraPassword)}>
                    <i className={`bi bi-eye${mostraPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Conferma password*</label>
                <div className="input-group">
                  <input type={mostraConferma ? 'text' : 'password'} className="form-control" value={form.confermaPassword} onChange={aggiorna('confermaPassword')} required />
                  <button type="button" className="btn btn-outline-secondary border-secondary text-white bg-transparent" onClick={() => setMostraConferma(!mostraConferma)}>
                    <i className={`bi bi-eye${mostraConferma ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-secondary small mt-3 mt-md-0 pt-md-3">
                  <i className="bi bi-shield-lock text-danger"></i> Regole consigliate:<br />
                  <span style={{ fontSize: '0.8rem' }}>Minimo 8 caratteri, una lettera maiuscola e un numero.</span>
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12">
                <label className="form-label small text-secondary mb-1">
                  Foto Profilo <span className="text-secondary" style={{ fontSize: '0.7rem' }}>(Opzionale - Max 2MB)</span>
                </label>
                <input
                  className="form-control rounded-1 bg-black text-white border-secondary"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFoto}
                />
                {fotoPreview && (
                  <div className="mt-3 text-center">
                    <img src={fotoPreview} alt="Anteprima" className="rounded-circle border border-secondary shadow" style={{ width: 100, height: 100, objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>

            <div className="form-check mt-5 mb-4">
              <input className="form-check-input rounded-0 border-secondary" type="checkbox" id="informativa" required />
              <label className="form-check-label text-secondary small" htmlFor="informativa">
                Ho letto e accetto l'informativa sul trattamento dei dati personali*
              </label>
            </div>

            {errore && (
              <div className="alert alert-danger mt-3 text-center fw-bold rounded-1">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{errore}
              </div>
            )}

            <div className="text-center mt-4">
              <button
                type="submit"
                className={`btn font-monospace text-uppercase fw-bold px-5 py-3 rounded-1 w-100 w-md-auto ${caricamento ? 'btn-success' : 'btn-danger'}`}
                disabled={caricamento}
              >
                {caricamento
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Registrazione in corso...</>
                  : 'Crea Account'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </>
  );
}