--
-- PostgreSQL database dump
--

\restrict svb8TBGFvQXwkNNcAQTiGFv5McLZxvJYo5mUMPYRPYrgaXVjhU6IGTezrNwtoYp

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-05-10 00:37:14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 221 (class 1259 OID 18132)
-- Name: annunci; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.annunci (
    "idAnnuncio" integer NOT NULL,
    nome character varying NOT NULL,
    prezzo double precision NOT NULL,
    condizione character varying NOT NULL,
    piattaforma character varying NOT NULL,
    modello character varying NOT NULL,
    tipologia character varying NOT NULL,
    utente character varying,
    spedizione boolean,
    prezzo_spedizione double precision,
    presenza boolean,
    posizione character varying NOT NULL,
    descrizione character varying NOT NULL,
    data_pubblicazione timestamp without time zone DEFAULT now(),
    portatile boolean,
    venduto boolean DEFAULT false NOT NULL,
    acquirente character varying
);


ALTER TABLE public.annunci OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 18131)
-- Name: annunci_idAnnuncio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."annunci_idAnnuncio_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."annunci_idAnnuncio_seq" OWNER TO postgres;

--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 220
-- Name: annunci_idAnnuncio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."annunci_idAnnuncio_seq" OWNED BY public.annunci."idAnnuncio";


--
-- TOC entry 224 (class 1259 OID 18173)
-- Name: immagini_annuncio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.immagini_annuncio (
    id integer NOT NULL,
    url_immagine character varying NOT NULL,
    ordine integer,
    annuncio_id integer
);


ALTER TABLE public.immagini_annuncio OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 18172)
-- Name: immagini_annuncio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.immagini_annuncio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.immagini_annuncio_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 223
-- Name: immagini_annuncio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.immagini_annuncio_id_seq OWNED BY public.immagini_annuncio.id;


--
-- TOC entry 225 (class 1259 OID 18189)
-- Name: preferiti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preferiti (
    nickname_utente character varying NOT NULL,
    "idAnnuncio" integer NOT NULL
);


ALTER TABLE public.preferiti OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 18156)
-- Name: sessioni; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessioni (
    id_sessione character varying NOT NULL,
    nickname_utente character varying NOT NULL,
    data_scadenza timestamp without time zone NOT NULL
);


ALTER TABLE public.sessioni OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 18116)
-- Name: utenti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utenti (
    nickname character varying NOT NULL,
    nome character varying NOT NULL,
    cognome character varying NOT NULL,
    nascita date NOT NULL,
    sesso character varying,
    citta character varying,
    provincia character varying,
    mail character varying NOT NULL,
    password character varying NOT NULL,
    foto_profilo character varying
);


ALTER TABLE public.utenti OWNER TO postgres;

--
-- TOC entry 4873 (class 2604 OID 18135)
-- Name: annunci idAnnuncio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annunci ALTER COLUMN "idAnnuncio" SET DEFAULT nextval('public."annunci_idAnnuncio_seq"'::regclass);


--
-- TOC entry 4876 (class 2604 OID 18176)
-- Name: immagini_annuncio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immagini_annuncio ALTER COLUMN id SET DEFAULT nextval('public.immagini_annuncio_id_seq'::regclass);


