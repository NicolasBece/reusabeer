
from base_datos import conectar

def main():
    with conectar() as conexion:
        resultado = conexion.execute("""
            SELECT u.nombre, u.email, r.nombre AS rol
            FROM usuario AS u
            JOIN rol AS r ON r.id = u.rol_id
            ORDER BY u.email;
        """)

        print("USUARIOS REGISTRADOS:")

        for nombre, email, rol in resultado.fetchall():
            print(f"{email} | {nombre} | Rol: {rol}")

if __name__ == "__main__":
    main()
