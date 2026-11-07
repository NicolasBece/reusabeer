// Estado global y configuración compartida de la interfaz.

// Fecha actual normalizada para cálculos de vencimiento
const HOY = new Date();
HOY.setHours(0, 0, 0, 0);

// Estado compartido
let envs = {};
let envSel = '';

let merma = 0;
let prodRes = { u: 0, f: 0 };

let cur = 'dash';

// Menú lateral:
// [clave, ícono, texto del menú, título de página, subtítulo]
const N = [
    [
        'dash',
        'dash',
        'Inicio',
        'Panel general',
        'Resumen del día en tu cervecería'
    ],
    [
        'inv',
        'box',
        'Inventario',
        'Inventario y lotes',
        'Existencias, ingresos y vencimientos'
    ],
    [
        'venc',
        'clock',
        'Por vencer',
        'Productos por vencer',
        'Lo que debe salir primero'
    ],
    [
        'prod',
        'flask',
        'Producción',
        'Producción y mermas',
        'Registra un proceso y revisa su eficiencia'
    ],
    [
        'res',
        'leaf',
        'Residuos',
        'Destino de residuos',
        'Elige qué pasa con el desperdicio'
    ],
    [
        'env',
        'bottle',
        'Envases',
        'Envases y trazabilidad',
        'Sigue cada envase por su ID'
    ],
    [
        'rep',
        'chart',
        'Reportes',
        'Reporte de sostenibilidad',
        'Producción, eficiencia y residuos aprovechados'
    ],
    [
        'usr',
        'users',
        'Usuarios',
        'Usuarios y roles',
        'Quién entra y qué puede hacer'
    ]
];