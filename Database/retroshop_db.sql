-- ============================================================
-- RetroShop DB — backup completo
-- Generato il: 2026-05-04 20:46
-- ============================================================

-- ISTRUZIONI PER IL RIPRISTINO:
-- 1. Crea il database:  createdb -U postgres retroshop_db
-- 2. Esegui il file:    psql -U postgres -d retroshop_db -f retroshop_db.sql
--    oppure in pgAdmin: Query Tool > Apri file > Esegui
-- 3. Aggiorna la password in backend/database/database.py

SET client_encoding = 'UTF8';

-- ---- DATI ----

-- Tabella: utenti (4 righe)
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('Rick_Roll', 'Rick', 'Astley', '1966-02-08', 'M', 'Frascati', NULL, 'rickincredibile@prova.com', '$2b$12$cccsV0RZi.9q.UfmnK0vYuZvAVy6Nk/angIFJnx/S6p6/Xcv.3swa', '/static/utenti/Rick_Roll/rick.jpg');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('Shreck', 'Shrek', 'Il magnifico', '0001-01-01', 'M', 'Roma', 'RM', 'shrekilgrande@gmail.com', '$2b$12$U4kdqDwtJk1ViGpDeBjU.enSHPaT4nAH.Al2J67qQ/EU4UwfGirRy', '/static/utenti/Shreck/Sexy_Shrek.webp');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('James_Metallica', 'James', 'Hetfield', '1963-08-03', 'M', NULL, NULL, 'james@metallica.com', '$2b$12$/ikyKbE2c6KfmvORDNqGBe4PRJLcHRJkiodWSwzP0liUzjezlpZSG', '/static/utenti/James_Metallica/13-James-Hetfield-1200x834.jpg.webp');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('Zeb89', 'Kennet', 'Caselli', '0001-01-01', 'M', 'Bibbiena', NULL, 'zeb89@acegamer.it', '$2b$12$kKquMe7jxaL.BhsQpvvMVeQHWs9gC6JJyPO6rmW.Kh.FMzMhBzHem', '/static/utenti/Zeb89/maxresdefault.jpg');

-- Tabella: annunci (4 righe)
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile) VALUES (5, 'Pokemon Zaffiro (solo cartuccia)', 25.0, 'Ottime', 'Nintendo', 'GameBoy Advance', 'giochi', 'James_Metallica', false, 0.0, true, 'Roma', 'Vendo Pokèmon zaffiro, solo cartuccia. Perfettamente funzionante, come da foto. EXIT LIGHT, ENTER NIGHT!!!!', '2026-05-01 11:13:43.603724', NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile) VALUES (6, 'Pokemon Platino ', 80.0, 'Come Nuovo', 'Nintendo', 'DS', 'giochi', 'James_Metallica', false, 0.0, true, 'Roma', 'Vendo Pokèmon Platino completo di tutto, perfettamente funzionante come da foto. Gimme fuel, gimme fire, gimme that which I desire!!!!', '2026-05-01 11:17:00.341120', NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile) VALUES (2, 'PSP 3004', 50.0, 'Buone', 'PlayStation', 'PSP', 'console', 'Shreck', true, 0.0, true, 'Roma', 'PSP pubblicata per testare la nuova pagina di pubblicazione ', '2026-04-29 23:47:56.190804', true);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile) VALUES (3, 'GameBoy Advance Sp ', 80.0, 'Buone', 'Nintendo', 'GameBoy Advance', 'console', 'Rick_Roll', true, 0.0, true, 'Roma', 'Annuncio pubblicato dopo la sua eliminazione ', '2026-04-30 22:44:37.864663', true);

-- Tabella: immagini_annuncio (12 righe)
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (16, '/static/annunci/2/WhatsApp Image 2026-04-29 at 23.32.21.jpeg', 0, 2);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (17, '/static/annunci/2/WhatsApp Image 2026-04-29 at 23.32.22.jpeg', 1, 2);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (18, '/static/annunci/3/WhatsApp Image 2026-04-07 at 17.25.26 (1).jpeg', 0, 3);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (19, '/static/annunci/3/WhatsApp Image 2026-04-07 at 17.25.26 (2).jpeg', 1, 3);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (20, '/static/annunci/3/WhatsApp Image 2026-04-07 at 17.25.26.jpeg', 2, 3);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (24, '/static/annunci/5/WhatsApp Image 2026-05-01 at 11.08.39 (3).jpeg', 0, 5);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (25, '/static/annunci/5/WhatsApp Image 2026-05-01 at 11.08.39 (2).jpeg', 1, 5);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (26, '/static/annunci/5/WhatsApp Image 2026-05-01 at 11.08.39 (1).jpeg', 2, 5);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (27, '/static/annunci/6/WhatsApp Image 2026-05-01 at 11.08.39.jpeg', 0, 6);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (28, '/static/annunci/6/WhatsApp Image 2026-05-01 at 11.08.38 (1).jpeg', 1, 6);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (29, '/static/annunci/6/WhatsApp Image 2026-05-01 at 11.08.38.jpeg', 2, 6);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (30, '/static/annunci/6/WhatsApp Image 2026-05-01 at 11.08.37.jpeg', 3, 6);

-- Tabella: sessioni (7 righe)
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('02d1591a-7307-46d9-925a-06ae3f024429', 'Rick_Roll', '2026-04-24 22:09:59.746927');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('152809f9-04dc-4add-a510-6ff83c96b72d', 'Rick_Roll', '2026-04-27 18:28:02.799413');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('85362849-58b1-4351-8b76-0f2d763b1b91', 'Rick_Roll', '2026-05-07 17:53:55.129668');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('ae44ae24-55ba-4ae9-8695-4c538b275891', 'Rick_Roll', '2026-05-07 22:49:40.520269');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('5011b666-a884-4304-b252-cb71f059f91c', 'Shreck', '2026-05-08 14:36:17.336997');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('90f1c326-ecfe-4c3b-945f-715c6edea8c6', 'Zeb89', '2026-05-11 10:10:18.909804');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('210b9ec8-79cb-4887-8487-42a2332ce96a', 'Zeb89', '2026-05-11 16:39:36.902185');

-- Tabella: preferiti (3 righe)
INSERT INTO preferiti (nickname_utente, idAnnuncio) VALUES ('Shreck', 3);
INSERT INTO preferiti (nickname_utente, idAnnuncio) VALUES ('James_Metallica', 2);
INSERT INTO preferiti (nickname_utente, idAnnuncio) VALUES ('Zeb89', 6);
