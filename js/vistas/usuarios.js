// Pantalla: Usuarios y roles.

// Vista: Usuarios y roles
V.usr = () => `<div class="tools"><label class="srch">${i('search')}<input placeholder="Buscar por nombre, correo o rol"></label><button class="btn pri" id="nu">${i('plus')}Crear usuario</button></div><div class="card wrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Accede a</th><th>Activo</th><th></th></tr></thead><tbody>${users.map((u, k) => `<tr><td><div class="usuario"><div class="av av-suave">${u[1][0]}</div><div><b>${u[1]}</b><br><small class="mut">${u[0]} · ${u[2]}</small></div></div></td><td><span class="chip c-n">${i('shield')}${u[3]}</span></td><td>${u[4]}</td><td><button class="sw ${u[5] ? 'on' : ''}" data-u="${k}" aria-label="Activar o desactivar"></button></td><td><button class="btn sm" data-p="1">${i('edit')}Permisos</button></td></tr>`).join('')}</tbody></table></div>`;

// Eventos: activar/desactivar y crear usuario
B.usr = () => {
    $('#m').onclick = e => {
        const s = e.target.closest('[data-u]');
        if (s) {
            users[+s.dataset.u][5] ^= 1;
            go('usr');
        }
        if (e.target.closest('[data-p]'))
            toast('Edición de permisos disponible con el backend');
    };
    $('#nu').onclick = () => modal('Crear usuario', [{ n: 'n', l: 'Nombre' }, { n: 'e', l: 'Correo', t: 'email' }, { n: 'r', l: 'Rol', o: ['Administrador', 'Operario de producción', 'Encargado de inventario', 'Repartidor'] }], d => {
        users.push(['USR-0' + (users.length + 1), d.n, d.e, d.r, 'Según el rol', 1]);
        go('usr');
        toast('Usuario creado');
    });
};
