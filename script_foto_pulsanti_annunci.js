function cambiaImmagine(elementoCliccato) {

    document.getElementById('immaginePrincipale').src = elementoCliccato.src;

    document.querySelector('.attiva').classList.remove('attiva');

    elementoCliccato.classList.add('attiva');
}


function successiva(){
    const immagine_attuale = document.querySelector(".thumbnail-img.attiva");
    if (!immagine_attuale) return; //non ci sono immagini

    let imm_successiva = immagine_attuale.nextElementSibling;

    if (!imm_successiva)
        imm_successiva = document.getElementById("contenitoreMiniature").firstElementChild;

    if(imm_successiva)
        imm_successiva.click();
}

function precedente(){
    const immagine_attuale = document.querySelector(".thumbnail-img.attiva");
    if (!immagine_attuale) return;

    let imm_precedente = immagine_attuale.previousElementSibling;

    if (!imm_precedente)
        imm_precedente = document.getElementById("contenitoreMiniature").lastElementChild;
    if(imm_precedente)
        imm_precedente.click()
}

function togglePreferito(bottone) {
    const icona = bottone.querySelector('i');
            
    if (icona.classList.contains('bi-heart')) {
        icona.classList.remove('bi-heart');
        icona.classList.add('bi-heart-fill');
        bottone.classList.remove('btn-outline-danger');
        bottone.classList.add('btn-danger');
    } else {
        icona.classList.remove('bi-heart-fill');
        icona.classList.add('bi-heart');
        bottone.classList.remove('btn-danger');
        bottone.classList.add('btn-outline-danger');
    }
}