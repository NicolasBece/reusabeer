// ==========================================
// REUSABEER - ENVASES Y TRAZABILIDAD
// Conectado a FastAPI + PostgreSQL
// ==========================================

const API_URL = 'http://127.0.0.1:8000';

let productosApi = [];
let usuariosApi = [];
let envasesApiCargados = false;


// Traduce los valores internos de PostgreSQL
// a textos amigables para el usuario.
const estadosTexto = {
    en_bodega: 'En bodega',
    en_distribucion: 'En distribución',
    con_cliente: 'Con cliente',
    devuelto: 'Devuelto',
    en_lavado: 'En lavado',
    baja: 'Baja'
};


const estadosBD = {
    'En bodega': 'en_bodega',
    'En distribución': 'en_distribucion',
    'Con cliente': 'con_cliente',
    'Devuelto': 'devuelto',
    'En lavado': 'en_lavado',
    'Baja': 'baja'
};


const movimientosTexto = {
    salida: 'Salida a distribución',
    entrega: 'Entrega a cliente',
    devolucion: 'Devolución',
    reingreso: 'Reingreso a bodega',
    lavado: 'Lavado'
};

const movimientosBD = {
    'Salida a distribución': 'salida',
    'Entrega a cliente': 'entrega',
    'Devolución': 'devolucion',
    'Reingreso a bodega': 'reingreso',
    'Lavado': 'lavado'
};


// ==========================================
// CARGAR DATOS DESDE POSTGRESQL
// ==========================================

async function cargarEnvasesAPI() {

    const [
    respuestaEnvases,
    respuestaProductos,
    respuestaUsuarios
] = await Promise.all([

    fetch(`${API_URL}/api/envases`),

    fetch(`${API_URL}/api/productos`),

    fetch(`${API_URL}/api/usuarios`)
]);

    if (!respuestaEnvases.ok || !respuestaProductos.ok) {
        throw new Error('No fue posible consultar la API.');
    }

    const listaEnvases = await respuestaEnvases.json();
    productosApi = await respuestaProductos.json();
    usuariosApi = await respuestaUsuarios.json();

    const productosPorId = {};

    productosApi.forEach(p => {
        productosPorId[p.id] = p.nombre;
    });

    envs = {};

    listaEnvases.forEach(e => {

        envs[e.codigo_id] = {

            dbId: e.id,

            prod:
                productosPorId[e.producto_id]
                || `Producto #${e.producto_id}`,

            producto_id: e.producto_id,

            tipo:
                `${e.tipo} · ${e.material}`,

            tipoRaw: e.tipo,

            materialRaw: e.material,

            estadoRaw: e.estado,

            est:
                estadosTexto[e.estado]
                || e.estado,

            // De momento la tabla envase no maneja ubicación.
            ub: 'Sin ubicación registrada',

            fr:
                e.fecha_registro
                    ? fd(e.fecha_registro)
                    : '-',

            // Luego conectaremos movimiento_envase.
            h: []
        };
    });

    const codigos = Object.keys(envs);

    if (!envSel || !envs[envSel]) {
        envSel = codigos.length ? codigos[0] : '';
    }

    envasesApiCargados = true;
    await cargarMovimientosSeleccionado();
}


// ==========================================
// VISTA
// ==========================================
async function cargarMovimientosSeleccionado() {

    if (!envSel || !envs[envSel]) {
        return;
    }

    const envase = envs[envSel];

    const respuesta = await fetch(
        `${API_URL}/api/envases/${envase.dbId}/movimientos`
    );

    if (!respuesta.ok) {
        throw new Error(
            'No fue posible consultar los movimientos'
        );
    }

    const movimientos = await respuesta.json();

    envase.h = movimientos.map(m => {

        const fecha = new Date(m.fecha)
            .toLocaleString('es-CO');

        const nombreMovimiento =
            movimientosTexto[m.tipo_movimiento]
            || m.tipo_movimiento;

        let detalle = m.usuario || 'Usuario';

        if (m.observaciones) {
            detalle += ` · ${m.observaciones}`;
        }

        return [
            fecha,
            nombreMovimiento,
            detalle
        ];
    });
}

