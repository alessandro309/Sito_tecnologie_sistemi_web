import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import Home from './pagine/Home';
import Registrazione from './pagine/Registrazione';
import MostraAnnunci from './pagine/MostraAnnunci';
import PaginaAnnuncio from './pagine/PaginaAnnuncio';
import CreaAnnuncio from './pagine/CreaAnnuncio';
import Profilo from './pagine/Profilo';
import Chat from './pagine/Chat';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/registrazione"   element={<Registrazione />} />
          <Route path="/annunci"         element={<MostraAnnunci />} />
          <Route path="/annunci/:id"     element={<PaginaAnnuncio />} />
          <Route path="/crea-annuncio"   element={<CreaAnnuncio />} />
          <Route path="/profilo"         element={<Profilo />} />
           <Route path="/chat"           element={<Chat />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}