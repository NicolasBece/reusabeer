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

class ProduccionCrear(BaseModel):

    producto_id: int
    material_utilizado: float
    producto_final: float
    usuario_id: int
    fecha: date
    observaciones: str | None = None
    destino_id: int | None = None
    tipo_residuo: str | None = None
    observaciones_residuo: str | None = None





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



@app.get("/api/dashboard")

def obtener_dashboard():

    with conectar() as conexion:

        with conexion.cursor() as cursor:



            # Eficiencia promedio de producción

            cursor.execute("""

                SELECT COALESCE(ROUND(AVG(eficiencia), 2), 0)

                FROM produccion

            """)

            eficiencia_promedio = cursor.fetchone()[0]



            # Inventario

            cursor.execute("""

                SELECT

                    COALESCE(SUM(cantidad), 0),

                    COUNT(*) FILTER (WHERE estado = 'disponible')

                FROM lote_inventario

            """)

            inventario = cursor.fetchone()

            stock_total = inventario[0]

            lotes_activos = inventario[1]



            # Lotes que vencen durante los próximos 7 días

            cursor.execute("""

                SELECT COUNT(*)

                FROM lote_inventario

                WHERE fecha_vencimiento >= CURRENT_DATE

                AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'

            """)

            lotes_por_vencer = cursor.fetchone()[0]



            # Envases

            cursor.execute("""

                SELECT

                    COUNT(*),

                    COUNT(*) FILTER (WHERE estado = 'en_distribucion'),

                    COUNT(*) FILTER (WHERE estado = 'en_bodega')

                FROM envase

            """)

            envases = cursor.fetchone()



            envases_total = envases[0]

            envases_distribucion = envases[1]

            envases_bodega = envases[2]



            # Residuos y aprovechamiento

            cursor.execute("""

                SELECT

                    COALESCE(SUM(r.cantidad), 0),

                    COALESCE(

                        SUM(

                            CASE

                                WHEN d.aprovechado = TRUE

                                THEN r.cantidad

                                ELSE 0

                            END

                        ), 0

                    )

                FROM residuo r

                LEFT JOIN destino_residuo d

                    ON d.id = r.destino_id

            """)

            residuos = cursor.fetchone()



            residuos_total = residuos[0]

            residuos_aprovechados = residuos[1]



            if residuos_total and residuos_total > 0:

                porcentaje_aprovechado = round(

                    float(residuos_aprovechados)

                    / float(residuos_total)

                    * 100,

                    1

                )

            else:

                porcentaje_aprovechado = 0



            # Últimos registros de producción

            cursor.execute("""

                SELECT

                    p.id,

                    p.fecha,

                    pr.nombre,

                    p.producto_final,

                    p.desperdicio,

                    p.eficiencia

                FROM produccion p

                INNER JOIN producto pr

                    ON pr.id = p.producto_id

                ORDER BY p.id DESC

                LIMIT 5

            """)



            filas = cursor.fetchall()



            ultimas_producciones = [

                {

                    "id": fila[0],

                    "fecha": fila[1],

                    "producto": fila[2],

                    "producto_final": float(fila[3]),

                    "desperdicio": float(fila[4]),

                    "eficiencia": float(fila[5])

                }

                for fila in filas

            ]



    return {

        "eficiencia_promedio": float(eficiencia_promedio),

        "stock_total": int(stock_total),

        "lotes_activos": int(lotes_activos),

        "lotes_por_vencer": int(lotes_por_vencer),



        "envases_total": int(envases_total),

        "envases_distribucion": int(envases_distribucion),

        "envases_bodega": int(envases_bodega),



        "residuos_total": float(residuos_total),

        "residuos_aprovechados": float(residuos_aprovechados),

        "porcentaje_residuos_aprovechados": porcentaje_aprovechado,



        "ultimas_producciones": ultimas_producciones

    }





# =========================

# REPORTES

# =========================


@app.get("/api/reportes/periodos")
def listar_periodos_reportes():

    with conectar() as conexion:
        with conexion.cursor() as cursor:

            cursor.execute("""
                SELECT DISTINCT TO_CHAR(fecha, 'YYYY-MM') AS periodo
                FROM produccion
                ORDER BY periodo DESC;
            """)

            periodos = [fila[0] for fila in cursor.fetchall()]

    return periodos