V.env = () => {

    const e = envs[envSel];

    const herramientas = `
        <div class="tools">

            <label class="srch">
                ${i('search')}
                <input
                    id="eq"
                    value="${envSel || ''}"
                    placeholder="ID de envase, ej. ENV-2026-0894"
                >
            </label>

            <button class="btn dk" id="eb">
                Buscar
            </button>

            <button class="btn" id="qr">
                ${i('qr')}
                Escanear QR
            </button>

            <button class="btn" id="ne">
                ${i('plus')}
                Nuevo envase
            </button>

        </div>
    `;


    if (!e) {

        return herramientas + `

            <div class="card mut">

                ${
                    envSel
                        ? `${i('ban')} No encontramos el envase ${envSel}.`
                        : 'Cargando envases...'
                }

            </div>
        `;
    }


    return herramientas + `

        <div class="g g2">

            <div class="card">

                <h3>${envSel}</h3>

                <div class="det mt">

                    <div>
                        ${i('tag')}
                        Producto
                        <b>${e.prod}</b>
                    </div>

                    <div>
                        ${i('bottle')}
                        Tipo
                        <b>${e.tipo}</b>
                    </div>

                    <div>
                        ${i('truck')}
                        Estado
                        <b>
                            <span class="chip c-warn">
                                ${e.est}
                            </span>
                        </b>
                    </div>

                    <div>
                        ${i('box')}
                        Ubicación
                        <b>${e.ub}</b>
                    </div>

                    <div>
                        ${i('cal')}
                        Registro
                        <b>${e.fr}</b>
                    </div>

                </div>

                <div class="mt">

                    <button
                        class="btn"
                        id="editarEnvase"
                    >
                        Editar
                    </button>

                    <button
                        class="btn"
                        id="eliminarEnvase"
                    >
                        Eliminar
                    </button>

                </div>

            </div>


            <div class="card">

                <h3>
                    ${i('clock')}
                    Historial de movimientos
                </h3>

                <div class="tl mt">

                    ${
                        e.h.length

                        ? e.h.map(h => `

                            <div>
                                <small class="mut">
                                    ${h[0]}
                                </small>
                                <br>
                                <b>${h[1]}</b>
                                ·
                                <small>${h[2]}</small>
                            </div>

                        `).join('')

                        : '<p class="mut">Sin movimientos cargados todavía.</p>'
                    }

                </div>

                <button
                    class="btn dk mt"
                    id="mv"
                >
                    ${i('plus')}
                    Registrar movimiento
                </button>

            </div>

        </div>
    `;
};


// ==========================================
// EVENTOS
// ==========================================

