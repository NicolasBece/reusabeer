// ==========================================
// REUSABEER - INVENTARIO Y LOTES
// FastAPI + PostgreSQL
// ==========================================

const INV_API_URL = 'http://127.0.0.1:8000';

let lotesApi = [];
let productosInventario = [];
let usuariosInventario = [];


// ==========================================
// CARGAR DATOS DESDE EL BACKEND
// ==========================================

async function cargarInventarioAPI() {

    const [
        respuestaLotes,
        respuestaProductos,
        respuestaUsuarios
    ] = await Promise.all([

        apiFetch(`${INV_API_URL}/api/lotes`),
        apiFetch(`${INV_API_URL}/api/productos`),
        apiFetch(`${INV_API_URL}/api/usuarios`)
    ]);


    if (
        !respuestaLotes.ok ||
        !respuestaProductos.ok ||
        !respuestaUsuarios.ok
    ) {
        throw new Error(
            'No fue posible cargar el inventario'
        );
    }


    lotesApi = await respuestaLotes.json();
    productosInventario =
        await respuestaProductos.json();
    usuariosInventario =
        await respuestaUsuarios.json();
}


// ==========================================
// VISTA
// ==========================================

V.inv = () => `
    <div class="tools">

        <label class="srch">
            ${i('search')}

            <input
                id="q"
                placeholder="Buscar por nombre o lote"
            >
        </label>

        <button
            class="btn pri"
            id="nl"
        >
            ${i('plus')}
            Registrar lote
        </button>

    </div>


    <div class="card wrap">

        <table>

            <thead>

                <tr>
                    <th>Lote</th>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Ingreso</th>
                    <th>Vence</th>
                    <th></th>
                </tr>

            </thead>

            <tbody id="tb"></tbody>

        </table>

    </div>
`;


// ==========================================
// DIBUJAR FILAS
// ==========================================

function invRows(q = '') {

    const tabla = $('#tb');

    if (!tabla) {
        return;
    }


    const filtro =
        q.trim().toLowerCase();


    const encontrados =
        lotesApi.filter(l => {

            const texto = `
                ${l.numero_lote}
                ${l.producto}
                ${l.cantidad}
            `.toLowerCase();

            return texto.includes(filtro);
        });


    tabla.innerHTML = encontrados.map(l => {

        // Referencia visual.
        // La BD todavía no almacena stock mínimo.
        const minimoReferencia = 100;

        const porcentaje =
            Math.min(
                100,
                (l.cantidad / minimoReferencia) * 25
            );

        const bajo =
            l.cantidad <= minimoReferencia;


        return `

            <tr>

                <td>
                    <b>${l.numero_lote}</b>
                </td>


                <td>
                    ${l.producto}

                    <br>

                    <small class="mut">
                        Producto #${l.producto_id}
                    </small>
                </td>


                <td>

                    ${fmt(l.cantidad)} botes

                    <div class="bar">

                        <i
                            style="
                                width:${porcentaje}%;
                                background:
                                ${
                                    bajo
                                    ? 'var(--bad)'
                                    : 'var(--ok)'
                                }
                            "
                        ></i>

                    </div>

                    <small class="mut">
                        mínimo de referencia
                        ${minimoReferencia}
                    </small>

                </td>


                <td>
                    ${fd(l.fecha_ingreso)}
                </td>


                <td>
                    ${fd(l.fecha_vencimiento)}
                </td>


                <td>

                    <button
                        class="btn sm"
                        data-action="editar"
                        data-id="${l.id}"
                        aria-label="Ajustar stock"
                    >
                        ${i('edit')}
                        Ajustar
                    </button>

                    <button
                        class="btn sm"
                        data-action="eliminar"
                        data-id="${l.id}"
                        aria-label="Eliminar lote"
                    >
                        Eliminar
                    </button>

                </td>

            </tr>
        `;

    }).join('')


    || `

        <tr>

            <td
                colspan="6"
                class="mut"
            >
                No hay lotes con ese criterio.
            </td>

        </tr>
    `;
}


// ==========================================
// EVENTOS
// ==========================================