--
-- TOC entry 5047 (class 0 OID 18132)
-- Dependencies: 221
-- Data for Name: annunci; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.annunci ("idAnnuncio", nome, prezzo, condizione, piattaforma, modello, tipologia, utente, spedizione, prezzo_spedizione, presenza, posizione, descrizione, data_pubblicazione, portatile, venduto, acquirente) FROM stdin;
19	Joy-Con 	24	Pezzi di ricambio	Nintendo	Switch	accessori	Luchettino	t	1	t	Roma	Rotti, potete provare a usarli per girare il caffé	2026-05-07 18:41:09.753158	\N	f	\N
20	Donkey Kong Bananza	69	Nuovo	Nintendo	Switch2	giochi	TonyPitony	f	0	t	Palermo	Mi piacciono le nere	2026-05-07 18:46:09.000253	\N	f	\N
21	Playstation 1	50	Ottime	PlayStation	PS1	console	Alex_Rob	t	10	t	Roma	Vendo PS1 perfettamente funzionante	2026-05-07 18:51:23.010643	f	f	\N
5	Pokemon Zaffiro (solo cartuccia)	25	Ottime	Nintendo	GameBoy Advance	giochi	James_Metallica	f	0	t	Roma	Vendo Pokèmon zaffiro, solo cartuccia. Perfettamente funzionante, come da foto. EXIT LIGHT, ENTER NIGHT!!!!	2026-05-01 11:13:43.603724	\N	f	\N
6	Pokemon Platino 	80	Come Nuovo	Nintendo	DS	giochi	James_Metallica	f	0	t	Roma	Vendo Pokèmon Platino completo di tutto, perfettamente funzionante come da foto. Gimme fuel, gimme fire, gimme that which I desire!!!!	2026-05-01 11:17:00.34112	\N	f	\N
23	Controller PS1	15	Come Nuovo	PlayStation	PS1	accessori	Alex_Rob	t	5	t	Firenze	Dualsense per ps1 blue trasparente	2026-05-07 18:53:00.030883	\N	f	\N
3	GameBoy Advance Sp 	80	Buone	Nintendo	GameBoy Advance	console	Rick_Roll	t	0	t	Roma	Annuncio pubblicato dopo la sua eliminazione 	2026-04-30 22:44:37.864663	t	f	\N
24	Giochi vari	1	Ottime	Nintendo	Switch	giochi	TonyPitony	f	0	t	Palermo	La body positivity mi ha distrutto il bidet\nMario Kart 8DX -> 35 euro\nPokémon Violetto -> 10 euro\nAnimal Crossing -> venduto\nTomodachi Life: Living the Dream -> 65 euro	2026-05-07 18:54:42.311202	\N	f	\N
25	Nintendo DS Fat (con scatola)	150	Buone	Nintendo	DS	console	Alex_Rob	f	0	t	Roma	Vendo Nintendo Ds Fat con scatola completo di tutto, difetto nello schermo inferiore	2026-05-07 18:55:43.749897	t	f	\N
22	Adventure Time + Jojo's Bizarre Adventure	16.79	Ottime	Nintendo	Switch	giochi	TonyPitony	t	4	t	Palermo	Giovanni dice che sei gay (non so manco io da dove sono spawnati sti giochi)	2026-05-07 18:52:35.511384	\N	t	Alex_Rob
26	PsONE	40	Buone	PlayStation	PS1	console	Alex_Rob	f	0	t	Padova	Vendo PSONE	2026-05-07 19:05:14.045907	f	f	\N
27	Playstation 2	35	Buone	PlayStation	PS2	console	Alex_Rob	t	6.99	t	Roma	Vendo PS2 perfettamente funzionante\n	2026-05-07 19:11:31.103281	f	f	\N
28	Memory card PS1	5	Ottime	PlayStation	PS1	accessori	Alex_Rob	t	5	t	Venezia	Vendo Memory Card PS1	2026-05-07 19:12:47.909118	\N	f	\N
29	Nintendo Ds Lite Grigio (con Scatola)	100	Come Nuovo	Nintendo	DS	console	LeonKennedy	t	10	t	Bari	Nintendo Ds lite silver completo di tutto, perfettamente funzionante	2026-05-07 19:20:32.827961	t	f	\N
30	Playstation3 slim	30	Buone	PlayStation	PS3	console	LeonKennedy	t	5	f	Frosinone	Ps3 slim funzionante compresa di controller 	2026-05-07 19:27:49.08752	f	f	\N
31	Xbox 360	20	Buone	Xbox	Xbox360	console	LeonKennedy	t	7.99	f	Napoli	Xbox 360 con controller	2026-05-07 19:32:20.568882	f	f	\N
33	Wiiu	50	Buone	Nintendo	WIIu	console	LeonKennedy	f	0	t	Roma	Wiiu con Paddone	2026-05-07 19:34:49.718337	f	f	\N
34	Controller PS5	50	Buone	PlayStation	PS5	accessori	LeonKennedy	t	5	f	Torino	Dualsense per PS5	2026-05-07 19:55:50.636026	\N	f	\N
15	Nintendo Switch 2	380	Come Nuovo	Nintendo	Switch2	console	Melinoe	t	23	t	Pisa	Non presenta graffi e funziona perfettamente, utilissima per sconfiggere Crono!	2026-05-07 18:27:52.448569	t	f	\N
16	Skylanders Swap Force	6.5	Ottime	Nintendo	WII	giochi	Luchettino	f	0	t	Roma	Gioco usato 3 volte, ho anche la base con due personaggi	2026-05-07 18:31:23.582184	\N	f	\N
17	Nintendo Switch Lite	125	Ottime	Nintendo	Switch	console	Luchettino	f	0	t	Roma	Lo stick sinistro è leggermente rovinato e il vetrino presenta graffi, ma si può cambiare. Funzionante	2026-05-07 18:32:47.306201	t	f	\N
18	Nintendo Switch	95	Buone	Nintendo	Switch	console	Luchettino	t	40	t	Roma	Non la comprerei	2026-05-07 18:40:11.994099	t	f	\N
\.


