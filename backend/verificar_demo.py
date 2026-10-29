
from base_datos import conectar

def main():
    consultas = {
        "Lotes de inventario": "SELECT COUNT(*) FROM lote_inventario",
        "Producciones": "SELECT COUNT(*) FROM produccion",
        "Residuos": "SELECT COUNT(*) FROM residuo",
        "Envases": "SELECT COUNT(*) FROM envase",
        "Movimientos de envases": "SELECT COUNT(*) FROM movimiento_envase",
    }

    with conectar() as conexion:
        for nombre, consulta in consultas.items():
            resultado = conexion.execute(consulta)
            cantidad = resultado.fetchone()[0]
            print(f"{nombre}: {cantidad}")

if __name__ == "__main__":
    main()
