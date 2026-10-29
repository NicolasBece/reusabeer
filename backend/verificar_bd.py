
from base_datos import conectar

def main():
    with conectar() as conexion:
        resultado = conexion.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)

        print("TABLAS ENCONTRADAS:")
        tablas = resultado.fetchall()

        if tablas:
            for fila in tablas:
                print("-", fila[0])
        else:
            print("No se encontraron tablas.")

if __name__ == "__main__":
    main()
