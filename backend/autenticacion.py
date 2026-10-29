"""Lógica de inicio de sesión (CU-01).

Esta función es independiente del framework web. Cuando se elija Flask o FastAPI,
la ruta POST /api/login solo debe llamarla y devolver el resultado como JSON.
"""

from datetime import datetime, timedelta, timezone

from base_datos import conectar
from seguridad import verificar_clave

MAX_INTENTOS = 5
MINUTOS_BLOQUEO = 15
MENSAJE_GENERICO = "Correo o contraseña incorrectos."


class ErrorAcceso(Exception):
    """Error de inicio de sesión con un mensaje seguro para mostrar al usuario."""


def autenticar(email: str, clave: str) -> dict:
    """Valida las credenciales y devuelve los datos del usuario y sus módulos.

    Lanza ErrorAcceso si algo falla. Siempre usa el mismo mensaje para correo
    inexistente o clave incorrecta, así no se revela qué correos están registrados.
    """
    ahora = datetime.now(timezone.utc)

    with conectar() as conexion, conexion.cursor() as cur:
        cur.execute(
            """
            SELECT u.id, u.nombre, u.email, u.contrasena_hash, u.activo,
                   u.intentos_fallidos, u.bloqueado_hasta, r.id, r.nombre
              FROM usuario u
              JOIN rol r ON r.id = u.rol_id
             WHERE lower(u.email) = lower(%s)
            """,
            (email.strip(),),
        )
        fila = cur.fetchone()

        if fila is None:
            raise ErrorAcceso(MENSAJE_GENERICO)

        (usuario_id, nombre, correo, hash_guardado, activo,
         intentos, bloqueado_hasta, rol_id, rol) = fila

        if bloqueado_hasta is not None and bloqueado_hasta > ahora:
            raise ErrorAcceso("Cuenta bloqueada temporalmente por demasiados intentos. Intenta más tarde.")

        if not verificar_clave(clave, hash_guardado):
            intentos += 1
            bloqueo = ahora + timedelta(minutes=MINUTOS_BLOQUEO) if intentos >= MAX_INTENTOS else None
            cur.execute(
                "UPDATE usuario SET intentos_fallidos = %s, bloqueado_hasta = %s WHERE id = %s",
                (0 if bloqueo else intentos, bloqueo, usuario_id),
            )
            raise ErrorAcceso(MENSAJE_GENERICO)

        if not activo:
            raise ErrorAcceso("Esta cuenta está desactivada. Habla con el administrador.")

        # Acceso correcto: se reinician los intentos y se registra la fecha
        cur.execute(
            "UPDATE usuario SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = now() WHERE id = %s",
            (usuario_id,),
        )
        cur.execute("SELECT modulo FROM rol_permiso WHERE rol_id = %s ORDER BY modulo", (rol_id,))
        modulos = [m for (m,) in cur.fetchall()]

    return {"id": usuario_id, "nombre": nombre, "email": correo, "rol": rol, "modulos": modulos}
