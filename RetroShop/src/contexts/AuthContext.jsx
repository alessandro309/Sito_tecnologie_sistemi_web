import {createContext, useContext, useState, useEffect} from 'react';
import {api} from '../api';

// Context globale per l'autenticazione
const AuthContext = createContext(null);

export function AuthProvider({children}) {
  // null = non loggato, oggetto con nickname = loggato
  const [utente, setUtente] = useState(null);
  // loading = true finché non sappiamo se la sessione è attiva o no
  const [loading, setLoading] = useState(true);

  // Al primo caricamento verifica se c'è una sessione attiva
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

  // Chiama l'API di logout e pulisce lo stato locale
  const logout = async () => {
    await api.logout();
    setUtente(null);
  };

  return (
    <AuthContext.Provider value={{utente, loading, setUtente, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
