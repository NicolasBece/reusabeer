from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from psycopg.rows import dict_row

from base_datos import conectar


app = FastAPI(
    title="Reusabeer API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# MODELOS
# =========================

class EnvaseCrear(BaseModel):
    codigo_id: str
    tipo: str
    material: str
    estado: str = "en_bodega"
    fecha_registro: date
    producto_id: int | None = None


class EnvaseActualizar(BaseModel):
    tipo: str
    material: str
    estado: str
    producto_id: int | None = None


class MovimientoCrear(BaseModel):
    tipo_movimiento: str
    usuario_id: int
    observaciones: str | None = None

class LoteCrear(BaseModel):
    producto_id: int
    numero_lote: str
    cantidad: int
    fecha_ingreso: date
    fecha_vencimiento: date
    usuario_id: int


class LoteActualizar(BaseModel):
    cantidad: int
    fecha_vencimiento: date


# =========================
# INICIO
# =========================

@app.get("/")
def inicio():
    return {
        "mensaje": "API de Reusabeer funcionando correctamente"
    }


@app.get("/api/estado")
def estado():
    return {
        "backend": "activo",
        "base_datos": "reusabeer"
    }


# =========================
# CONSULTAR ENVASES
# =========================

@app.get("/api/envases")
def listar_envases():

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                SELECT
                    id,
                    codigo_id,
                    tipo,
                    material,
                    estado,
                    fecha_registro,
                    producto_id
                FROM envase
                ORDER BY id;
            """)

            return cursor.fetchall()


# =========================
# REGISTRAR ENVASE
# =========================

@app.post("/api/envases")
def crear_envase(envase: EnvaseCrear):

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                SELECT id
                FROM envase
                WHERE codigo_id = %s;
            """, (envase.codigo_id,))

            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="Ya existe un envase con ese código"
                )

            cursor.execute("""
                INSERT INTO envase (
                    codigo_id,
                    tipo,
                    material,
                    estado,
                    fecha_registro,
                    producto_id
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                envase.codigo_id,
                envase.tipo,
                envase.material,
                envase.estado,
                envase.fecha_registro,
                envase.producto_id
            ))

            nuevo = cursor.fetchone()

    return {
        "mensaje": "Envase registrado correctamente",
        "envase": nuevo
    }


# =========================
# EDITAR ENVASE
# =========================

@app.put("/api/envases/{envase_id}")
def actualizar_envase(
    envase_id: int,
    envase: EnvaseActualizar
):

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                UPDATE envase
                SET
                    tipo = %s,
                    material = %s,
                    estado = %s,
                    producto_id = %s
                WHERE id = %s
                RETURNING *;
            """, (
                envase.tipo,
                envase.material,
                envase.estado,
                envase.producto_id,
                envase_id
            ))

            actualizado = cursor.fetchone()

            if actualizado is None:
                raise HTTPException(
                    status_code=404,
                    detail="Envase no encontrado"
                )

    return {
        "mensaje": "Envase actualizado correctamente",
        "envase": actualizado
    }


# =========================
# ELIMINAR ENVASE
# =========================

@app.delete("/api/envases/{envase_id}")
def eliminar_envase(envase_id: int):

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                DELETE FROM envase
                WHERE id = %s
                RETURNING id, codigo_id;
            """, (envase_id,))

            eliminado = cursor.fetchone()

            if eliminado is None:
                raise HTTPException(
                    status_code=404,
                    detail="Envase no encontrado"
                )

    return {
        "mensaje": "Envase eliminado correctamente",
        "envase": eliminado
    }

# =========================
# PRODUCTOS
# =========================
@app.get("/api/productos")
def listar_productos():

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                SELECT id, nombre
                FROM producto
                ORDER BY id;
            """)

            return cursor.fetchall()


# =========================
# LISTAR USUARIOS
# =========================

@app.get("/api/usuarios")
def listar_usuarios():

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                SELECT
                    u.id,
                    u.nombre,
                    u.email,
                    r.nombre AS rol
                FROM usuario u
                LEFT JOIN rol r ON r.id = u.rol_id
                WHERE u.activo = TRUE
                ORDER BY u.id;
            """)

            return cursor.fetchall()


# =========================
# HISTORIAL DE MOVIMIENTOS
# =========================

@app.get("/api/envases/{envase_id}/movimientos")
def listar_movimientos(envase_id: int):

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                SELECT
                    m.id,
                    m.tipo_movimiento,
                    m.fecha,
                    m.usuario_id,
                    u.nombre AS usuario,
                    m.observaciones
                FROM movimiento_envase m
                LEFT JOIN usuario u
                    ON u.id = m.usuario_id
                WHERE m.envase_id = %s
                ORDER BY m.fecha DESC, m.id DESC;
            """, (envase_id,))

            return cursor.fetchall()


# =========================
# REGISTRAR MOVIMIENTO
# =========================

