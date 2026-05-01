import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

// Context globale per l'autenticazione: tutti i componenti possono sapere
// se c'è un utente loggato senza passare props in giro
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null = non loggato, oggetto con nickname = loggato
  const [utente, setUtente] = useState(null);
  // loading = true finché non sappiamo se la sessione è attiva o no
  const [loading, setLoading] = useState(true);

  // Al primo caricamento dell'app verifichiamo se l'utente ha già una sessione attiva
  useEffect(() => {
    api.utenteMe()
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUtente(data?.loggato ? data : null);
        setLoading(false);
      })
      .catch(() => {
        // In caso di errore di rete assumiamo non loggato
        setUtente(null);
        setLoading(false);
      });
  }, []);

  // Chiama l'API di logout e pulisce lo stato locale
  const logout = async () => {
    await api.logout();
    setUtente(null);
  };

  return (
    <AuthContext.Provider value={{ utente, loading, setUtente, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook comodo per usare il context senza importare useContext ogni volta
export const useAuth = () => useContext(AuthContext);