--
-- TOC entry 5050 (class 0 OID 18173)
-- Dependencies: 224
-- Data for Name: immagini_annuncio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.immagini_annuncio (id, url_immagine, ordine, annuncio_id) FROM stdin;
18	/static/annunci/3/WhatsApp Image 2026-04-07 at 17.25.26 (1).jpeg	0	3
19	/static/annunci/3/WhatsApp Image 2026-04-07 at 17.25.26 (2).jpeg	1	3
20	/static/annunci/3/WhatsApp Image 2026-04-07 at 17.25.26.jpeg	2	3
24	/static/annunci/5/WhatsApp Image 2026-05-01 at 11.08.39 (3).jpeg	0	5
25	/static/annunci/5/WhatsApp Image 2026-05-01 at 11.08.39 (2).jpeg	1	5
26	/static/annunci/5/WhatsApp Image 2026-05-01 at 11.08.39 (1).jpeg	2	5
27	/static/annunci/6/WhatsApp Image 2026-05-01 at 11.08.39.jpeg	0	6
28	/static/annunci/6/WhatsApp Image 2026-05-01 at 11.08.38 (1).jpeg	1	6
29	/static/annunci/6/WhatsApp Image 2026-05-01 at 11.08.38.jpeg	2	6
30	/static/annunci/6/WhatsApp Image 2026-05-01 at 11.08.37.jpeg	3	6
40	/static/annunci/15/WhatsApp Image 2026-05-07 at 18.21.35 (3).jpeg	0	15
41	/static/annunci/16/WhatsApp Image 2026-05-07 at 18.21.35 (1).jpeg	0	16
42	/static/annunci/17/WhatsApp Image 2026-05-07 at 18.21.35.jpeg	0	17
43	/static/annunci/18/WhatsApp Image 2026-05-07 at 18.38.29.jpeg	0	18
44	/static/annunci/19/WhatsApp Image 2026-05-07 at 18.38.59.jpeg	0	19
45	/static/annunci/20/WhatsApp Image 2026-05-07 at 18.45.15.jpeg	0	20
46	/static/annunci/21/WhatsApp Image 2026-05-07 at 18.49.29 (3).jpeg	0	21
47	/static/annunci/21/WhatsApp Image 2026-05-07 at 18.49.29 (1).jpeg	1	21
48	/static/annunci/21/WhatsApp Image 2026-05-07 at 18.49.29 (2).jpeg	2	21
49	/static/annunci/22/WhatsApp Image 2026-05-07 at 18.47.29.jpeg	0	22
50	/static/annunci/23/WhatsApp Image 2026-05-07 at 18.49.29.jpeg	0	23
51	/static/annunci/23/WhatsApp Image 2026-05-07 at 18.49.28 (2).jpeg	1	23
52	/static/annunci/24/WhatsApp Image 2026-05-07 at 18.51.24.jpeg	0	24
53	/static/annunci/25/WhatsApp Image 2026-05-07 at 18.49.27.jpeg	0	25
54	/static/annunci/25/WhatsApp Image 2026-05-07 at 18.49.26 (4).jpeg	1	25
55	/static/annunci/25/WhatsApp Image 2026-05-07 at 18.49.26 (3).jpeg	2	25
56	/static/annunci/25/WhatsApp Image 2026-05-07 at 18.49.27 (1).jpeg	3	25
57	/static/annunci/26/WhatsApp Image 2026-05-07 at 18.49.27 (7).jpeg	0	26
58	/static/annunci/26/WhatsApp Image 2026-05-07 at 18.49.29 (1).jpeg	1	26
59	/static/annunci/27/WhatsApp Image 2026-05-07 at 18.49.28 (1).jpeg	0	27
60	/static/annunci/27/WhatsApp Image 2026-05-07 at 18.49.28.jpeg	1	27
61	/static/annunci/28/WhatsApp Image 2026-05-07 at 18.49.27 (3).jpeg	0	28
62	/static/annunci/28/WhatsApp Image 2026-05-07 at 18.49.27 (2).jpeg	1	28
63	/static/annunci/29/WhatsApp Image 2026-05-07 at 18.49.29 (4).jpeg	0	29
64	/static/annunci/29/WhatsApp Image 2026-05-07 at 18.49.29 (6).jpeg	1	29
65	/static/annunci/29/WhatsApp Image 2026-05-07 at 18.49.30.jpeg	2	29
66	/static/annunci/30/WhatsApp Image 2026-05-07 at 18.49.26 (2).jpeg	0	30
67	/static/annunci/30/WhatsApp Image 2026-05-07 at 18.49.26 (1).jpeg	1	30
68	/static/annunci/31/WhatsApp Image 2026-05-07 at 19.31.15.jpeg	0	31
73	/static/annunci/33/WhatsApp Image 2026-05-07 at 19.31.14 (2).jpeg	0	33
74	/static/annunci/33/WhatsApp Image 2026-05-07 at 19.31.14 (1).jpeg	1	33
75	/static/annunci/34/WhatsApp Image 2026-05-07 at 19.31.14.jpeg	0	34
\.


