// ==========================================
// REUSABEER - PRODUCTOS POR VENCER
// FastAPI + PostgreSQL
// ==========================================

const VENC_API_URL = 'http://127.0.0.1:8000';

let lotesVencimiento = [];
let tabVencimiento = 0;


// ==========================================
// CALCULAR DÍAS RESTANTES
// ==========================================

function diasParaVencer(fecha) {

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const vencimiento =
        new Date(`${fecha}T00:00:00`);

    const diferencia =
        vencimiento - hoy;

    return Math.ceil(
        diferencia / 86400000
    );
}


// ==========================================
// CARGAR DATOS
// ==========================================

async function cargarVencimientosAPI() {

    const respuesta =
        await fetch(
            `${VENC_API_URL}/api/lotes`
        );


    if (!respuesta.ok) {

        throw new Error(
            'No fue posible cargar los vencimientos'
        );
    }


    lotesVencimiento =
        await respuesta.json();
}


// ==========================================
// VISTA
// ==========================================

V.venc = () => `

    <div class="tabs">

        <button
            class="btn"
            data-t="0"
            id="tabProximos"
        >
            Próximos a vencer
        </button>

        <button
            class="btn"
            data-t="1"
            id="tabVencidos"
        >
            Vencidos
        </button>

        <button
            class="btn"
            data-t="2"
            id="tabTodos"
        >
            Todos
        </button>

    </div>


    <div
        class="card"
        id="listaVencimientos"
    >

        <p class="mut">
            Cargando productos...
        </p>

    </div>
`;


// ==========================================
// DIBUJAR LISTADO
// ==========================================

function dibujarVencimientos() {

    const contenedor =
        $('#listaVencimientos');


    if (!contenedor) {
        return;
    }


    const proximos =
        lotesVencimiento.filter(l => {

            const dias =
                diasParaVencer(
                    l.fecha_vencimiento
                );

            return (
                dias >= 0 &&
                dias <= 7
            );
        });


    const vencidos =
        lotesVencimiento.filter(l => {

            return (
                diasParaVencer(
                    l.fecha_vencimiento
                ) < 0
            );
        });


    let lista;


    if (tabVencimiento === 0) {

        lista = proximos;

    }

    else if (tabVencimiento === 1) {

        lista = vencidos;

    }

    else {

        lista = [...lotesVencimiento];
    }


    lista.sort((a, b) => {

        return (
            diasParaVencer(
                a.fecha_vencimiento
            )
            -
            diasParaVencer(
                b.fecha_vencimiento
            )
        );
    });


    // Actualizar contadores
    $('#tabProximos').innerHTML =
        `Próximos a vencer (${proximos.length})`;

    $('#tabVencidos').innerHTML =
        `Vencidos (${vencidos.length})`;

    $('#tabTodos').innerHTML =
        `Todos (${lotesVencimiento.length})`;


    // Pestaña activa
    document
        .querySelectorAll('[data-t]')
        .forEach(b => {

            b.classList.remove('on');
        });


    const activo =
        document.querySelector(
            `[data-t="${tabVencimiento}"]`
        );


    if (activo) {
        activo.classList.add('on');
    }


    if (!lista.length) {

        contenedor.innerHTML = `

            <p class="mut">
                Nada por aquí.
                Todo el inventario está al día.
            </p>
        `;

        return;
    }


    contenedor.innerHTML =
        lista.map(l => {

            const dias =
                diasParaVencer(
                    l.fecha_vencimiento
                );


            let textoEstado;
            let color;


            if (dias < 0) {

                textoEstado =
                    'Vencido';

                color =
                    'bad';

            }

            else if (dias === 0) {

                textoEstado =
                    'Vence hoy';

                color =
                    'bad';

            }

            else if (dias <= 3) {

                textoEstado =
                    'Urgente';

                color =
                    'warn';

            }

            else if (dias <= 7) {

                textoEstado =
                    'Próximo a vencer';

                color =
                    'warn';

            }

            else {

                textoEstado =
                    'Al día';

                color =
                    'ok';
            }


            return `

                <div class="row">

                    <div
                        class="days c-${color}"
                    >

                        ${
                            dias < 0
                                ? '—'
                                : dias
                        }

                        <small>

                            ${
                                dias < 0
                                    ? 'vencido'
                                    : 'días'
                            }

                        </small>

                    </div>


                    <div class="gr">

                        <b>
                            ${l.producto}
                        </b>

                        <small class="mut">

                            ${l.numero_lote}

                            ·

                            ${fmt(l.cantidad)}
                            botes

                            · vence

                            ${fd(
                                l.fecha_vencimiento
                            )}

                        </small>

                    </div>


                    <span
                        class="chip c-${color}"
                    >
                        ${textoEstado}
                    </span>


                    <button
                        class="btn sm dk"
                        data-lote="${l.id}"
                    >
                        Gestionar
                    </button>

                </div>
            `;

        }).join('');
}


// ==========================================
// EVENTOS
// ==========================================

B.venc = async () => {

    try {

        await cargarVencimientosAPI();

        dibujarVencimientos();

    }

    catch (error) {

        console.error(error);

        $('#listaVencimientos')
            .innerHTML = `

                <p class="mut">

                    No fue posible conectar
                    con el backend.

                </p>
            `;

        toast(
            'No se pudieron cargar los vencimientos'
        );

        return;
    }


    // ======================================
    // PESTAÑAS
    // ======================================

    document
        .querySelectorAll('[data-t]')
        .forEach(boton => {

            boton.onclick = () => {

                tabVencimiento =
                    Number(
                        boton.dataset.t
                    );

                dibujarVencimientos();
            };
        });


    // ======================================
    // GESTIONAR LOTE
    // ======================================

    $('#listaVencimientos')
        .onclick = e => {

            const boton =
                e.target.closest(
                    '[data-lote]'
                );


            if (!boton) {
                return;
            }


            go('inv');

            toast(
                'Puedes ajustar el lote desde Inventario'
            );
        };
};