// ==========================================
// REUSABEER - PRODUCCIÓN Y MERMAS
// Conectado con FastAPI + PostgreSQL
// ==========================================

const PROD_API_URL = 'http://127.0.0.1:8000';

let productosProduccion = [];
let usuariosProduccion = [];
let destinosProduccion = [];


// ==========================================
// VISTA
// ==========================================

V.prod = () => `

<div class="card">

    <div class="f">

        <label>
            Producto final

            <select id="pp">
                <option value="">Cargando productos...</option>
            </select>
        </label>


        <label>
            Operario

            <select id="po">
                <option value="">Cargando usuarios...</option>
            </select>
        </label>


        <label>
            ${i('flask')}
            Materia prima usada (kg)

            <input
                id="pu"
                type="number"
                min="0"
                value="0"
            >
        </label>


        <label>
            ${i('drop')}
            Producto obtenido (L)

            <input
                id="pf"
                type="number"
                min="0"
                value="0"
            >
        </label>


        <label>
            Fecha

            <input
                id="pfecha"
                type="date"
                value="${new Date().toISOString().slice(0, 10)}"
            >
        </label>


        <label>
            Observaciones

            <input
                id="pobs"
                placeholder="Observaciones del proceso"
            >
        </label>

    </div>


    <div id="pr"></div>


    <!-- DESTINO DEL RESIDUO -->
    <div
        id="destinoBloque"
        style="display:none; margin-top:16px;"
    >

        <div class="res warn">

            ${i('alert')}

            <span>
                Hay desperdicio. Debes asignar un destino antes de guardar.
            </span>

        </div>


        <div class="f" style="margin-top:16px;">

            <label>
                Destino del residuo

                <select id="pdest">
                    <option value="">Seleccionar destino</option>
                </select>
            </label>


            <label>
                Tipo de residuo

                <input
                    id="ptipo"
                    value="Merma de producción"
                >
            </label>


            <label>
                Observaciones del residuo

                <input
                    id="probs"
                    placeholder="Ej. material enviado a reciclaje"
                >
            </label>

        </div>

    </div>


    <div style="margin-top:20px;">

        <button
            class="btn pri"
            id="guardarProd"
        >
            Guardar producción
        </button>

    </div>

</div>


<div class="card" style="margin-top:20px;">

    <h3>Últimos registros</h3>

    <div
        id="histProd"
        style="margin-top:12px;"
    >

        <p class="mut">
            Cargando registros...
        </p>

    </div>

</div>
`;


// ==========================================
// CARGAR CATÁLOGOS
// ==========================================

async function cargarDatosProduccion() {

    const [
        respuestaProductos,
        respuestaUsuarios,
        respuestaDestinos
    ] = await Promise.all([

        apiFetch(`${PROD_API_URL}/api/productos`),

        apiFetch(`${PROD_API_URL}/api/usuarios`),

        apiFetch(`${PROD_API_URL}/api/destinos-residuo`)
    ]);


    if (
        !respuestaProductos.ok ||
        !respuestaUsuarios.ok ||
        !respuestaDestinos.ok
    ) {

        throw new Error(
            'No fue posible cargar los datos de producción'
        );
    }


    productosProduccion =
        await respuestaProductos.json();

    usuariosProduccion =
        await respuestaUsuarios.json();

    destinosProduccion =
        await respuestaDestinos.json();


    // Productos
    $('#pp').innerHTML =
        productosProduccion.map(p => `

            <option value="${p.id}">
                ${p.nombre}
            </option>

        `).join('');


    // Usuarios
    $('#po').innerHTML =
        usuariosProduccion.map(u => `

            <option value="${u.id}">
                ${u.nombre}
            </option>

        `).join('');


    // Destinos
    $('#pdest').innerHTML = `

        <option value="">
            Seleccionar destino
        </option>

        ${destinosProduccion.map(d => `

            <option value="${d.id}">
                ${d.nombre}
            </option>

        `).join('')}
    `;
}


// ==========================================
// CALCULAR EFICIENCIA Y MERMA
// ==========================================