--
-- TOC entry 5051 (class 0 OID 18189)
-- Dependencies: 225
-- Data for Name: preferiti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preferiti (nickname_utente, "idAnnuncio") FROM stdin;
Shreck	3
Zeb89	6
Rick_Roll	6
TonyPitony	17
\.


--
-- TOC entry 5048 (class 0 OID 18156)
-- Dependencies: 222
-- Data for Name: sessioni; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessioni (id_sessione, nickname_utente, data_scadenza) FROM stdin;
02d1591a-7307-46d9-925a-06ae3f024429	Rick_Roll	2026-04-24 22:09:59.746927
152809f9-04dc-4add-a510-6ff83c96b72d	Rick_Roll	2026-04-27 18:28:02.799413
85362849-58b1-4351-8b76-0f2d763b1b91	Rick_Roll	2026-05-07 17:53:55.129668
ae44ae24-55ba-4ae9-8695-4c538b275891	Rick_Roll	2026-05-07 22:49:40.520269
5011b666-a884-4304-b252-cb71f059f91c	Shreck	2026-05-08 14:36:17.336997
90f1c326-ecfe-4c3b-945f-715c6edea8c6	Zeb89	2026-05-11 10:10:18.909804
821af9ba-3c94-43f3-9374-d68de2ef716e	Rick_Roll	2026-05-12 20:48:31.32097
b707ab3e-a7fa-4607-9c13-01277724e5a7	Zeb89	2026-05-12 21:27:27.073019
df8d5142-386c-4591-9700-336f0fb05d9b	Rick_Roll	2026-05-13 08:05:28.308364
d88321e0-2b8a-45f0-a166-c5dac914ced1	Shreck	2026-05-13 16:25:51.865793
b74f1a85-63a2-42f6-a579-e5dd674e6db1	Rick_Roll	2026-05-13 17:10:02.085298
643cdc47-952e-4870-abca-2117b2384c15	James_Metallica	2026-05-13 17:56:29.203391
61a4d71e-5833-4ae0-a807-7a08d5c13689	James_Metallica	2026-05-13 18:42:02.233835
5010dee9-30af-4011-999e-bfedb7ad73a8	James_Metallica	2026-05-13 21:31:11.863225
9f4f3e7f-94e8-444d-980b-c9269367a635	Alex_Rob	2026-05-14 20:07:56.802443
328eb4af-b828-4b75-b2ed-a6e301275a0b	James_Metallica	2026-05-15 23:43:26.347764
\.


