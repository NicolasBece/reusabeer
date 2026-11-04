
from fastapi import FastAPI, HTTPException
from base_datos import conectar

app = FastAPI(
    title="Reusabeer API",
    description="Sistema de gestión de Reusabeer",
    version="1.0.0"
)


@app.get("/")
def inicio():
    return {
        "mensaje": "Bienvenido a Reusabeer",
        "estado": "API funcionando correctamente"
    }


@app.get("/salud")
def comprobar_estado():
    return {
        "estado": "activo"
    }


@app.get("/salud-db")
def comprobar_base_datos():
    try:
        with conectar() as conexion:
            conexion.execute("SELECT 1")

        return {
            "estado": "conectado",
            "base_datos": "PostgreSQL",
            "mensaje": "Conexión correcta"
        }

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="No fue posible conectar con PostgreSQL"
        )