@app.post("/api/envases/{envase_id}/movimientos")
def registrar_movimiento(
    envase_id: int,
    movimiento: MovimientoCrear
):

    tipos_validos = [
        "salida",
        "entrega",
        "devolucion",
        "reingreso",
        "lavado"
    ]

    if movimiento.tipo_movimiento not in tipos_validos:
        raise HTTPException(
            status_code=400,
            detail="Tipo de movimiento no válido"
        )

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            # Verificar envase
            cursor.execute("""
                SELECT id
                FROM envase
                WHERE id = %s;
            """, (envase_id,))

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Envase no encontrado"
                )

            # Registrar movimiento
            cursor.execute("""
                INSERT INTO movimiento_envase (
                    envase_id,
                    tipo_movimiento,
                    fecha,
                    usuario_id,
                    observaciones
                )
                VALUES (%s, %s, NOW(), %s, %s)
                RETURNING
                    id,
                    envase_id,
                    tipo_movimiento,
                    fecha,
                    usuario_id,
                    observaciones;
            """, (
                envase_id,
                movimiento.tipo_movimiento,
                movimiento.usuario_id,
                movimiento.observaciones
            ))

            nuevo = cursor.fetchone()

    return {
        "mensaje": "Movimiento registrado correctamente",
        "movimiento": nuevo
    }

# =========================
# INVENTARIO - LISTAR LOTES
# =========================

@app.get("/api/lotes")
def listar_lotes():

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                SELECT
                    l.id,
                    l.producto_id,
                    p.nombre AS producto,
                    l.numero_lote,
                    l.cantidad,
                    l.fecha_ingreso,
                    l.fecha_vencimiento
                FROM lote_inventario l
                INNER JOIN producto p
                    ON p.id = l.producto_id
                ORDER BY l.id;
            """)

            return cursor.fetchall()

        # =========================
# INVENTARIO - CREAR LOTE
# =========================

@app.post("/api/lotes")
def crear_lote(lote: LoteCrear):

    if lote.cantidad < 0:
        raise HTTPException(
            status_code=400,
            detail="La cantidad no puede ser negativa"
        )

    if lote.fecha_vencimiento < lote.fecha_ingreso:
        raise HTTPException(
            status_code=400,
            detail="La fecha de vencimiento no puede ser anterior a la fecha de ingreso"
        )

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            # Verificar producto
            cursor.execute("""
                SELECT id
                FROM producto
                WHERE id = %s;
            """, (lote.producto_id,))

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Producto no encontrado"
                )

            # Verificar usuario
            cursor.execute("""
                SELECT id
                FROM usuario
                WHERE id = %s;
            """, (lote.usuario_id,))

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Usuario no encontrado"
                )

            # Evitar lote duplicado para el mismo producto
            cursor.execute("""
                SELECT id
                FROM lote_inventario
                WHERE producto_id = %s
                AND numero_lote = %s;
            """, (
                lote.producto_id,
                lote.numero_lote
            ))

            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="Ese número de lote ya existe para el producto seleccionado"
                )

            cursor.execute("""
                INSERT INTO lote_inventario (
                    producto_id,
                    numero_lote,
                    cantidad,
                    fecha_ingreso,
                    fecha_vencimiento,
                    usuario_id
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                lote.producto_id,
                lote.numero_lote,
                lote.cantidad,
                lote.fecha_ingreso,
                lote.fecha_vencimiento,
                lote.usuario_id
            ))

            nuevo = cursor.fetchone()

    return {
        "mensaje": "Lote registrado correctamente",
        "lote": nuevo
    }


# =========================
# INVENTARIO - ACTUALIZAR
# =========================

@app.put("/api/lotes/{lote_id}")
def actualizar_lote(
    lote_id: int,
    lote: LoteActualizar
):

    if lote.cantidad < 0:
        raise HTTPException(
            status_code=400,
            detail="La cantidad no puede ser negativa"
        )

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                UPDATE lote_inventario
                SET
                    cantidad = %s,
                    fecha_vencimiento = %s
                WHERE id = %s
                RETURNING *;
            """, (
                lote.cantidad,
                lote.fecha_vencimiento,
                lote_id
            ))

            actualizado = cursor.fetchone()

            if actualizado is None:
                raise HTTPException(
                    status_code=404,
                    detail="Lote no encontrado"
                )

    return {
        "mensaje": "Lote actualizado correctamente",
        "lote": actualizado
    }


# =========================
# INVENTARIO - ELIMINAR
# =========================

@app.delete("/api/lotes/{lote_id}")
def eliminar_lote(lote_id: int):

    with conectar() as conexion:
        with conexion.cursor(row_factory=dict_row) as cursor:

            cursor.execute("""
                DELETE FROM lote_inventario
                WHERE id = %s
                RETURNING
                    id,
                    numero_lote;
            """, (lote_id,))

            eliminado = cursor.fetchone()

            if eliminado is None:
                raise HTTPException(
                    status_code=404,
                    detail="Lote no encontrado"
                )

    return {
        "mensaje": "Lote eliminado correctamente",
        "lote": eliminado
    }