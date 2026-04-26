import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(null);  // null = non loggato | { nickname, ... } = loggato
  const [loading, setLoading] = useState(true); // true finché non otteniamo risposta dal server

  // Al mount: controlla se c'è già una sessione attiva
  useEffect(() => {
    api.utenteMe()
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUtente(data?.loggato ? data : null);
        setLoading(false);
      })
      .catch(() => {
        setUtente(null);
        setLoading(false);
      });
  }, []);

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

export const useAuth = () => useContext(AuthContext);