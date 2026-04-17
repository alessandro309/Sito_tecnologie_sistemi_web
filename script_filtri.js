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

    // --- MAPPA ---
    let map;
    function inizializzaMappa() {
        if (map || !document.getElementById('mappaContainer')) return;
        map = L.map('mappaContainer').setView([41.9032, 12.5113], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        const leafletContainer = document.querySelector('.leaflet-container');
        if (leafletContainer) {
            leafletContainer.style.filter = "brightness(0.8) contrast(1.2) invert(100%) hue-rotate(180deg) saturate(0.5)";
        }
    }

    const modalFiltriEl = document.getElementById('modalFiltri');
    if (modalFiltriEl) {
        modalFiltriEl.addEventListener('shown.bs.modal', function () {
            if (!map) inizializzaMappa();
            else map.invalidateSize();
        });
    }

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