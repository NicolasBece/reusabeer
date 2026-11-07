// Pantalla: Usuarios y roles.

let usuariosDB = [];
let rolesDB = [];
let usuariosCargando = false;


// =========================
// VISTA
// =========================

V.usr = () => {

    const filas = usuariosDB.length
        ? usuariosDB.map(u => `
            <tr>

                <td>
                    <div class="usuario">

                        <div class="av av-suave">
                            ${(u.nombre || '?')[0].toUpperCase()}
                        </div>

                        <div>
                            <b>${u.nombre}</b><br>

                            <small class="mut">
                                USR-${String(u.id).padStart(3, '0')}
                                ·
                                ${u.email}
                            </small>
                        </div>

                    </div>
                </td>


                <td>
                    <span class="chip c-n">
                        ${i('shield')}
                        ${u.rol || 'Sin rol'}
                    </span>
                </td>


                <td>
                    Según el rol
                </td>


                <td>

                    <button
                        class="sw ${u.activo ? 'on' : ''}"
                        data-u="${u.id}"
                        data-activo="${u.activo}"
                        aria-label="Activar o desactivar"
                    >
                    </button>

                </td>


                <td>

                    <button
                        class="btn sm"
                        data-p="${u.id}"
                    >
                        ${i('edit')}
                        Permisos
                    </button>

                </td>

            </tr>
        `).join('')

        : `
            <tr>
                <td colspan="5" class="mut">
                    No hay usuarios registrados.
                </td>
            </tr>
        `;


    return `

        <div class="tools">

            <label class="srch">

                ${i('search')}

                <input
                    id="buscarUsuario"
                    placeholder="Buscar por nombre, correo o rol"
                >

            </label>


            <button
                class="btn pri"
                id="nu"
            >
                ${i('plus')}
                Crear usuario
            </button>

        </div>


        <div class="card wrap">

            <table>

                <thead>

                    <tr>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Accede a</th>
                        <th>Activo</th>
                        <th></th>
                    </tr>

                </thead>


                <tbody id="tablaUsuarios">

                    ${filas}

                </tbody>

            </table>

        </div>
    `;
};


// =========================
// CARGAR USUARIOS
// =========================

async function cargarUsuarios() {

    if (usuariosCargando) return;

    usuariosCargando = true;

    try {

        const respuesta = await fetch(
            'http://127.0.0.1:8000/api/usuarios'
        );


        if (!respuesta.ok) {
            throw new Error(
                'No se pudieron cargar los usuarios'
            );
        }


        usuariosDB = await respuesta.json();

        go('usr');


    } catch (error) {

        console.error(error);

        toast(
            'Error al cargar usuarios'
        );

    } finally {

        usuariosCargando = false;
    }
}


// =========================
// CARGAR ROLES
// =========================

async function cargarRoles() {

    try {

        const respuesta = await fetch(
            'http://127.0.0.1:8000/api/roles'
        );


        if (!respuesta.ok) {
            throw new Error(
                'No se pudieron cargar los roles'
            );
        }


        rolesDB = await respuesta.json();


    } catch (error) {

        console.error(error);

        toast(
            'Error al cargar roles'
        );
    }
}


// =========================
// CAMBIAR ESTADO
// =========================

async function cambiarEstadoUsuario(
    usuarioId,
    estadoActual
) {

    try {

        const respuesta = await fetch(
            `http://127.0.0.1:8000/api/usuarios/${usuarioId}/estado`,
            {
                method: 'PATCH',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    activo: !estadoActual
                })
            }
        );


        if (!respuesta.ok) {

            const error = await respuesta.json();

            throw new Error(
                error.detail ||
                'No se pudo actualizar el usuario'
            );
        }


        const resultado = await respuesta.json();


        toast(resultado.mensaje);


        await cargarUsuarios();


    } catch (error) {

        console.error(error);

        toast(error.message);
    }
}


// =========================
// FILTRAR
// =========================

function filtrarUsuarios(texto) {

    const q = texto.toLowerCase();


    const filas = document.querySelectorAll(
        '#tablaUsuarios tr'
    );


    filas.forEach(fila => {

        const contenido =
            fila.textContent.toLowerCase();


        fila.style.display =
            contenido.includes(q)
                ? ''
                : 'none';
    });
}


// =========================
// EVENTOS
// =========================

B.usr = () => {

    if (!usuariosDB.length) {

        cargarUsuarios();
        cargarRoles();

        return;
    }


    const buscador = $('#buscarUsuario');


    if (buscador) {

        buscador.oninput = e => {

            filtrarUsuarios(
                e.target.value
            );
        };
    }


    $('#m').onclick = e => {

        // Activar / desactivar
        const botonEstado =
            e.target.closest('[data-u]');


        if (botonEstado) {

            const usuarioId =
                Number(botonEstado.dataset.u);


            const estadoActual =
                botonEstado.dataset.activo === 'true';


            cambiarEstadoUsuario(
                usuarioId,
                estadoActual
            );

            return;
        }


        // Permisos
        const permisos =
            e.target.closest('[data-p]');


        if (permisos) {

            toast(
                'Gestión de permisos pendiente'
            );
        }
    };


    // Crear usuario
    const nuevo = $('#nu');


    if (nuevo) {

        nuevo.onclick = () => {

    if (!rolesDB.length) {
        toast('No fue posible cargar los roles');
        return;
    }

    modal(
        'Crear usuario',
        [
            {
                n: 'n',
                l: 'Nombre'
            },
            {
                n: 'e',
                l: 'Correo',
                t: 'email'
            },
            {
                n: 'r',
                l: 'Rol',
                o: rolesDB.map(r => r.nombre)
            },
            {
                n: 'c',
                l: 'Contraseña',
                t: 'password'
            }
        ],

        async d => {

            const rolSeleccionado =
                rolesDB.find(r => r.nombre === d.r);

            if (!rolSeleccionado) {
                return toast('Selecciona un rol válido');
            }

            if (!d.n.trim()) {
                return toast('Ingresa el nombre');
            }

            if (!d.e.trim()) {
                return toast('Ingresa el correo');
            }

            if (!d.c || d.c.length < 8) {
                return toast(
                    'La contraseña debe tener mínimo 8 caracteres'
                );
            }

            try {

                const respuesta = await fetch(
                    'http://127.0.0.1:8000/api/usuarios',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        body: JSON.stringify({
                            nombre: d.n.trim(),
                            email: d.e.trim(),
                            rol_id: rolSeleccionado.id,
                            contrasena: d.c
                        })
                    }
                );

                const resultado =
                    await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(
                        resultado.detail ||
                        'No se pudo crear el usuario'
                    );
                }

                toast('Usuario creado correctamente');

                await cargarUsuarios();

                        } catch (error) {

                console.error(error);

                toast(error.message);
            }
        }
    );

    };
}
};