B.env = () => {

    // Primera entrada a la pantalla.
    if (!envasesApiCargados) {

        cargarEnvasesAPI()

            .then(() => {
                go('env');
            })

            .catch(error => {
                console.error(error);
                toast('No se pudo conectar con el backend');
            });

        return;
    }


    // =====================
    // BUSCAR
    // =====================

    const buscar = () => {

        envSel = $('#eq')
            .value
            .trim()
            .toUpperCase();

        go('env');
    };


    $('#eb').onclick = buscar;


    $('#eq').onkeydown = e => {

        if (e.key === 'Enter') {
            buscar();
        }
    };


    // =====================
    // QR
    // =====================

    $('#qr').onclick = () => {

        toast(
            'El escáner QR se activará con la app móvil'
        );
    };


    // =====================
    // NUEVO ENVASE
    // =====================

    $('#ne').onclick = () => {

        const opcionesProductos =
            productosApi.map(
                p => `${p.id} | ${p.nombre}`
            );


        modal(

            'Nuevo envase',

            [
                {
                    n: 'codigo',
                    l: 'Código del envase',
                    v: `ENV-2026-${String(Date.now()).slice(-4)}`
                },

                {
                    n: 'prod',
                    l: 'Producto',
                    o: opcionesProductos
                },

                {
                    n: 'tipo',
                    l: 'Tipo',
                    o: [
                        'Botella retornable',
                        'Barril'
                    ]
                },

                {
                    n: 'material',
                    l: 'Material',
                    o: [
                        'Vidrio ámbar',
                        'Vidrio verde',
                        'Acero inoxidable'
                    ]
                },

                {
                    n: 'estado',
                    l: 'Estado',
                    o: [
                        'En bodega',
                        'En distribución',
                        'Con cliente',
                        'Devuelto',
                        'En lavado'
                    ]
                }
            ],

            async d => {

                try {

                    const productoId =
                        Number(
                            d.prod.split('|')[0].trim()
                        );


                    const respuesta = await fetch(

                        `${API_URL}/api/envases`,

                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({

                                codigo_id:
                                    d.codigo
                                        .trim()
                                        .toUpperCase(),

                                tipo:
                                    d.tipo,

                                material:
                                    d.material,

                                estado:
                                    estadosBD[d.estado],

                                fecha_registro:
                                    new Date()
                                        .toISOString()
                                        .slice(0, 10),

                                producto_id:
                                    productoId
                            })
                        }
                    );


                    const resultado =
                        await respuesta.json();


                    if (!respuesta.ok) {

                        throw new Error(
                            resultado.detail
                            || 'No fue posible registrar el envase'
                        );
                    }


                    envSel =
                        resultado.envase.codigo_id;


                    await cargarEnvasesAPI();

                    go('env');

                    toast(
                        'Envase registrado correctamente'
                    );

                }

                catch (error) {

                    console.error(error);

                    alert(error.message);
                }
            }
        );
    };


    const e = envs[envSel];


    if (!e) {
        return;
    }


    // =====================
    // EDITAR ENVASE
    // =====================

    $('#editarEnvase').onclick = () => {

        modal(

            'Editar envase',

            [
                {
                    n: 'tipo',
                    l: 'Tipo',
                    v: e.tipoRaw
                },

                {
                    n: 'material',
                    l: 'Material',
                    v: e.materialRaw
                },

                {
                    n: 'estado',
                    l: 'Estado',
                    o: [
                        e.est,
                        ...Object.keys(estadosBD)
                            .filter(x => x !== e.est)
                    ]
                }
            ],

            async d => {

                try {

                    const respuesta = await fetch(

                        `${API_URL}/api/envases/${e.dbId}`,

                        {
                            method: 'PUT',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({

                                tipo:
                                    d.tipo,

                                material:
                                    d.material,

                                estado:
                                    estadosBD[d.estado],

                                producto_id:
                                    e.producto_id
                            })
                        }
                    );


                    const resultado =
                        await respuesta.json();


                    if (!respuesta.ok) {

                        throw new Error(
                            resultado.detail
                            || 'No fue posible editar'
                        );
                    }


                    await cargarEnvasesAPI();

                    go('env');

                    toast(
                        'Envase actualizado correctamente'
                    );

                }

                catch (error) {

                    console.error(error);

                    alert(error.message);
                }
            }
        );
    };


    // =====================
    // ELIMINAR ENVASE
    // =====================

    $('#eliminarEnvase').onclick = async () => {

        const confirmar = window.confirm(
            `¿Eliminar el envase ${envSel}?`
        );


        if (!confirmar) {
            return;
        }


        try {

            const respuesta = await fetch(

                `${API_URL}/api/envases/${e.dbId}`,

                {
                    method: 'DELETE'
                }
            );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                throw new Error(
                    resultado.detail
                    || 'No fue posible eliminar'
                );
            }


            envSel = '';

            await cargarEnvasesAPI();

            go('env');

            toast(
                'Envase eliminado correctamente'
            );

        }

        catch (error) {

            console.error(error);

            alert(error.message);
        }
    };


    // =====================
    // MOVIMIENTOS
    // =====================

    $('#mv').onclick = () => {

    const opcionesUsuarios =
        usuariosApi.map(
            u => `${u.id} | ${u.nombre}`
        );

    modal(

        'Registrar movimiento',

        [
            {
                n: 'tipo',
                l: 'Tipo de movimiento',
                o: [
                    'Salida a distribución',
                    'Entrega a cliente',
                    'Devolución',
                    'Reingreso a bodega',
                    'Lavado'
                ]
            },

            {
                n: 'usuario',
                l: 'Responsable',
                o: opcionesUsuarios
            },

            {
                n: 'observaciones',
                l: 'Observaciones',
                v: ''
            }
        ],

        async d => {

            try {

                const usuarioId =
                    Number(
                        d.usuario
                            .split('|')[0]
                            .trim()
                    );

                const respuesta = await fetch(

                    `${API_URL}/api/envases/${e.dbId}/movimientos`,

                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            tipo_movimiento:
                                movimientosBD[d.tipo],

                            usuario_id:
                                usuarioId,

                            observaciones:
                                d.observaciones
                        })
                    }
                );

                const resultado =
                    await respuesta.json();

                if (!respuesta.ok) {

                    throw new Error(
                        resultado.detail
                        || 'No fue posible registrar el movimiento'
                    );
                }

                // Recargar envases porque el trigger
                // también cambia el estado.
                await cargarEnvasesAPI();

                go('env');

                toast(
                    'Movimiento registrado correctamente'
                );
            }

            catch (error) {

                console.error(error);
                alert(error.message);

            }
        }
    );

}; 

}; 