function calcProd() {

    const u =
        Number($('#pu').value);

    const f =
        Number($('#pf').value);


    prodRes = {
        u,
        f
    };


    const desperdicio =
        u > 0
            ? Math.max(0, u - f)
            : 0;


    const eficiencia =
        u > 0
            ? (f / u) * 100
            : 0;


    merma = desperdicio;


    // Si todavía no hay materia prima
    if (u <= 0) {

        $('#pr').innerHTML = `

            <div class="res warn">

                ${i('alert')}

                <span>
                    Ingresa la materia prima usada
                    para calcular la eficiencia.
                </span>

            </div>
        `;


        $('#destinoBloque').style.display =
            'none';

        return;
    }


    const porcentajeDesperdicio =
        100 - eficiencia;


    $('#pr').innerHTML = `

        <div class="res ok">

            ${i('trend')}

            <div>

                <span class="num">
                    ${eficiencia.toFixed(1)}%
                </span>

                <br>

                <small class="mut">
                    eficiencia del proceso
                </small>

            </div>


            <div>

                <span class="num txt-bad">
                    ${desperdicio.toFixed(2)}
                </span>

                <br>

                <small class="mut">
                    desperdicio
                    (${porcentajeDesperdicio.toFixed(1)}%)
                </small>

            </div>


            <span
                class="chip ${
                    eficiencia >= 85
                        ? 'c-ok'
                        : 'c-bad'
                } push"
            >

                ${
                    eficiencia >= 85
                        ? 'Aprobado'
                        : 'Bajo la meta de 85%'
                }

            </span>

        </div>
    `;


    // Mostrar destino solamente si existe merma
    $('#destinoBloque').style.display =
        desperdicio > 0
            ? 'block'
            : 'none';
}


// ==========================================
// CARGAR HISTORIAL
// ==========================================

async function cargarHistorialProduccion() {

    const respuesta =
        await apiFetch(
            `${PROD_API_URL}/api/producciones`
        );


    if (!respuesta.ok) {

        $('#histProd').innerHTML = `

            <p class="mut">
                No fue posible cargar el historial.
            </p>
        `;

        return;
    }


    const producciones =
        await respuesta.json();


    if (!producciones.length) {

        $('#histProd').innerHTML = `

            <p class="mut">
                No hay registros de producción todavía.
            </p>
        `;

        return;
    }


    $('#histProd').innerHTML =
        producciones
            .slice(0, 5)
            .map(p => `

                <div class="row">

                    <div class="gr">

                        <b>
                            ${p.producto}
                        </b>

                        <small class="mut">

                            ${fd(p.fecha)}

                            · Producto final:
                            ${Number(
                                p.producto_final
                            ).toFixed(2)}

                            · Operario:
                            ${p.usuario}

                        </small>

                    </div>


                    <span class="chip c-ok">

                        ${Number(
                            p.eficiencia
                        ).toFixed(1)}%

                    </span>


                    <span class="chip ${
                        Number(p.desperdicio) > 0
                            ? 'c-bad'
                            : 'c-ok'
                    }">

                        Merma:
                        ${Number(
                            p.desperdicio || 0
                        ).toFixed(2)}

                    </span>

                </div>

            `).join('');
}


// ==========================================
// GUARDAR PRODUCCIÓN
// ==========================================

async function guardarProduccion() {

    const material =
        Number($('#pu').value);


    const productoFinal =
        Number($('#pf').value);


    if (material <= 0) {

        return toast(
            'Ingresa la materia prima utilizada'
        );
    }


    if (productoFinal < 0) {

        return toast(
            'El producto final no puede ser negativo'
        );
    }


    const desperdicio =
        Math.max(
            0,
            material - productoFinal
        );


    // Si existe merma, debe elegir destino
    if (
        desperdicio > 0 &&
        !$('#pdest').value
    ) {

        return toast(
            'Debes seleccionar un destino para el residuo'
        );
    }


    const datos = {

        producto_id:
            Number($('#pp').value),

        material_utilizado:
            material,

        producto_final:
            productoFinal,

        usuario_id:
            Number($('#po').value),

        fecha:
            $('#pfecha').value,

        observaciones:
            $('#pobs').value.trim()
            || null,

        destino_id:
            desperdicio > 0
                ? Number($('#pdest').value)
                : null,

        tipo_residuo:
            desperdicio > 0
                ? $('#ptipo').value.trim()
                : null,

        observaciones_residuo:
            desperdicio > 0
                ? $('#probs').value.trim()
                : null
    };


    try {

        const respuesta =
            await apiFetch(

                `${PROD_API_URL}/api/producciones`,

                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.detail ||
                'No fue posible guardar la producción'
            );
        }


        toast(
            'Producción registrada correctamente'
        );


        // Limpiar formulario
        $('#pu').value = 0;
        $('#pf').value = 0;
        $('#pobs').value = '';
        $('#probs').value = '';
        $('#pdest').value = '';


        calcProd();


        // Actualizar historial
        await cargarHistorialProduccion();

    }

    catch (error) {

        console.error(error);

        alert(error.message);
    }
}


// ==========================================
// EVENTOS
// ==========================================

B.prod = async () => {

    try {

        await cargarDatosProduccion();

        await cargarHistorialProduccion();

    }

    catch (error) {

        console.error(error);

        toast(
            'No fue posible conectar Producción con el backend'
        );
    }


    ['#pu', '#pf']
        .forEach(selector => {

            $(selector).oninput =
                calcProd;
        });


    $('#guardarProd').onclick =
        guardarProduccion;


    calcProd();
};