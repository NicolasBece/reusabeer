// Datos de ejemplo y estado de la interfaz. Todo vive en memoria (sin backend): al recargar vuelve al inicio.
// Cuando exista el backend, estos datos se reemplazarán por llamadas a la API (Python + PostgreSQL).

// Fecha "de hoy" fija para que la demo siempre muestre los mismos vencimientos
const HOY = new Date('2026-10-01');

// Lotes de inventario (datos de ejemplo). s = stock, m = stock mínimo, ing = ingreso, v = vencimiento
let lotes = [
  {
    id: 'L-2026-081',
    p: 'Cerveza Lager 500 ml',
    t: 'Lager',
    s: 450,
    m: 100,
    ing: '2026-09-15',
    v: '2026-10-03'
  },
  {
    id: 'L-2026-084',
    p: 'Cerveza Stout 330 ml',
    t: 'Stout',
    s: 280,
    m: 80,
    ing: '2026-09-18',
    v: '2026-10-05'
  },
  {
    id: 'L-2026-089',
    p: 'Cerveza IPA 500 ml',
    t: 'IPA',
    s: 620,
    m: 150,
    ing: '2026-09-20',
    v: '2026-10-07'
  },
  {
    id: 'L-2026-072',
    p: 'Cerveza Trigo 500 ml',
    t: 'Trigo',
    s: 120,
    m: 100,
    ing: '2026-09-01',
    v: '2026-09-28'
  },
  {
    id: 'L-2026-092',
    p: 'Cerveza Trigo 500 ml',
    t: 'Trigo',
    s: 890,
    m: 100,
    ing: '2026-09-25',
    v: '2026-11-25'
  },
  {
    id: 'L-2026-095',
    p: 'Cerveza Amber Ale 500 ml',
    t: 'Ale',
    s: 1200,
    m: 200,
    ing: '2026-09-28',
    v: '2026-12-15'
  }
];

// Usuarios: [id, nombre, correo, rol, módulos, activo (1/0)]
let users = [
  [
    'USR-01',
    'Joahn Becerra',
    'j.becerra@reusabeer.com',
    'Administrador',
    'Acceso total',
    1
  ],
  [
    'USR-02',
    'Juan S. Sánchez',
    'j.sanchez@reusabeer.com',
    'Operario de producción',
    'Producción, residuos',
    1
  ],
  [
    'USR-03',
    'Alied Garzón',
    'a.garzon@reusabeer.com',
    'Encargado de inventario',
    'Inventario, lotes',
    1
  ],
  [
    'USR-04',
    'Carlos Ruiz',
    'c.ruiz@reusabeer.com',
    'Repartidor',
    'Envases, trazabilidad',
    1
  ]
];

// Envases por código, con su historial de movimientos [fecha, movimiento, responsable]
let envs = {
  'ENV-2026-0894': {
    prod: 'Cerveza IPA 500 ml',
    tipo: 'Botella retornable · vidrio ámbar',
    est: 'En distribución',
    ub: 'Repartidor ruta 04',
    fr: '12/01/2026',
    h: [
      [ '01/10/2026 10:30', 'Salida a distribución', 'Carlos Ruiz' ],
      [ '28/09/2026 16:15', 'Reingreso y lavado', 'Bodega 02' ],
      [ '25/09/2026 11:00', 'Entrega a cliente', 'Bar El Lúpulo' ]
    ]
  },
  'ENV-2026-0895': {
    prod: 'Cerveza Stout 330 ml',
    tipo: 'Botella retornable · vidrio verde',
    est: 'En bodega',
    ub: 'Bodega 01',
    fr: '15/01/2026',
    h: [ [ '30/09/2026 09:10', 'Reingreso y lavado', 'Bodega 01' ] ]
  }
};

// Estado de la interfaz (se pierde al recargar):
let envSel = 'ENV-2026-0894';

let merma = 150;

let prodRes = { u: 1200, f: 1050 };

let destSel = 0;

let tab = 0;

let rp = 'Septiembre 2026';

let cur = 'dash';

// Destinos posibles del residuo: [nombre, descripción, ícono, tipo]
const DEST = [
  [ 'Reciclaje', 'Vidrio, cartón o plásticos a planta recicladora', 'repeat', 'ok' ],
  [ 'Compostaje', 'Bagazo de malta convertido en abono orgánico', 'sprout', 'ok' ],
  [ 'Reutilización', 'Envases retornables a lavado e inspección', 'bottle', 'ok' ],
  [ 'Donación', 'Materia prima residual entregada a terceros', 'gift', 'ok' ],
  [
    'Disposición final',
    'Relleno sanitario: aumenta los residuos a vertedero',
    'trash',
    'bad'
  ]
];

// Menú lateral: [clave, ícono, texto del menú, título de página, subtítulo]
const N = [
  [ 'dash', 'dash', 'Inicio', 'Panel general', 'Resumen del día en tu cervecería' ],
  [
    'inv',
    'box',
    'Inventario',
    'Inventario y lotes',
    'Existencias, ingresos y vencimientos'
  ],
  [ 'venc', 'clock', 'Por vencer', 'Productos por vencer', 'Lo que debe salir primero' ],
  [
    'prod',
    'flask',
    'Producción',
    'Producción y mermas',
    'Registra un proceso y revisa su eficiencia'
  ],
  [ 'res', 'leaf', 'Residuos', 'Destino de residuos', 'Elige qué pasa con el desperdicio' ],
  [ 'env', 'bottle', 'Envases', 'Envases y trazabilidad', 'Sigue cada envase por su ID' ],
  [
    'rep',
    'chart',
    'Reportes',
    'Reporte de sostenibilidad',
    'Producción, eficiencia y residuos aprovechados'
  ],
  [ 'usr', 'users', 'Usuarios', 'Usuarios y roles', 'Quién entra y qué puede hacer' ]
];

// Reporte por periodo: [producción, lotes, eficiencia, tendencia, % aprovechado]
const RP = {
  'Septiembre 2026': [ '12.800 L', '18 lotes procesados', '91,2%', '+2,1% vs mes anterior', 83.5 ],
  'Agosto 2026': [ '11.900 L', '16 lotes procesados', '89,1%', '+0,8% vs mes anterior', 79.2 ]
};
