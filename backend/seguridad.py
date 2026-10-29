"""Seguridad de contraseñas de Reusabeer.

Las contraseñas nunca se guardan tal cual. Se guarda un hash bcrypt:
- bcrypt agrega una "sal" aleatoria, así dos usuarios con la misma clave tienen hashes distintos.
- Es lento a propósito (costo 12), lo que dificulta los ataques de fuerza bruta.
- El hash no se puede revertir: para comprobar una clave se vuelve a calcular y se compara.
"""

import bcrypt

COSTO = 12          # Cada +1 duplica el tiempo de cálculo
LARGO_MINIMO = 8
LARGO_MAXIMO_BYTES = 72   # bcrypt solo usa los primeros 72 bytes


def validar_clave(clave: str) -> None:
    """Lanza ValueError si la contraseña no cumple las reglas mínimas."""
    if len(clave) < LARGO_MINIMO:
        raise ValueError(f"La contraseña debe tener al menos {LARGO_MINIMO} caracteres.")
    if len(clave.encode("utf-8")) > LARGO_MAXIMO_BYTES:
        raise ValueError("La contraseña es demasiado larga (máximo 72 bytes).")


def generar_hash(clave: str) -> str:
    """Devuelve el hash bcrypt de una contraseña, listo para guardar en usuario.contrasena_hash."""
    validar_clave(clave)
    hash_bytes = bcrypt.hashpw(clave.encode("utf-8"), bcrypt.gensalt(rounds=COSTO))
    return hash_bytes.decode("utf-8")


def verificar_clave(clave: str, hash_guardado: str) -> bool:
    """Compara una contraseña escrita por el usuario con el hash guardado."""
    try:
        return bcrypt.checkpw(clave.encode("utf-8"), hash_guardado.encode("utf-8"))
    except ValueError:
        # Hash con formato inválido o clave que bcrypt no acepta
        return False