--
-- TOC entry 5045 (class 0 OID 18116)
-- Dependencies: 219
-- Data for Name: utenti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utenti (nickname, nome, cognome, nascita, sesso, citta, provincia, mail, password, foto_profilo) FROM stdin;
Rick_Roll	Rick	Astley	1966-02-08	M	Frascati	\N	rickincredibile@prova.com	$2b$12$cccsV0RZi.9q.UfmnK0vYuZvAVy6Nk/angIFJnx/S6p6/Xcv.3swa	/static/utenti/Rick_Roll/rick.jpg
Shreck	Shrek	Il magnifico	0001-01-01	M	Roma	RM	shrekilgrande@gmail.com	$2b$12$U4kdqDwtJk1ViGpDeBjU.enSHPaT4nAH.Al2J67qQ/EU4UwfGirRy	/static/utenti/Shreck/Sexy_Shrek.webp
James_Metallica	James	Hetfield	1963-08-03	M	\N	\N	james@metallica.com	$2b$12$/ikyKbE2c6KfmvORDNqGBe4PRJLcHRJkiodWSwzP0liUzjezlpZSG	/static/utenti/James_Metallica/13-James-Hetfield-1200x834.jpg.webp
Zeb89	Kennet	Caselli	0001-01-01	M	Bibbiena	\N	zeb89@acegamer.it	$2b$12$kKquMe7jxaL.BhsQpvvMVeQHWs9gC6JJyPO6rmW.Kh.FMzMhBzHem	/static/utenti/Zeb89/maxresdefault.jpg
Melinoe	Melinoe	Hadeson	1978-06-11	F	Pisa	PI	ade@hotmail.com	$2b$12$e3Sn0tw1/ZzT2/gi6.aIpu.o0hg/pCVR4oXE87q5n8vOEEH1KvXIi	/static/utenti/Melinoe/Screenshot 2026-05-07 182458.png
Luchettino	Luca	Montefusco	2004-07-11	M	Roma	RM	montefusco.2129071@studenti.uniroma1.it	$2b$12$Kxw1Qk0iXi4ASJySBf1ejOB0ceicHBKE.ng8ikMw9P9QShyTX2sJW	/static/utenti/Luchettino/kris.png
TonyPitony	Tony	Pitony	1998-07-23	M	Palermo	PL	tony@gmail.com	$2b$12$OrcALDT1S6vFq0FSir8sRuaitW16va3Db4c9S5l4kFzt1EqBWitb6	/static/utenti/TonyPitony/TONY-PITONY.jpg
LeonKennedy	Leon	Kennedy	0001-01-01	M	\N	\N	leonsexkennedy@icloud.com	$2b$12$o8aqxTlL47Z5HJYtFsr.GuDN/Uiy0ScdOcZGKISCFv16laWX1Xs.S	/static/utenti/LeonKennedy/Leon.jpg
Alex_Rob	Alessandro	Bogdan	2004-09-30	M	Roma	RM	miamail@gmail.com	$2b$12$3bZA1kPP9CkKHhpDrubdfOM//Vj/SSNDQlu9A9R25h/UAAZeRZKRS	/static/utenti/Alex_Rob/Screenshot 2026-05-07 200850.png
\.


--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 220
-- Name: annunci_idAnnuncio_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."annunci_idAnnuncio_seq"', 34, true);


