document.addEventListener("DOMContentLoaded", function () {
    // --- GESTIONE MENU DROPDOWN ---
    let dropdownSubmenus = document.querySelectorAll('.dropdown-submenu > a');
    dropdownSubmenus.forEach(function (submenuToggle) {
        submenuToggle.addEventListener('click', function (e) {
            if (window.innerWidth < 992) {
                e.preventDefault();
                e.stopPropagation();
                let submenu = this.nextElementSibling;
                let parent = this.closest('.dropdown-menu');
                if (parent) {
                    parent.querySelectorAll('.submenu-retro.show').forEach(function (openSubmenu) {
                        if (openSubmenu !== submenu) openSubmenu.classList.remove('show');
                    });
                }
                submenu.classList.toggle('show');
            }
        });
    });

    // --- CURSORE PREZZO ---
    const rangeMin = document.getElementById('rangeMin');
    const rangeMax = document.getElementById('rangeMax');
    const prezzoMinLabel = document.getElementById('prezzoMinLabel');
    const prezzoMaxLabel = document.getElementById('prezzoMaxLabel');
    const sliderTrack = document.getElementById('sliderTrack');
    const minGap = 10;

    function updateSlider() {
        if (!rangeMin || !rangeMax) return;
        let minVal = parseInt(rangeMin.value);
        let maxVal = parseInt(rangeMax.value);

        if (maxVal - minVal < minGap) {
            if (this && this.id === "rangeMin") {
                rangeMin.value = maxVal - minGap;
                minVal = parseInt(rangeMin.value);
            } else if (this) {
                rangeMax.value = minVal + minGap;
                maxVal = parseInt(rangeMax.value);
            }
        }

        if(prezzoMinLabel) prezzoMinLabel.textContent = "€ " + minVal;
        if(prezzoMaxLabel) prezzoMaxLabel.textContent = "€ " + maxVal;

        if(sliderTrack) {
            const percentMin = (minVal / rangeMin.max) * 100;
            const percentMax = (maxVal / rangeMax.max) * 100;
            sliderTrack.style.left = percentMin + "%";
            sliderTrack.style.width = (percentMax - percentMin) + "%";
        }
    }

    if (rangeMin && rangeMax) {
        rangeMin.addEventListener('input', updateSlider);
        rangeMax.addEventListener('input', updateSlider);
        updateSlider();
    }

    // --- AZZERA FILTRI ---
    const btnAzzera = document.getElementById('btnAzzera');
    const formFiltri = document.getElementById('formFiltri');
    const badgeFiltri = document.getElementById('badgeFiltri');

    if (btnAzzera && formFiltri) {
        btnAzzera.addEventListener('click', function () {
            formFiltri.reset();
            if (rangeMin && rangeMax) {
                rangeMin.value = 0;
                rangeMax.value = 1000;
                updateSlider();
            }
            if (badgeFiltri) {
                badgeFiltri.textContent = "0";
                badgeFiltri.classList.add('d-none');
            }
            if (map) map.setView([41.9032, 12.5113], 13);
        });
    }

    document.addEventListener("DOMContentLoaded", function() {
    
        const selectZona = document.getElementById('filtroZonaSeleziona');
        const boxRegione = document.getElementById('boxInputRegione');
        const boxCitta = document.getElementById('boxInputCitta');
        const inputRegione = document.getElementById('inputRegione');
        const inputCitta = document.getElementById('inputCitta');

        if (selectZona) {
            selectZona.addEventListener('change', function() {
                // Nascondiamo tutto e svuotiamo i campi testuali
                boxRegione.classList.add('d-none');
                boxCitta.classList.add('d-none');
                inputRegione.value = '';
                inputCitta.value = '';

                // Mostriamo solo quello selezionato
                if (this.value === 'regione') {
                    boxRegione.classList.remove('d-none');
                    inputRegione.focus(); // Mette subito il cursore per farti scrivere
                } else if (this.value === 'citta') {
                    boxCitta.classList.remove('d-none');
                    inputCitta.focus();
                }
            });
        }

        const arrayRegioni = [
            "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", 
            "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", 
            "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", 
            "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
        ];

        const arrayCitta = [
            "Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna", 
            "Firenze", "Bari", "Catania", "Venezia", "Verona", "Messina", "Padova", 
            "Trieste", "Brescia", "Parma", "Taranto", "Prato", "Modena", "Rovigo", 
            "Rimini", "Reggio Emilia", "Perugia", "Livorno", "Ravenna", "Cagliari"
        ]; // Puoi aggiungerne quante ne vuoi!

        function attivaAutocompletamento(inputId, listaId, database) {
            const campoInput = document.getElementById(inputId);
            const contenitoreLista = document.getElementById(listaId);

            if(!campoInput || !contenitoreLista) return;

            // Cosa succede ogni volta che digiti una lettera
            campoInput.addEventListener('input', function() {
                const testoScritto = this.value.toLowerCase();
                contenitoreLista.innerHTML = ''; // Pulisce i vecchi suggerimenti
                
                // Se la casella è vuota, nascondi la tendina
                if (!testoScritto) {
                    contenitoreLista.classList.add('d-none');
                    return;
                }

                // Filtra l'array: trova tutte le parole che iniziano con le lettere digitate
                const risultatiTrovati = database.filter(elemento => 
                    elemento.toLowerCase().startsWith(testoScritto)
                );

                // Se c'è almeno un risultato, creiamo i bottoncini
                if (risultatiTrovati.length > 0) {
                    contenitoreLista.classList.remove('d-none');
                    
                    risultatiTrovati.forEach(risultato => {
                        const riga = document.createElement('li');
                        // Applichiamo le classi di Bootstrap per farle stile Retro Dark
                        riga.className = 'list-group-item list-group-item-action bg-black text-white border-secondary';
                        riga.style.cursor = 'pointer'; // Cambia la freccina nel dito che clicca
                        riga.textContent = risultato;
                        
                        // Cosa succede se clicco su un suggerimento?
                        riga.addEventListener('click', function() {
                            campoInput.value = risultato; // Scrive la città nell'input
                            contenitoreLista.classList.add('d-none'); // Nasconde la tendina
                        });
                        
                        contenitoreLista.appendChild(riga);
                    });
                } else {
                    contenitoreLista.classList.add('d-none');
                }
            });

            // Sicurezza extra: nascondi la tendina se clicchi fuori
            document.addEventListener('click', function(e) {
                if (e.target !== campoInput && e.target !== contenitoreLista) {
                    contenitoreLista.classList.add('d-none');
                }
            });
        }

        // Accendiamo i motori passando gli ID HTML e gli array di dati
        attivaAutocompletamento('inputRegione', 'suggerimentiRegione', arrayRegioni);
        attivaAutocompletamento('inputCitta', 'suggerimentiCitta', arrayCitta);

    });

    // --- LOGICA CORE: CARICAMENTO, SINCRONIZZAZIONE E RICERCA ---

    // 1. Funzione per riempire la barra di ricerca con i valori presenti nell'URL
    function popolaBarraRicercaDallURL() {
        const params = new URLSearchParams(window.location.search);
        const inputRicerca = document.querySelector('input[name="ricerca"]');
        const inputLuogo = document.querySelector('input[name="luogo"]');

        if (inputRicerca && params.has("ricerca")) {
            inputRicerca.value = params.get("ricerca");
        }
        if (inputLuogo && params.has("luogo")) {
            inputLuogo.value = params.get("luogo");
        }
    }

    // 2. Funzione per caricare gli annunci (solo in mostra_annunci.html)
    async function caricaAnnunci(urlParams) {
        const contenitore = document.getElementById("contenitore-annunci");
        const contatore = document.getElementById("contatore-annunci");
        if (!contenitore) return;

        contenitore.innerHTML = '<div class="col-12 text-center text-white"><div class="spinner-border text-danger" role="status"></div><p class="mt-2 font-monospace">Ricerca annunci...</p></div>';

        try {
            const response = await fetch(`http://127.0.0.1:8000/annunci/ricerca/?${urlParams.toString()}`);
            if (!response.ok) throw new Error("Errore API");
            const annunci = await response.json();
            
            if (contatore) contatore.innerText = `Trovati ${annunci.length} annunci`;
            contenitore.innerHTML = "";

            if (annunci.length === 0) {
                contenitore.innerHTML = '<div class="col-12 text-center text-secondary py-5"><h4 class="font-monospace">Nessun risultato</h4></div>';
                return;
            }

            annunci.forEach(annuncio => {
                const immagineUrl = annuncio.immagini?.length > 0 ? `http://127.0.0.1:8000${annuncio.immagini[0].url_immagine}` : "https://placehold.co/600x400/1a1a1a/FFF?text=No+Foto";
                const dataPubblicazione = new Date(annuncio.data_pubblicazione).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
                
                // L'ID dell'annuncio preso dal database
                const id = annuncio.idAnnuncio;

                contenitore.innerHTML += `
                    <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                        <div class="card card-annuncio bg-black border-secondary h-100 text-white shadow overflow-hidden">
                            
                            <div class="position-relative">
                                <a href="pagina_annuncio.html?id=${id}">
                                    <img src="${immagineUrl}" class="card-img-top img-annuncio" alt="${annuncio.nome}">
                                </a>
                                
                                <button class="btn btn-salva position-absolute top-0 end-0 m-2 rounded-circle border-secondary d-flex align-items-center justify-content-center p-0" style="width: 40px; height: 40px; z-index: 10;" onclick="toggleSalva(this)">
                                    <i class="bi bi-floppy text-danger fs-5 icona-vuota"></i>
                                    <i class="bi bi-floppy-fill text-danger fs-5 icona-piena d-none"></i>
                                </button>
                            </div>
                            
                            <div class="card-body d-flex flex-column p-3">
                                <a href="pagina_annuncio.html?id=${id}" class="text-decoration-none">
                                    <h5 class="card-title font-monospace text-uppercase mb-1 fs-6 fw-bold text-white">${annuncio.nome}</h5>
                                </a>
                                
                                <p class="text-secondary small font-monospace mb-2">Condizioni: ${annuncio.condizione.replace(/_/g, ' ')}</p>
                                <h4 class="text-danger fw-bold font-monospace mb-3 mt-auto">€ ${annuncio.prezzo.toFixed(2)}</h4>
                                <div class="d-flex justify-content-between align-items-center font-monospace small text-secondary">
                                    <span><i class="bi bi-geo-alt"></i> ${annuncio.posizione}</span>
                                    <span>${dataPubblicazione}</span>
                                </div>
                            </div>

                        </div>
                    </div>`;
            });
        } catch (err) {
            contenitore.innerHTML = '<p class="text-danger text-center">Errore di connessione al server.</p>';
        }
    }

    // ESECUZIONE AL CARICAMENTO
    popolaBarraRicercaDallURL();
    const currentParams = new URLSearchParams(window.location.search);
    if (document.getElementById("contenitore-annunci")) {
        caricaAnnunci(currentParams);
    }

    // 3. Gestione Form Filtri (Modal)
    if (formFiltri) {
        formFiltri.addEventListener('submit', function (e) {
            e.preventDefault();
            const params = new URLSearchParams();

            // Importante: Leggi cosa c'è scritto nella barra di ricerca PRIMA di inviare i filtri
            const inputRicerca = document.querySelector('input[name="ricerca"]');
            const inputLuogo = document.querySelector('input[name="luogo"]');
            if (inputRicerca && inputRicerca.value) params.set("ricerca", inputRicerca.value);
            if (inputLuogo && inputLuogo.value) params.set("luogo", inputLuogo.value);

            // Aggiungi i filtri del modal
            const consoleSelect = document.getElementById("console");
            if (consoleSelect?.value) params.set("console", consoleSelect.value);

            document.querySelectorAll('input[id^="condiz"]:checked').forEach(cb => params.append("condizioni", cb.value));
            
            if (rangeMin) params.set("prezzo_min", rangeMin.value);
            if (rangeMax) params.set("prezzo_max", rangeMax.value);

            const spedizione = document.getElementById("spedizione");
            if (spedizione?.checked) params.set("spedizione", "true");

            // Redirect o Aggiornamento
            const isPaginaAnnunci = window.location.pathname.includes('mostra_annunci.html');
            if (isPaginaAnnunci) {
                window.history.pushState({}, '', '?' + params.toString());
                caricaAnnunci(params);
                bootstrap.Modal.getInstance(modalFiltriEl)?.hide();
            } else {
                window.location.href = 'mostra_annunci.html?' + params.toString();
            }
        });
    }

    // 4. Gestione Barra di Ricerca Superiore
    const formRicercaTop = document.querySelector('.search_bar');
    if (formRicercaTop) {
        formRicercaTop.addEventListener('submit', function (e) {
            e.preventDefault();
            const inputRicerca = formRicercaTop.querySelector('input[name="ricerca"]');
            const inputLuogo = formRicercaTop.querySelector('input[name="luogo"]');
            
            const params = new URLSearchParams(window.location.search); // Mantieni i filtri esistenti se presenti
            
            if (inputRicerca?.value) params.set("ricerca", inputRicerca.value);
            else params.delete("ricerca");
            
            if (inputLuogo?.value) params.set("luogo", inputLuogo.value);
            else params.delete("luogo");

            const isPaginaAnnunci = window.location.pathname.includes('mostra_annunci.html');
            if (isPaginaAnnunci) {
                window.history.pushState({}, '', '?' + params.toString());
                caricaAnnunci(params);
            } else {
                window.location.href = 'mostra_annunci.html?' + params.toString();
            }
        });
    }
});