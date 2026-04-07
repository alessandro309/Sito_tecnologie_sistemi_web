document.addEventListener("DOMContentLoaded", function () {
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
                        if (openSubmenu !== submenu) {
                            openSubmenu.classList.remove('show');
                        }
                    });
                }

                submenu.classList.toggle('show');
            }
        });
    });
});


// Cursore prezzo
const rangeMin = document.getElementById('rangeMin');
const rangeMax = document.getElementById('rangeMax');
const prezzoMinLabel = document.getElementById('prezzoMinLabel');
const prezzoMaxLabel = document.getElementById('prezzoMaxLabel');
const sliderTrack = document.getElementById('sliderTrack');
const minGap = 10;

function updateSlider() {
    let minVal = parseInt(rangeMin.value);
    let maxVal = parseInt(rangeMax.value);

    if (maxVal - minVal < minGap) {
        if (this.id === "rangeMin") {
            rangeMin.value = maxVal - minGap;
            minVal = parseInt(rangeMin.value);
        } else {
            rangeMax.value = minVal + minGap;
            maxVal = parseInt(rangeMax.value);
        }
    }

    prezzoMinLabel.textContent = "€ " + minVal;
    prezzoMaxLabel.textContent = "€ " + maxVal;

    const percentMin = (minVal / rangeMin.max) * 100;
    const percentMax = (maxVal / rangeMax.max) * 100;

    sliderTrack.style.left = percentMin + "%";
    sliderTrack.style.width = (percentMax - percentMin) + "%";
}

if (rangeMin && rangeMax) {
    rangeMin.addEventListener('input', updateSlider);
    rangeMax.addEventListener('input', updateSlider);
    updateSlider();
}


// Azzera filtri
const btnAzzera = document.getElementById('btnAzzera');
const formFiltri = document.getElementById('formFiltri');
const badgeFiltri = document.getElementById('badgeFiltri');

if (btnAzzera && formFiltri) {
    btnAzzera.addEventListener('click', function () {
        formFiltri.reset();

        if (rangeMin && rangeMax) {
            rangeMin.value = 0;
            rangeMax.value = 1000;

            if (typeof updateSlider === 'function') {
                updateSlider();
            }
        }

        if (badgeFiltri) {
            badgeFiltri.textContent = "0";
            badgeFiltri.classList.add('d-none');
        }

        if (map) {
            map.setView([41.9032, 12.5113], 13);
        }
    });
}


// Mappa
let map;

function inizializzaMappa() {
    if (map) return;

    map = L.map('mappaContainer').setView([41.9032, 12.5113], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const leafletContainer = document.querySelector('.leaflet-container');

    if (leafletContainer) {
        leafletContainer.style.filter = "brightness(0.8) contrast(1.2) invert(100%) hue-rotate(180deg) saturate(0.5)";
    }
}

const modalFiltri = document.getElementById('modalFiltri');

if (modalFiltri) {
    modalFiltri.addEventListener('shown.bs.modal', function () {
        if (!map) {
            inizializzaMappa();
        } else {
            map.invalidateSize();
        }
    });
}


// Applica filtri e contatore
if (formFiltri) {
    formFiltri.addEventListener('submit', function (event) {
        event.preventDefault();

        let conteggioFiltri = 0;

        const consoleSelect = document.getElementById('console');
        if (consoleSelect && consoleSelect.value !== "") conteggioFiltri++;

        const condizioniSpuntate = document.querySelectorAll('#modalFiltri input[type="checkbox"][id^="condiz"]:checked');
        if (condizioniSpuntate.length > 0) conteggioFiltri++;

        if (rangeMin && rangeMax) {
            const minVal = parseInt(rangeMin.value);
            const maxVal = parseInt(rangeMax.value);

            if (minVal > 0 || maxVal < 1000) conteggioFiltri++;
        }

        const spedizioneCheck = document.getElementById('spedizione');
        if (spedizioneCheck && spedizioneCheck.checked) conteggioFiltri++;

        if (map) {
            const centroMappa = map.getCenter();

            if (
                centroMappa.lat.toFixed(4) !== "41.9032" ||
                centroMappa.lng.toFixed(4) !== "12.5113"
            ) {
                conteggioFiltri++;
            }
        }

        if (badgeFiltri) {
            if (conteggioFiltri > 0) {
                badgeFiltri.textContent = conteggioFiltri;
                badgeFiltri.classList.remove('d-none');
            } else {
                badgeFiltri.textContent = "0";
                badgeFiltri.classList.add('d-none');
            }
        }

        const modalInstance = bootstrap.Modal.getInstance(
            document.getElementById('modalFiltri')
        );

        if (modalInstance) {
            modalInstance.hide();
        }
    });
}