@app.get("/api/reportes/{periodo}")
def obtener_reporte_mensual(periodo: str):

    try:
        inicio = date.fromisoformat(f"{periodo}-01")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="El período debe tener el formato YYYY-MM"
        )

    with conectar() as conexion:
        with conexion.cursor() as cursor:

            # Datos generales de producción del período
            cursor.execute("""
                SELECT
                    COALESCE(SUM(producto_final), 0),
                    COALESCE(ROUND(AVG(eficiencia), 2), 0),
                    COALESCE(SUM(desperdicio), 0),
                    COUNT(*)
                FROM produccion
                WHERE fecha >= %s
                AND fecha < (%s + INTERVAL '1 month');
            """, (inicio, inicio))

            produccion = cursor.fetchone()

            produccion_total = produccion[0]
            eficiencia_promedio = produccion[1]
            desperdicio_total = produccion[2]
            procesos = produccion[3]

            # Residuos del período
            cursor.execute("""
                SELECT
                    COALESCE(SUM(r.cantidad), 0),
                    COALESCE(
                        SUM(
                            CASE
                                WHEN d.aprovechado = TRUE
                                THEN r.cantidad
                                ELSE 0
                            END
                        ),
                        0
                    )
                FROM residuo r
                INNER JOIN produccion p
                    ON p.id = r.produccion_id
                LEFT JOIN destino_residuo d
                    ON d.id = r.destino_id
                WHERE p.fecha >= %s
                AND p.fecha < (%s + INTERVAL '1 month');
            """, (inicio, inicio))

            residuos = cursor.fetchone()

            residuos_total = residuos[0]
            residuos_aprovechados = residuos[1]

            if residuos_total and residuos_total > 0:
                porcentaje_aprovechado = round(
                    float(residuos_aprovechados)
                    / float(residuos_total)
                    * 100,
                    1
                )
                porcentaje_disposicion = round(
                    100 - porcentaje_aprovechado,
                    1
                )
            else:
                porcentaje_aprovechado = 0
                porcentaje_disposicion = 0

            # Producciones registradas durante el período
            cursor.execute("""
                SELECT
                    p.id,
                    p.fecha,
                    pr.nombre,
                    p.material_utilizado,
                    p.producto_final,
                    p.desperdicio,
                    p.eficiencia
                FROM produccion p
                INNER JOIN producto pr
                    ON pr.id = p.producto_id
                WHERE p.fecha >= %s
                AND p.fecha < (%s + INTERVAL '1 month')
                ORDER BY p.fecha DESC, p.id DESC;
            """, (inicio, inicio))

            filas = cursor.fetchall()

            producciones = [
                {
                    "id": fila[0],
                    "fecha": fila[1],
                    "producto": fila[2],
                    "material_utilizado": float(fila[3]),
                    "producto_final": float(fila[4]),
                    "desperdicio": float(fila[5]),
                    "eficiencia": float(fila[6])
                }
                for fila in filas
            ]

    return {
        "periodo": periodo,
        "produccion_total": float(produccion_total),
        "eficiencia_promedio": float(eficiencia_promedio),
        "desperdicio_total": float(desperdicio_total),
        "procesos": int(procesos),
        "residuos_total": float(residuos_total),
        "residuos_aprovechados": float(residuos_aprovechados),
        "porcentaje_aprovechado": porcentaje_aprovechado,
        "porcentaje_disposicion": porcentaje_disposicion,
        "producciones": producciones
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



# =========================

# VENCIMIENTOS

# =========================



@app.get("/api/vencimientos")

def listar_vencimientos():



    with conectar() as conexion:

        with conexion.cursor(row_factory=dict_row) as cursor:



            cursor.execute("""

                SELECT

                    l.id,

                    l.numero_lote,

                    l.producto_id,

                    p.nombre AS producto,

                    l.cantidad,

                    l.fecha_ingreso,

                    l.fecha_vencimiento,

                    l.estado,



                    (l.fecha_vencimiento - CURRENT_DATE)

                        AS dias_restantes



                FROM lote_inventario l



                INNER JOIN producto p

                    ON p.id = l.producto_id



                WHERE

                    l.fecha_vencimiento <= CURRENT_DATE + 7



                ORDER BY

                    l.fecha_vencimiento ASC;

            """)



            return cursor.fetchall()



        # =========================

# PRODUCCIÓN - LISTAR

# =========================



@app.get("/api/producciones")

def listar_producciones():



    with conectar() as conexion:

        with conexion.cursor(row_factory=dict_row) as cursor:



            cursor.execute("""

                SELECT

                    pr.id,

                    pr.fecha,

                    pr.producto_id,

                    p.nombre AS producto,

                    pr.material_utilizado,

                    pr.producto_final,

                    pr.desperdicio,

                    pr.eficiencia,

                    pr.observaciones,

                    pr.usuario_id,

                    u.nombre AS usuario

                FROM produccion pr



                INNER JOIN producto p

                    ON p.id = pr.producto_id



                INNER JOIN usuario u

                    ON u.id = pr.usuario_id



                ORDER BY pr.fecha DESC, pr.id DESC;

            """)



            return cursor.fetchall()





# =========================

# DESTINOS DE RESIDUO

# =========================



@app.get("/api/destinos-residuo")

def listar_destinos_residuo():



    with conectar() as conexion:

        with conexion.cursor(row_factory=dict_row) as cursor:



            cursor.execute("""

                SELECT

                    id,

                    nombre,

                    descripcion,

                    observaciones,

                    aprovechado

                FROM destino_residuo

                ORDER BY id;

            """)



            return cursor.fetchall()



# =========================

# PRODUCCIÓN - REGISTRAR

# =========================



@app.post("/api/producciones")

def registrar_produccion(datos: ProduccionCrear):



    if datos.material_utilizado <= 0:

        raise HTTPException(

            status_code=400,

            detail="La materia prima utilizada debe ser mayor que cero"

        )



    if datos.producto_final < 0:

        raise HTTPException(

            status_code=400,

            detail="El producto final no puede ser negativo"

        )



    desperdicio = max(

        0,

        datos.material_utilizado - datos.producto_final

    )



    eficiencia = (

        datos.producto_final /

        datos.material_utilizado

    ) * 100



    with conectar() as conexion:

        with conexion.cursor(row_factory=dict_row) as cursor:



            # Verificar producto

            cursor.execute("""

                SELECT id

                FROM producto

                WHERE id = %s;

            """, (datos.producto_id,))



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

            """, (datos.usuario_id,))



            if cursor.fetchone() is None:

                raise HTTPException(

                    status_code=404,

                    detail="Usuario no encontrado"

                )



            # Si hay desperdicio, exigir destino

            if desperdicio > 0:



                if datos.destino_id is None:

                    raise HTTPException(

                        status_code=400,

                        detail="Debe asignar un destino al residuo"

                    )



                cursor.execute("""

                    SELECT id

                    FROM destino_residuo

                    WHERE id = %s;

                """, (datos.destino_id,))



                if cursor.fetchone() is None:

                    raise HTTPException(

                        status_code=404,

                        detail="Destino de residuo no encontrado"

                    )



            # Registrar producción

            cursor.execute("""

                INSERT INTO produccion (

                    fecha,

                    producto_id,

                    material_utilizado,

                    producto_final,

                    observaciones,

                    usuario_id

                )

                VALUES (

                    %s, %s, %s, %s,

                    %s, %s

                )

                RETURNING *;

            """, (

                datos.fecha,

                datos.producto_id,

                datos.material_utilizado,

                datos.producto_final,

                datos.observaciones,

                datos.usuario_id

            ))



            produccion = cursor.fetchone()



            residuo = None



            # Registrar residuo antes de confirmar

            # la transacción para cumplir el trigger.

            if desperdicio > 0:



                cursor.execute("""

                    INSERT INTO residuo (

                        produccion_id,

                        cantidad,

                        destino_id,

                        tipo,

                        observaciones

                    )

                    VALUES (%s, %s, %s, %s, %s)

                    RETURNING *;

                """, (

                    produccion["id"],

                    desperdicio,

                    datos.destino_id,

                    datos.tipo_residuo or "Merma de producción",

                    datos.observaciones_residuo

                ))



                residuo = cursor.fetchone()



    return {

        "mensaje": "Producción registrada correctamente",

        "produccion": produccion,

        "residuo": residuo

    }