// Pantalla: Destino de residuos.

// Destinos obtenidos desde Supabase
let destinosResiduosDB = [];
let destinoResiduoSeleccionado = null;

// Vista: Destino de residuos
V.res = () => {
    const opciones = destinosResiduosDB.length
        ? destinosResiduosDB.map(d => `
            <button
                class="opt ${destinoResiduoSeleccionado == d.id ? 'on' : ''}"
                data-d="${d.id}"
            >
                <span class="ic ${d.aprovechado ? 'v' : 'r'}">
                    ${i(d.aprovechado ? 'leaf' : 'trash')}
                </span>

                <span class="opt-texto">
                    <b>${d.nombre}</b><br>
                    <small class="mut">
                        ${d.descripcion || 'Sin descripción'}
                    </small>
                </span>

                ${destinoResiduoSeleccionado == d.id ? i('check') : ''}
            </button>
        `).join('')
        : `<p class="mut">Cargando destinos disponibles...</p>`;

    return `
        <div class="card">

            <div class="res warn res-tope">
                ${i('trash')}
                <span>
                    Residuo por clasificar:
                    <b>${merma || 0} kg</b>
                </span>
            </div>

            <div class="opts">
                ${opciones}
            </div>

            <div class="acciones-fin">
                <button class="btn pri" id="sv">
                    ${i('check')}Guardar destino
                </button>
            </div>

        </div>
    `;
};


// Obtener destinos reales desde FastAPI / Supabase
async function cargarDestinosResiduos() {
    try {
        const respuesta = await fetch(
            'http://127.0.0.1:8000/api/destinos-residuo'
        );

        if (!respuesta.ok) {
            throw new Error('No se pudieron cargar los destinos');
        }

        destinosResiduosDB = await respuesta.json();

        // Seleccionar automáticamente el primero si todavía no hay selección
        if (
            destinosResiduosDB.length > 0 &&
            destinoResiduoSeleccionado === null
        ) {
            destinoResiduoSeleccionado = destinosResiduosDB[0].id;
        }

        go('res');

    } catch (error) {
        console.error(error);
        toast('Error al cargar los destinos de residuos');
    }
}


// Eventos: elegir destino y guardar
B.res = () => {

    // Cargar destinos desde Supabase la primera vez
    if (destinosResiduosDB.length === 0) {
        cargarDestinosResiduos();
    }

    $('#m').onclick = e => {

        const d = e.target.closest('[data-d]');

        if (d) {
            destinoResiduoSeleccionado = +d.dataset.d;
            go('res');
        }
    };


    const botonGuardar = $('#sv');

    if (botonGuardar) {

        botonGuardar.onclick = () => {

            if (!destinoResiduoSeleccionado) {
                return toast('Selecciona un destino para el residuo');
            }

            const destino = destinosResiduosDB.find(
                d => d.id === destinoResiduoSeleccionado
            );

            // Dejamos disponible el destino para Producción
            window.destinoProduccion = destino;

            toast(
                'Destino seleccionado: ' +
                (destino?.nombre || 'Destino')
            );

            // Regresar a Producción
            go('prod');
        };
    }
};