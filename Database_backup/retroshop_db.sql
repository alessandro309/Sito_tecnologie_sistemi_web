-- ============================================================
-- RetroShop DB — backup completo
-- Generato il: 2026-05-07 20:38
-- ============================================================

-- ISTRUZIONI PER IL RIPRISTINO:
-- 1. Crea il database:  createdb -U postgres retroshop_db
-- 2. Esegui il file:    psql -U postgres -d retroshop_db -f retroshop_db.sql
--    oppure in pgAdmin: Query Tool > Apri file > Esegui
--    (crea le tabelle, inserisce i dati e ripristina le sequenze)
-- 3. Aggiorna la password in backend/database/database.py

SET client_encoding = 'UTF8';

BEGIN;

-- ---- SCHEMA ----

CREATE TABLE IF NOT EXISTS utenti (
    nickname VARCHAR PRIMARY KEY,
    nome VARCHAR NOT NULL,
    cognome VARCHAR NOT NULL,
    nascita DATE NOT NULL,
    sesso VARCHAR,
    citta VARCHAR,
    provincia VARCHAR,
    mail VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    foto_profilo VARCHAR
);

CREATE TABLE IF NOT EXISTS annunci (
    idAnnuncio SERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    prezzo FLOAT NOT NULL,
    condizione VARCHAR NOT NULL,
    piattaforma VARCHAR NOT NULL,
    modello VARCHAR NOT NULL,
    tipologia VARCHAR NOT NULL,
    utente VARCHAR REFERENCES utenti(nickname),
    spedizione BOOLEAN,
    prezzo_spedizione FLOAT,
    presenza BOOLEAN,
    posizione VARCHAR NOT NULL,
    descrizione VARCHAR NOT NULL,
    data_pubblicazione TIMESTAMP DEFAULT now(),
    portatile BOOLEAN,
    venduto BOOLEAN NOT NULL DEFAULT false,
    acquirente VARCHAR REFERENCES utenti(nickname) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS immagini_annuncio (
    id SERIAL PRIMARY KEY,
    url_immagine VARCHAR NOT NULL,
    ordine INTEGER,
    annuncio_id INTEGER REFERENCES annunci(idAnnuncio)
);

CREATE TABLE IF NOT EXISTS sessioni (
    id_sessione VARCHAR PRIMARY KEY,
    nickname_utente VARCHAR NOT NULL REFERENCES utenti(nickname) ON DELETE CASCADE,
    data_scadenza TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS preferiti (
    nickname_utente VARCHAR REFERENCES utenti(nickname) ON DELETE CASCADE,
    idAnnuncio INTEGER REFERENCES annunci(idAnnuncio) ON DELETE CASCADE,
    PRIMARY KEY (nickname_utente, idAnnuncio)
);

-- ---- DATI ----

-- Tabella: utenti (9 righe)
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('Rick_Roll', 'Rick', 'Astley', '1966-02-08', 'M', 'Frascati', NULL, 'rickincredibile@prova.com', '$2b$12$cccsV0RZi.9q.UfmnK0vYuZvAVy6Nk/angIFJnx/S6p6/Xcv.3swa', '/static/utenti/Rick_Roll/rick.jpg');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('Shreck', 'Shrek', 'Il magnifico', '0001-01-01', 'M', 'Roma', 'RM', 'shrekilgrande@gmail.com', '$2b$12$U4kdqDwtJk1ViGpDeBjU.enSHPaT4nAH.Al2J67qQ/EU4UwfGirRy', '/static/utenti/Shreck/Sexy_Shrek.webp');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('James_Metallica', 'James', 'Hetfield', '1963-08-03', 'M', NULL, NULL, 'james@metallica.com', '$2b$12$/ikyKbE2c6KfmvORDNqGBe4PRJLcHRJkiodWSwzP0liUzjezlpZSG', '/static/utenti/James_Metallica/13-James-Hetfield-1200x834.jpg.webp');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('Zeb89', 'Kennet', 'Caselli', '0001-01-01', 'M', 'Bibbiena', NULL, 'zeb89@acegamer.it', '$2b$12$kKquMe7jxaL.BhsQpvvMVeQHWs9gC6JJyPO6rmW.Kh.FMzMhBzHem', '/static/utenti/Zeb89/maxresdefault.jpg');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('Melinoe', 'Melinoe', 'Hadeson', '1978-06-11', 'F', 'Pisa', 'PI', 'ade@hotmail.com', '$2b$12$e3Sn0tw1/ZzT2/gi6.aIpu.o0hg/pCVR4oXE87q5n8vOEEH1KvXIi', '/static/utenti/Melinoe/Screenshot 2026-05-07 182458.png');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('Luchettino', 'Luca', 'Montefusco', '2004-07-11', 'M', 'Roma', 'RM', 'montefusco.2129071@studenti.uniroma1.it', '$2b$12$Kxw1Qk0iXi4ASJySBf1ejOB0ceicHBKE.ng8ikMw9P9QShyTX2sJW', '/static/utenti/Luchettino/kris.png');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('TonyPitony', 'Tony', 'Pitony', '1998-07-23', 'M', 'Palermo', 'PL', 'tony@gmail.com', '$2b$12$OrcALDT1S6vFq0FSir8sRuaitW16va3Db4c9S5l4kFzt1EqBWitb6', '/static/utenti/TonyPitony/TONY-PITONY.jpg');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('LeonKennedy', 'Leon', 'Kennedy', '0001-01-01', 'M', NULL, NULL, 'leonsexkennedy@icloud.com', '$2b$12$o8aqxTlL47Z5HJYtFsr.GuDN/Uiy0ScdOcZGKISCFv16laWX1Xs.S', '/static/utenti/LeonKennedy/Leon.jpg');
INSERT INTO utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) VALUES ('Alex_Rob', 'Alessandro', 'Bogdan', '2004-09-30', 'M', 'Roma', 'RM', 'miamail@gmail.com', '$2b$12$3bZA1kPP9CkKHhpDrubdfOM//Vj/SSNDQlu9A9R25h/UAAZeRZKRS', '/static/utenti/Alex_Rob/Screenshot 2026-05-07 200850.png');

-- Tabella: annunci (22 righe)
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (19, 'Joy-Con ', 24.0, 'Pezzi di ricambio', 'Nintendo', 'Switch', 'accessori', 'Luchettino', true, 1.0, true, 'Roma', 'Rotti, potete provare a usarli per girare il caffé', '2026-05-07 18:41:09.753158', NULL, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (20, 'Donkey Kong Bananza', 69.0, 'Nuovo', 'Nintendo', 'Switch2', 'giochi', 'TonyPitony', false, 0.0, true, 'Palermo', 'Mi piacciono le nere', '2026-05-07 18:46:09.000253', NULL, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (21, 'Playstation 1', 50.0, 'Ottime', 'PlayStation', 'PS1', 'console', 'Alex_Rob', true, 10.0, true, 'Roma', 'Vendo PS1 perfettamente funzionante', '2026-05-07 18:51:23.010643', false, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (5, 'Pokemon Zaffiro (solo cartuccia)', 25.0, 'Ottime', 'Nintendo', 'GameBoy Advance', 'giochi', 'James_Metallica', false, 0.0, true, 'Roma', 'Vendo Pokèmon zaffiro, solo cartuccia. Perfettamente funzionante, come da foto. EXIT LIGHT, ENTER NIGHT!!!!', '2026-05-01 11:13:43.603724', NULL, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (6, 'Pokemon Platino ', 80.0, 'Come Nuovo', 'Nintendo', 'DS', 'giochi', 'James_Metallica', false, 0.0, true, 'Roma', 'Vendo Pokèmon Platino completo di tutto, perfettamente funzionante come da foto. Gimme fuel, gimme fire, gimme that which I desire!!!!', '2026-05-01 11:17:00.341120', NULL, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (23, 'Controller PS1', 15.0, 'Come Nuovo', 'PlayStation', 'PS1', 'accessori', 'Alex_Rob', true, 5.0, true, 'Firenze', 'Dualsense per ps1 blue trasparente', '2026-05-07 18:53:00.030883', NULL, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (3, 'GameBoy Advance Sp ', 80.0, 'Buone', 'Nintendo', 'GameBoy Advance', 'console', 'Rick_Roll', true, 0.0, true, 'Roma', 'Annuncio pubblicato dopo la sua eliminazione ', '2026-04-30 22:44:37.864663', true, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (24, 'Giochi vari', 1.0, 'Ottime', 'Nintendo', 'Switch', 'giochi', 'TonyPitony', false, 0.0, true, 'Palermo', 'La body positivity mi ha distrutto il bidet
Mario Kart 8DX -> 35 euro
Pokémon Violetto -> 10 euro
Animal Crossing -> venduto
Tomodachi Life: Living the Dream -> 65 euro', '2026-05-07 18:54:42.311202', NULL, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (25, 'Nintendo DS Fat (con scatola)', 150.0, 'Buone', 'Nintendo', 'DS', 'console', 'Alex_Rob', false, 0.0, true, 'Roma', 'Vendo Nintendo Ds Fat con scatola completo di tutto, difetto nello schermo inferiore', '2026-05-07 18:55:43.749897', true, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (22, 'Adventure Time + Jojo''s Bizarre Adventure', 16.79, 'Ottime', 'Nintendo', 'Switch', 'giochi', 'TonyPitony', true, 4.0, true, 'Palermo', 'Giovanni dice che sei gay (non so manco io da dove sono spawnati sti giochi)', '2026-05-07 18:52:35.511384', NULL, true, 'Alex_Rob');
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (26, 'PsONE', 40.0, 'Buone', 'PlayStation', 'PS1', 'console', 'Alex_Rob', false, 0.0, true, 'Padova', 'Vendo PSONE', '2026-05-07 19:05:14.045907', false, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (27, 'Playstation 2', 35.0, 'Buone', 'PlayStation', 'PS2', 'console', 'Alex_Rob', true, 6.99, true, 'Roma', 'Vendo PS2 perfettamente funzionante
', '2026-05-07 19:11:31.103281', false, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (28, 'Memory card PS1', 5.0, 'Ottime', 'PlayStation', 'PS1', 'accessori', 'Alex_Rob', true, 5.0, true, 'Venezia', 'Vendo Memory Card PS1', '2026-05-07 19:12:47.909118', NULL, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (29, 'Nintendo Ds Lite Grigio (con Scatola)', 100.0, 'Come Nuovo', 'Nintendo', 'DS', 'console', 'LeonKennedy', true, 10.0, true, 'Bari', 'Nintendo Ds lite silver completo di tutto, perfettamente funzionante', '2026-05-07 19:20:32.827961', true, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (30, 'Playstation3 slim', 30.0, 'Buone', 'PlayStation', 'PS3', 'console', 'LeonKennedy', true, 5.0, false, 'Frosinone', 'Ps3 slim funzionante compresa di controller ', '2026-05-07 19:27:49.087520', false, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (31, 'Xbox 360', 20.0, 'Buone', 'Xbox', 'Xbox360', 'console', 'LeonKennedy', true, 7.99, false, 'Napoli', 'Xbox 360 con controller', '2026-05-07 19:32:20.568882', false, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (33, 'Wiiu', 50.0, 'Buone', 'Nintendo', 'WIIu', 'console', 'LeonKennedy', false, 0.0, true, 'Roma', 'Wiiu con Paddone', '2026-05-07 19:34:49.718337', false, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (34, 'Controller PS5', 50.0, 'Buone', 'PlayStation', 'PS5', 'accessori', 'LeonKennedy', true, 5.0, false, 'Torino', 'Dualsense per PS5', '2026-05-07 19:55:50.636026', NULL, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (15, 'Nintendo Switch 2', 380.0, 'Come Nuovo', 'Nintendo', 'Switch2', 'console', 'Melinoe', true, 23.0, true, 'Pisa', 'Non presenta graffi e funziona perfettamente, utilissima per sconfiggere Crono!', '2026-05-07 18:27:52.448569', true, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (16, 'Skylanders Swap Force', 6.5, 'Ottime', 'Nintendo', 'WII', 'giochi', 'Luchettino', false, 0.0, true, 'Roma', 'Gioco usato 3 volte, ho anche la base con due personaggi', '2026-05-07 18:31:23.582184', NULL, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (17, 'Nintendo Switch Lite', 125.0, 'Ottime', 'Nintendo', 'Switch', 'console', 'Luchettino', false, 0.0, true, 'Roma', 'Lo stick sinistro è leggermente rovinato e il vetrino presenta graffi, ma si può cambiare. Funzionante', '2026-05-07 18:32:47.306201', true, false, NULL);
INSERT INTO annunci (idAnnuncio, nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) VALUES (18, 'Nintendo Switch', 95.0, 'Buone', 'Nintendo', 'Switch', 'console', 'Luchettino', true, 40.0, true, 'Roma', 'Non la comprerei', '2026-05-07 18:40:11.994099', true, false, NULL);

-- Tabella: immagini_annuncio (42 righe)
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
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (40, '/static/annunci/15/WhatsApp Image 2026-05-07 at 18.21.35 (3).jpeg', 0, 15);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (41, '/static/annunci/16/WhatsApp Image 2026-05-07 at 18.21.35 (1).jpeg', 0, 16);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (42, '/static/annunci/17/WhatsApp Image 2026-05-07 at 18.21.35.jpeg', 0, 17);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (43, '/static/annunci/18/WhatsApp Image 2026-05-07 at 18.38.29.jpeg', 0, 18);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (44, '/static/annunci/19/WhatsApp Image 2026-05-07 at 18.38.59.jpeg', 0, 19);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (45, '/static/annunci/20/WhatsApp Image 2026-05-07 at 18.45.15.jpeg', 0, 20);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (46, '/static/annunci/21/WhatsApp Image 2026-05-07 at 18.49.29 (3).jpeg', 0, 21);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (47, '/static/annunci/21/WhatsApp Image 2026-05-07 at 18.49.29 (1).jpeg', 1, 21);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (48, '/static/annunci/21/WhatsApp Image 2026-05-07 at 18.49.29 (2).jpeg', 2, 21);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (49, '/static/annunci/22/WhatsApp Image 2026-05-07 at 18.47.29.jpeg', 0, 22);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (50, '/static/annunci/23/WhatsApp Image 2026-05-07 at 18.49.29.jpeg', 0, 23);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (51, '/static/annunci/23/WhatsApp Image 2026-05-07 at 18.49.28 (2).jpeg', 1, 23);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (52, '/static/annunci/24/WhatsApp Image 2026-05-07 at 18.51.24.jpeg', 0, 24);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (53, '/static/annunci/25/WhatsApp Image 2026-05-07 at 18.49.27.jpeg', 0, 25);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (54, '/static/annunci/25/WhatsApp Image 2026-05-07 at 18.49.26 (4).jpeg', 1, 25);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (55, '/static/annunci/25/WhatsApp Image 2026-05-07 at 18.49.26 (3).jpeg', 2, 25);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (56, '/static/annunci/25/WhatsApp Image 2026-05-07 at 18.49.27 (1).jpeg', 3, 25);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (57, '/static/annunci/26/WhatsApp Image 2026-05-07 at 18.49.27 (7).jpeg', 0, 26);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (58, '/static/annunci/26/WhatsApp Image 2026-05-07 at 18.49.29 (1).jpeg', 1, 26);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (59, '/static/annunci/27/WhatsApp Image 2026-05-07 at 18.49.28 (1).jpeg', 0, 27);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (60, '/static/annunci/27/WhatsApp Image 2026-05-07 at 18.49.28.jpeg', 1, 27);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (61, '/static/annunci/28/WhatsApp Image 2026-05-07 at 18.49.27 (3).jpeg', 0, 28);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (62, '/static/annunci/28/WhatsApp Image 2026-05-07 at 18.49.27 (2).jpeg', 1, 28);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (63, '/static/annunci/29/WhatsApp Image 2026-05-07 at 18.49.29 (4).jpeg', 0, 29);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (64, '/static/annunci/29/WhatsApp Image 2026-05-07 at 18.49.29 (6).jpeg', 1, 29);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (65, '/static/annunci/29/WhatsApp Image 2026-05-07 at 18.49.30.jpeg', 2, 29);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (66, '/static/annunci/30/WhatsApp Image 2026-05-07 at 18.49.26 (2).jpeg', 0, 30);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (67, '/static/annunci/30/WhatsApp Image 2026-05-07 at 18.49.26 (1).jpeg', 1, 30);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (68, '/static/annunci/31/WhatsApp Image 2026-05-07 at 19.31.15.jpeg', 0, 31);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (73, '/static/annunci/33/WhatsApp Image 2026-05-07 at 19.31.14 (2).jpeg', 0, 33);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (74, '/static/annunci/33/WhatsApp Image 2026-05-07 at 19.31.14 (1).jpeg', 1, 33);
INSERT INTO immagini_annuncio (id, url_immagine, ordine, annuncio_id) VALUES (75, '/static/annunci/34/WhatsApp Image 2026-05-07 at 19.31.14.jpeg', 0, 34);

-- Tabella: sessioni (17 righe)
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('02d1591a-7307-46d9-925a-06ae3f024429', 'Rick_Roll', '2026-04-24 22:09:59.746927');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('152809f9-04dc-4add-a510-6ff83c96b72d', 'Rick_Roll', '2026-04-27 18:28:02.799413');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('85362849-58b1-4351-8b76-0f2d763b1b91', 'Rick_Roll', '2026-05-07 17:53:55.129668');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('ae44ae24-55ba-4ae9-8695-4c538b275891', 'Rick_Roll', '2026-05-07 22:49:40.520269');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('5011b666-a884-4304-b252-cb71f059f91c', 'Shreck', '2026-05-08 14:36:17.336997');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('90f1c326-ecfe-4c3b-945f-715c6edea8c6', 'Zeb89', '2026-05-11 10:10:18.909804');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('210b9ec8-79cb-4887-8487-42a2332ce96a', 'Zeb89', '2026-05-11 16:39:36.902185');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('821af9ba-3c94-43f3-9374-d68de2ef716e', 'Rick_Roll', '2026-05-12 20:48:31.320970');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('b707ab3e-a7fa-4607-9c13-01277724e5a7', 'Zeb89', '2026-05-12 21:27:27.073019');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('df8d5142-386c-4591-9700-336f0fb05d9b', 'Rick_Roll', '2026-05-13 08:05:28.308364');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('d88321e0-2b8a-45f0-a166-c5dac914ced1', 'Shreck', '2026-05-13 16:25:51.865793');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('b74f1a85-63a2-42f6-a579-e5dd674e6db1', 'Rick_Roll', '2026-05-13 17:10:02.085298');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('643cdc47-952e-4870-abca-2117b2384c15', 'James_Metallica', '2026-05-13 17:56:29.203391');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('61a4d71e-5833-4ae0-a807-7a08d5c13689', 'James_Metallica', '2026-05-13 18:42:02.233835');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('5010dee9-30af-4011-999e-bfedb7ad73a8', 'James_Metallica', '2026-05-13 21:31:11.863225');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('59789e67-a10f-4fb5-a458-da26e9cbb5f0', 'TonyPitony', '2026-05-14 18:44:44.647928');
INSERT INTO sessioni (id_sessione, nickname_utente, data_scadenza) VALUES ('9f4f3e7f-94e8-444d-980b-c9269367a635', 'Alex_Rob', '2026-05-14 20:07:56.802443');

-- Tabella: preferiti (4 righe)
INSERT INTO preferiti (nickname_utente, idAnnuncio) VALUES ('Shreck', 3);
INSERT INTO preferiti (nickname_utente, idAnnuncio) VALUES ('Zeb89', 6);
INSERT INTO preferiti (nickname_utente, idAnnuncio) VALUES ('Rick_Roll', 6);
INSERT INTO preferiti (nickname_utente, idAnnuncio) VALUES ('TonyPitony', 17);

-- ---- RESET SEQUENZE ----

SELECT setval(pg_get_serial_sequence('annunci', 'idAnnuncio'), COALESCE((SELECT MAX("idAnnuncio") FROM annunci), 1));
SELECT setval(pg_get_serial_sequence('immagini_annuncio', 'id'), COALESCE((SELECT MAX("id") FROM immagini_annuncio), 1));

COMMIT;