--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 223
-- Name: immagini_annuncio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.immagini_annuncio_id_seq', 75, true);


--
-- TOC entry 4882 (class 2606 OID 18149)
-- Name: annunci annunci_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annunci
    ADD CONSTRAINT annunci_pkey PRIMARY KEY ("idAnnuncio");


--
-- TOC entry 4888 (class 2606 OID 18182)
-- Name: immagini_annuncio immagini_annuncio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immagini_annuncio
    ADD CONSTRAINT immagini_annuncio_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 18197)
-- Name: preferiti preferiti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferiti
    ADD CONSTRAINT preferiti_pkey PRIMARY KEY (nickname_utente, "idAnnuncio");


--
-- TOC entry 4886 (class 2606 OID 18165)
-- Name: sessioni sessioni_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessioni
    ADD CONSTRAINT sessioni_pkey PRIMARY KEY (id_sessione);


--
-- TOC entry 4880 (class 2606 OID 18128)
-- Name: utenti utenti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT utenti_pkey PRIMARY KEY (nickname);


--
-- TOC entry 4883 (class 1259 OID 18155)
-- Name: ix_annunci_idAnnuncio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ix_annunci_idAnnuncio" ON public.annunci USING btree ("idAnnuncio");


--
-- TOC entry 4889 (class 1259 OID 18188)
-- Name: ix_immagini_annuncio_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_immagini_annuncio_id ON public.immagini_annuncio USING btree (id);


--
-- TOC entry 4884 (class 1259 OID 18171)
-- Name: ix_sessioni_id_sessione; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sessioni_id_sessione ON public.sessioni USING btree (id_sessione);


--
-- TOC entry 4877 (class 1259 OID 18130)
-- Name: ix_utenti_mail; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_utenti_mail ON public.utenti USING btree (mail);


--
-- TOC entry 4878 (class 1259 OID 18129)
-- Name: ix_utenti_nickname; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_utenti_nickname ON public.utenti USING btree (nickname);


--
-- TOC entry 4892 (class 2606 OID 18210)
-- Name: annunci annunci_acquirente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annunci
    ADD CONSTRAINT annunci_acquirente_fkey FOREIGN KEY (acquirente) REFERENCES public.utenti(nickname) ON DELETE SET NULL;


--
-- TOC entry 4893 (class 2606 OID 18150)
-- Name: annunci annunci_utente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annunci
    ADD CONSTRAINT annunci_utente_fkey FOREIGN KEY (utente) REFERENCES public.utenti(nickname);


--
-- TOC entry 4895 (class 2606 OID 18183)
-- Name: immagini_annuncio immagini_annuncio_annuncio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.immagini_annuncio
    ADD CONSTRAINT immagini_annuncio_annuncio_id_fkey FOREIGN KEY (annuncio_id) REFERENCES public.annunci("idAnnuncio");


--
-- TOC entry 4896 (class 2606 OID 18203)
-- Name: preferiti preferiti_idAnnuncio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferiti
    ADD CONSTRAINT "preferiti_idAnnuncio_fkey" FOREIGN KEY ("idAnnuncio") REFERENCES public.annunci("idAnnuncio") ON DELETE CASCADE;


--
-- TOC entry 4897 (class 2606 OID 18198)
-- Name: preferiti preferiti_nickname_utente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferiti
    ADD CONSTRAINT preferiti_nickname_utente_fkey FOREIGN KEY (nickname_utente) REFERENCES public.utenti(nickname) ON DELETE CASCADE;


--
-- TOC entry 4894 (class 2606 OID 18166)
-- Name: sessioni sessioni_nickname_utente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessioni
    ADD CONSTRAINT sessioni_nickname_utente_fkey FOREIGN KEY (nickname_utente) REFERENCES public.utenti(nickname) ON DELETE CASCADE;


-- Completed on 2026-05-10 00:37:14

--
-- PostgreSQL database dump complete
--

\unrestrict svb8TBGFvQXwkNNcAQTiGFv5McLZxvJYo5mUMPYRPYrgaXVjhU6IGTezrNwtoYp

