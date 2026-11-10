// Pantalla: Reporte de sostenibilidad.

let periodosReporte = [];
let periodoReporteActual = null;
let reporteActual = null;
let reporteCargando = false;


// Formato de números
function numeroReporte(valor) {
    return Number(valor || 0).toLocaleString('es-CO', {
        maximumFractionDigits: 2
    });
}


// Convierte 2026-11 en Noviembre 2026
function nombrePeriodo(periodo) {
    const meses = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre'
    ];

    if (!periodo) return '';

    const [anio, mes] = periodo.split('-');

    return `${meses[Number(mes) - 1]} ${anio}`;
}


// Vista: Reporte de sostenibilidad
V.rep = () => {

    if (!reporteActual) {
        return `
            <div class="card">
                <p class="mut">
                    Cargando reporte de sostenibilidad...
                </p>
            </div>
        `;
    }

    const r = reporteActual;

    const registros = r.producciones?.length
        ? r.producciones.map(p => `
            <div class="row">

                <div class="gr">
                    <b>${p.producto}</b>

                    <small class="mut">
                        ${fd(p.fecha)}
                        · Producción: ${numeroReporte(p.producto_final)}
                        · Merma: ${numeroReporte(p.desperdicio)}
                    </small>
                </div>

                <span class="chip ${
                    p.eficiencia >= 85 ? 'c-ok' : 'c-bad'
                }">
                    ${Number(p.eficiencia).toFixed(1)}%
                </span>

            </div>
        `).join('')
        : `
            <p class="mut">
                No existen registros para este período.
            </p>
        `;

    return `

        <div class="tools">

            <label class="srch srch-corto">

                ${i('cal')}

                <select
                    id="rpp"
                    class="sin-borde"
                >

                    ${periodosReporte.map(periodo => `
                        <option
                            value="${periodo}"
                            ${
                                periodo === periodoReporteActual
                                    ? 'selected'
                                    : ''
                            }
                        >
                            ${nombrePeriodo(periodo)}
                        </option>
                    `).join('')}

                </select>

            </label>


            <button
                class="btn dk push"
                id="exExcel"
            >
                ${i('down')}
                Exportar Excel
            </button>


            <button
                class="btn"
                id="exPdf"
            >
                ${i('down')}
                Exportar PDF
            </button>

        </div>


        <div class="g g4">

            ${kpi(
                'flask',
                'h',
                `${numeroReporte(r.produccion_total)} L`,
                'Producción total',
                `${r.procesos} procesos registrados`
            )}

            ${kpi(
                'trend',
                'v',
                `${Number(r.eficiencia_promedio).toFixed(1)}%`,
                'Eficiencia promedio',
                `Merma total: ${numeroReporte(r.desperdicio_total)}`
            )}

            ${kpi(
                'leaf',
                'v',
                `${Number(r.porcentaje_aprovechado).toFixed(1)}%`,
                'Residuos aprovechados',
                `${numeroReporte(r.residuos_aprovechados)} aprovechados`
            )}

            ${kpi(
                'trash',
                'r',
                `${Number(r.porcentaje_disposicion).toFixed(1)}%`,
                'Disposición final',
                `${numeroReporte(r.residuos_total)} residuos registrados`
            )}

        </div>


        <div class="g g2 mt">

            <div class="card">

                <h3>
                    ${i('trend')}
                    Producción y mermas
                </h3>

                ${registros}

            </div>


            <div class="card">

                <h3>
                    ${i('leaf')}
                    Balance de residuos
                </h3>

                <br>

                ${donut(r.porcentaje_aprovechado)}

            </div>

        </div>
    `;
};


// Cargar períodos disponibles
async function cargarPeriodosReporte() {

    try {

        const respuesta = await apiFetch(
            'http://127.0.0.1:8000/api/reportes/periodos'
        );

        if (!respuesta.ok) {
            throw new Error(
                'No se pudieron cargar los períodos'
            );
        }

        periodosReporte = await respuesta.json();

        if (!periodosReporte.length) {

            reporteActual = {
                periodo: '',
                produccion_total: 0,
                eficiencia_promedio: 0,
                desperdicio_total: 0,
                procesos: 0,
                residuos_total: 0,
                residuos_aprovechados: 0,
                porcentaje_aprovechado: 0,
                porcentaje_disposicion: 0,
                producciones: []
            };

            go('rep');
            return;
        }


        if (!periodoReporteActual) {
            periodoReporteActual = periodosReporte[0];
        }

        await cargarReporte(periodoReporteActual);

    } catch (error) {

        console.error(error);

        toast(
            'Error al cargar períodos del reporte'
        );
    }
}


// Obtener reporte mensual
async function cargarReporte(periodo) {

    if (reporteCargando) return;

    reporteCargando = true;

    try {

        const respuesta = await apiFetch(
            `http://127.0.0.1:8000/api/reportes/${periodo}`
        );

        if (!respuesta.ok) {
            throw new Error(
                'No se pudo cargar el reporte'
            );
        }

        reporteActual = await respuesta.json();
        periodoReporteActual = periodo;

        go('rep');

    } catch (error) {

        console.error(error);

        toast(
            'Error al cargar reporte'
        );

    } finally {

        reporteCargando = false;
    }
}


// Exportar reporte como CSV compatible con Excel
function exportarReporteExcel() {

    if (!reporteActual) return;

    const r = reporteActual;

    const filas = [

        ['REPORTE DE SOSTENIBILIDAD REUSABEER'],

        [
            'Periodo',
            nombrePeriodo(r.periodo)
        ],

        [],

        [
            'Produccion total',
            r.produccion_total
        ],

        [
            'Eficiencia promedio',
            `${r.eficiencia_promedio}%`
        ],

        [
            'Merma total',
            r.desperdicio_total
        ],

        [
            'Residuos aprovechados',
            `${r.porcentaje_aprovechado}%`
        ],

        [],

        [
            'Fecha',
            'Producto',
            'Materia utilizada',
            'Producto final',
            'Merma',
            'Eficiencia'
        ],

        ...r.producciones.map(p => [
            p.fecha,
            p.producto,
            p.material_utilizado,
            p.producto_final,
            p.desperdicio,
            `${p.eficiencia}%`
        ])
    ];


    const csv = filas
        .map(fila =>
            fila
                .map(valor =>
                    `"${String(valor ?? '')
                        .replaceAll('"', '""')}"`
                )
                .join(';')
        )
        .join('\n');


    const archivo = new Blob(
        ['\ufeff' + csv],
        {
            type: 'text/csv;charset=utf-8;'
        }
    );


    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement('a');

    enlace.href = url;

    enlace.download =
        `reporte_reusabeer_${r.periodo}.csv`;

    enlace.click();

    URL.revokeObjectURL(url);

    toast(
        'Reporte exportado para Excel'
    );
}


// Eventos
B.rep = () => {

    if (
        periodosReporte.length === 0 ||
        !reporteActual
    ) {
        cargarPeriodosReporte();
        return;
    }


    const selector = $('#rpp');

    if (selector) {

        selector.onchange = e => {
            cargarReporte(e.target.value);
        };
    }


    const excel = $('#exExcel');

    if (excel) {

        excel.onclick = () => {
            exportarReporteExcel();
        };
    }


    const pdf = $('#exPdf');

    if (pdf) {

        pdf.onclick = () => {

            toast(
                'Selecciona "Guardar como PDF" en la ventana de impresión'
            );

            window.print();
        };
    }
};