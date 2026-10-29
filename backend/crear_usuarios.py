"""Crea los usuarios iniciales de Reusabeer con la contraseña cifrada.

Uso (después de ejecutar los scripts 01, 02 y 03 de base_de_datos):
    python crear_usuarios.py

Pide una contraseña inicial, la cifra con bcrypt y la guarda como hash.
Si un correo ya existe, se omite (no se sobrescribe su contraseña).
"""

import getpass
import sys


from base_datos import conectar
from seguridad import generar_hash

USUARIOS = [
    ("Joahn Becerra",   "j.becerra@reusabeer.com", "Administrador"),
    ("Juan S. Sánchez", "j.sanchez@reusabeer.com", "Operario de producción"),
    ("Alied Garzón",    "a.garzon@reusabeer.com",  "Encargado de inventario"),
    ("Carlos Ruiz",     "c.ruiz@reusabeer.com",    "Repartidor"),
]


def pedir_clave() -> str:
    clave = getpass.getpass("Contraseña inicial para los usuarios de ejemplo: ")
    repetida = getpass.getpass("Repite la contraseña: ")
    if clave != repetida:
        sys.exit("Las contraseñas no coinciden.")
    return clave


def main() -> None:
    clave = pedir_clave()
    hash_clave = generar_hash(clave)   # Lanza ValueError si no cumple las reglas

    with conectar() as conexion, conexion.cursor() as cur:
        for nombre, email, rol in USUARIOS:
            cur.execute(
                """
                INSERT INTO usuario (nombre, email, rol_id, contrasena_hash)
                SELECT %s::text, %s::text, id, %s::text FROM rol WHERE nombre = %s
                ON CONFLICT DO NOTHING
                """,
                (nombre, email, hash_clave, rol),
            )
            estado = "creado" if cur.rowcount else "ya existía"
            print(f"{email}: {estado}")


if __name__ == "__main__":
    try:
        main()
    except ValueError as error:
        sys.exit(str(error))
