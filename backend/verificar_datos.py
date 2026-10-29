
from base_datos import conectar

def main():
    tablas = [
        "producto",
        "envase",
        "lote_inventario",
        "produccion",
        "movimiento_envase",
        "residuo",
        "destino_residuo",
        "reporte",
    ]

    with conectar() as conexion:
        print("CANTIDAD DE REGISTROS POR TABLA:\n")

        for tabla in tablas:
            resultado = conexion.execute(
                f'SELECT COUNT(*) FROM "{tabla}"'
            )
            cantidad = resultado.fetchone()[0]
            print(f"{tabla}: {cantidad} registros")

if __name__ == "__main__":
    main()
