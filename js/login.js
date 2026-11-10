
const AUTH_URL = 'http://127.0.0.1:8000';

let usuarioActual = null;

// Incluye la cookie de sesión en las peticiones.
const apiFetch = (url, opciones = {}) =>
  fetch(url, {
    ...opciones,
    credentials: 'include'
  });


function pantallaLogin() {
  document.querySelector('aside').style.display = 'none';
  document.querySelector('main').style.display = 'none';

  const capa = document.getElementById('pantalla-login');
  capa.style.display = 'flex';

  capa.innerHTML = `
    <form id="form-login" class="tarjeta-login">
      <h1>Reusabeer</h1>
      <h2>Iniciar sesión</h2>
      <p>Ingresa con tu cuenta registrada.</p>

      <label for="login-email">Correo electrónico</label>
      <input
        id="login-email"
        type="email"
        placeholder="usuario@reusabeer.com"
        autocomplete="username"
        required
      >

      <label for="login-clave">Contraseña</label>
      <input
        id="login-clave"
        type="password"
        placeholder="Contraseña"
        autocomplete="current-password"
        required
      >

      <p id="login-error" role="alert"></p>

      <button id="boton-login" type="submit">
        Iniciar sesión
      </button>
    </form>
  `;

  document.getElementById('form-login')
    .addEventListener('submit', async (evento) => {
      evento.preventDefault();

      const boton = document.getElementById('boton-login');
      const error = document.getElementById('login-error');

      boton.disabled = true;
      error.textContent = '';

      const email = document.getElementById('login-email').value;
      const clave = document.getElementById('login-clave').value;

      try {
        const respuesta = await apiFetch(`${AUTH_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, clave })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.detail || 'No se pudo iniciar sesión');
        }

        entrarAplicacion(datos.usuario);

      } catch (err) {
        error.textContent = err.message || 'Error de conexión';
      } finally {
        boton.disabled = false;
      }
    });
}


function entrarAplicacion(usuario) {
  usuarioActual = usuario;

  document.getElementById('pantalla-login').style.display = 'none';
  document.querySelector('aside').style.display = '';
  document.querySelector('main').style.display = '';

  const identidad = document.querySelector('.me');
  identidad.replaceChildren();

  const avatar = document.createElement('div');
  avatar.className = 'av';
  avatar.textContent = (usuario.nombre || '?')[0].toUpperCase();

  const datos = document.createElement('div');

  const nombre = document.createElement('b');
  nombre.textContent = usuario.nombre;

  const rol = document.createElement('small');
  rol.textContent = usuario.rol;

  datos.append(nombre, document.createElement('br'), rol);

  const botonSalir = document.createElement('button');
  botonSalir.className = 'btn-salir';
  botonSalir.textContent = 'Salir';

  botonSalir.addEventListener('click', async () => {
    try {
      await apiFetch(`${AUTH_URL}/api/logout`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('No se pudo cerrar sesión:', err);
    }

    usuarioActual = null;
    pantallaLogin();
  });

  identidad.append(avatar, datos, botonSalir);

  go('dash');
}


async function iniciarReusabeer() {
  try {
    const respuesta = await apiFetch(`${AUTH_URL}/api/session`);

    if (respuesta.ok) {
      const datos = await respuesta.json();
      entrarAplicacion(datos.usuario);
      return;
    }
  } catch (err) {
    console.error('Error comprobando sesión:', err);
  }

  pantallaLogin();
}