B.inv = async () => {

    // Mostrar mensaje mientras consulta.
    $('#tb').innerHTML = `

        <tr>

            <td
                colspan="6"
                class="mut"
            >
                Cargando inventario...
            </td>

        </tr>
    `;


    // ======================================
    // CARGAR INFORMACIÓN REAL
    // ======================================

    try {

        await cargarInventarioAPI();

        invRows();

    }

    catch (error) {

        console.error(error);

        $('#tb').innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="mut"
                >
                    No fue posible conectar
                    con el backend.
                </td>

            </tr>
        `;

        toast(
            'No se pudo cargar el inventario'
        );

        return;
    }


    // ======================================
    // BUSCADOR
    // ======================================

    $('#q').oninput = e => {

        invRows(
            e.target.value
        );
    };


    // ======================================
    // AJUSTAR / ELIMINAR
    // ======================================

    $('#tb').onclick = e => {

        const boton =
            e.target.closest('button');

        if (!boton) {
            return;
        }


        const loteId =
            Number(boton.dataset.id);


        const lote =
            lotesApi.find(
                x => x.id === loteId
            );


        if (!lote) {
            return;
        }


        // ==================================
        // EDITAR
        // ==================================

        if (
            boton.dataset.action ===
            'editar'
        ) {

            modal(

                'Ajustar stock de '
                + lote.numero_lote,

                [
                    {
                        n: 'cantidad',
                        l: 'Nuevo stock (botes)',
                        t: 'number',
                        v: lote.cantidad
                    },

                    {
                        n: 'vencimiento',
                        l: 'Fecha de vencimiento',
                        t: 'date',
                        v: lote.fecha_vencimiento
                    }
                ],

                async d => {

                    const cantidad =
                        Number(d.cantidad);


                    if (
                        Number.isNaN(cantidad)
                        ||
                        cantidad < 0
                    ) {

                        return toast(
                            'El stock no puede ser negativo'
                        );
                    }


                    try {

                        const respuesta =
                            await apiFetch(

                                `${INV_API_URL}/api/lotes/${lote.id}`,

                                {
                                    method: 'PUT',

                                    headers: {
                                        'Content-Type':
                                            'application/json'
                                    },

                                    body:
                                        JSON.stringify({

                                            cantidad:
                                                cantidad,

                                            fecha_vencimiento:
                                                d.vencimiento
                                        })
                                }
                            );


                        const resultado =
                            await respuesta.json();


                        if (!respuesta.ok) {

                            throw new Error(
                                resultado.detail
                                ||
                                'No fue posible actualizar el lote'
                            );
                        }


                        await cargarInventarioAPI();

                        invRows(
                            $('#q').value
                        );

                        toast(
                            'Stock actualizado correctamente'
                        );

                    }

                    catch (error) {

                        console.error(error);

                        alert(
                            error.message
                        );
                    }
                }
            );

            return;
        }


        // ==================================
        // ELIMINAR
        // ==================================

        if (
            boton.dataset.action ===
            'eliminar'
        ) {

            eliminarLote(lote);
        }
    };


    // ======================================
    // REGISTRAR NUEVO LOTE
    // ======================================

    $('#nl').onclick = () => {

        const opcionesProductos =
            productosInventario.map(

                p =>
                    `${p.id} | ${p.nombre}`
            );


        const opcionesUsuarios =
            usuariosInventario.map(

                u =>
                    `${u.id} | ${u.nombre}`
            );


        modal(

            'Registrar lote',

            [
                {
                    n: 'producto',
                    l: 'Producto',
                    o: opcionesProductos
                },

                {
                    n: 'numero_lote',
                    l: 'Número de lote',
                    v: `L-2026-${String(
                        Date.now()
                    ).slice(-3)}`
                },

                {
                    n: 'cantidad',
                    l: 'Cantidad (botes)',
                    t: 'number'
                },

                {
                    n: 'ingreso',
                    l: 'Fecha de ingreso',
                    t: 'date',
                    v: new Date()
                        .toISOString()
                        .slice(0, 10)
                },

                {
                    n: 'vencimiento',
                    l: 'Fecha de vencimiento',
                    t: 'date'
                },

                {
                    n: 'usuario',
                    l: 'Responsable',
                    o: opcionesUsuarios
                }
            ],

            async d => {

                const cantidad =
                    Number(d.cantidad);


                if (
                    Number.isNaN(cantidad)
                    ||
                    cantidad < 0
                ) {

                    return toast(
                        'La cantidad no puede ser negativa'
                    );
                }


                if (
                    !d.numero_lote.trim()
                ) {

                    return toast(
                        'Debes escribir un número de lote'
                    );
                }


                if (
                    !d.ingreso
                    ||
                    !d.vencimiento
                ) {

                    return toast(
                        'Debes seleccionar las fechas'
                    );
                }


                if (
                    d.vencimiento < d.ingreso
                ) {

                    return toast(
                        'El vencimiento no puede ser anterior al ingreso'
                    );
                }


                const productoId =
                    Number(
                        d.producto
                            .split('|')[0]
                            .trim()
                    );


                const usuarioId =
                    Number(
                        d.usuario
                            .split('|')[0]
                            .trim()
                    );


                try {

                    const respuesta =
                        await apiFetch(

                            `${INV_API_URL}/api/lotes`,

                            {
                                method: 'POST',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                body:
                                    JSON.stringify({

                                        producto_id:
                                            productoId,

                                        numero_lote:
                                            d.numero_lote
                                                .trim()
                                                .toUpperCase(),

                                        cantidad:
                                            cantidad,

                                        fecha_ingreso:
                                            d.ingreso,

                                        fecha_vencimiento:
                                            d.vencimiento,

                                        usuario_id:
                                            usuarioId
                                    })
                            }
                        );


                    const resultado =
                        await respuesta.json();


                    if (!respuesta.ok) {

                        throw new Error(
                            resultado.detail
                            ||
                            'No fue posible registrar el lote'
                        );
                    }


                    await cargarInventarioAPI();

                    invRows();

                    toast(
                        'Lote registrado correctamente'
                    );

                }

                catch (error) {

                    console.error(error);

                    alert(
                        error.message
                    );
                }
            }
        );
    };
};


// ==========================================
// ELIMINAR LOTE
// ==========================================

async function eliminarLote(lote) {

    const confirmar =
        window.confirm(
            `¿Eliminar el lote ${lote.numero_lote}?`
        );


    if (!confirmar) {
        return;
    }


    try {

        const respuesta =
            await apiFetch(

                `${INV_API_URL}/api/lotes/${lote.id}`,

                {
                    method: 'DELETE'
                }
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.detail
                ||
                'No fue posible eliminar el lote'
            );
        }


        await cargarInventarioAPI();

        invRows(
            $('#q').value
        );


        toast(
            'Lote eliminado correctamente'
        );

    }

    catch (error) {

        console.error(error);

        alert(
            error.message
        );
    }
}